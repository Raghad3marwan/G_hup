/**
 * BootOrchestrator
 * -----------------
 * ينفّذ تسلسل الإقلاع المتفق عليه بالضبط (بعد التعديل الأول من المراجعة):
 *
 *   1) Access Resolution        (AccessProvider.resolveSession)
 *   2) Case Content Loading     (CaseContentProvider: manifest ثم caseData)
 *   3) Save Check                (PersistenceProvider.load)
 *   4) New Game أو Continue      (قرار خارجي عبر decideContinueOrNew إن وُجد حفظ)
 *   5) عند Continue: Load → Migrate → Reconcile
 *   6) Render (خارج نطاق هذا الملف — فقط نُصدر boot:complete وما يلزم لعرض الواجهة)
 *
 * BootOrchestrator لا "يقرر" شيئًا بخصوص المنطق الداخلي لأي Domain؛ فقط ينسّق
 * الترتيب بين Providers + State Manager + Rule Engine.
 */

import { createInitialGameState } from '../state/createInitialGameState.js';
import { migrateGameState } from '../state/migrateGameState.js';
import { reconcileGameState } from '../state/reconcileGameState.js';
import { deepFreeze } from '../utils/deepFreeze.js';

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * @param {object} deps
 * @param {import('../providers/access/AccessProvider.interface.js').AccessProvider} deps.accessProvider
 * @param {import('../providers/case-content/CaseContentProvider.interface.js').CaseContentProvider} deps.caseContentProvider
 * @param {import('../providers/persistence/PersistenceProvider.interface.js').PersistenceProvider} deps.persistenceProvider
 * @param {import('../state/StateManager.js').StateManager} deps.stateManager
 * @param {import('../../rules/EventBus.js').EventBus} deps.eventBus
 * @param {import('../../rules/RuleEngine.js').RuleEngine} deps.ruleEngine
 * @param {object} accessInput يُمرَّر كما هو إلى accessProvider.resolveSession()
 * @param {(savedRecord: { schemaVersion:number, state:object, savedAt:number }) => Promise<'continue'|'new'>} [decideContinueOrNew]
 *   دالة تقرر (عادة بسؤال المستخدم عبر الواجهة لاحقًا) بين الاستمرار أو بدء جديد
 *   عند وجود حفظ سابق. القيمة الافتراضية تختار "continue" تلقائيًا (مناسب للاختبار الآلي).
 *
 * @returns {Promise<{ caseId: string, authToken: string|null, manifest: object, caseData: object, mode: 'new'|'continue' }>}
 */
export async function boot({
  accessProvider,
  caseContentProvider,
  persistenceProvider,
  stateManager,
  eventBus,
  ruleEngine,
  accessInput = {},
  decideContinueOrNew = async () => 'continue',
}) {
  // --- المرحلة 1: Access Resolution ---
  eventBus.emit('boot:phase', { phase: 'access-resolution' });
  const { caseId, authToken } = await accessProvider.resolveSession(accessInput);
  if (!caseId) {
    throw new Error('[BootOrchestrator] AccessProvider لم يُرجع caseId صالحًا.');
  }

  // --- المرحلة 2: Case Content Loading ---
  eventBus.emit('boot:phase', { phase: 'case-content-loading', caseId });
  const manifest = await caseContentProvider.getManifest(caseId, authToken);
  const caseData = await caseContentProvider.getCaseData(caseId, authToken);
  deepFreeze(caseData); // إنفاذ فعلي وكامل (وليس سطحيًا فقط) لقاعدة "CASE_DATA لا تُعدَّل أثناء اللعب"

  // --- Lifecycle: منع تكرار Rules/Listeners عند تشغيل Boot أكثر من مرة في نفس الجلسة ---
  // ترتيب إلزامي: dispose (تنظيف أي تسجيل سابق) ← attachContext (حالة/قضية حاليتان)
  // ← registerRules (قواعد القضية الحالية فقط). أي ترتيب آخر يسمح إما بتسريب
  // اشتراكات EventBus قديمة، أو بتنفيذ Actions على سياق (caseData/stateManager) بائد.
  ruleEngine.dispose();
  ruleEngine.attachContext({ stateManager, caseData });
  ruleEngine.registerRules(caseData.rules || []);

  // --- المرحلة 3: Save Check ---
  eventBus.emit('boot:phase', { phase: 'save-check', caseId });
  const savedRecord = await persistenceProvider.load(caseId);

  let gameState;
  let mode;

  if (!savedRecord) {
    // --- لا يوجد حفظ: New Game مباشرة ---
    mode = 'new';
    gameState = createInitialGameState({ caseId, schemaVersion: CURRENT_SCHEMA_VERSION, manifest });
  } else {
    // --- المرحلة 4: قرار Continue/New عند وجود حفظ ---
    eventBus.emit('boot:phase', { phase: 'awaiting-continue-decision', caseId, savedRecord });
    const choice = await decideContinueOrNew(savedRecord);

    if (choice === 'new') {
      mode = 'new';
      gameState = createInitialGameState({ caseId, schemaVersion: CURRENT_SCHEMA_VERSION, manifest });
      await persistenceProvider.clear(caseId);
    } else {
      // --- المرحلة 5: Continue → Load (تم) → Migrate → Reconcile ---
      mode = 'continue';
      eventBus.emit('boot:phase', { phase: 'migrate', caseId });
      let loadedState = migrateGameState(savedRecord.state, savedRecord.schemaVersion, CURRENT_SCHEMA_VERSION);

      eventBus.emit('boot:phase', { phase: 'reconcile', caseId });
      loadedState = reconcileGameState(loadedState, caseData);

      gameState = loadedState;
    }
  }

  stateManager.replaceState(gameState);

  // --- المرحلة 6: إشارة اكتمال الإقلاع (الـ Render فعليًا خارج مسؤولية هذا الملف) ---
  eventBus.emit('boot:complete', { mode, caseId, authToken, manifest });

  return { caseId, authToken, manifest, caseData, mode };
}
