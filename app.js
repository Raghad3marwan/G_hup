/**
 * app.js — نقطة تركيب الواجهة الفعلية (App Shell)
 * ----------------------------------------------------
 * هذا هو المدخل الذي سيستخدمه اللاعب فعليًا (index.html). يقوم تلقائيًا
 * بتشغيل Boot Flow الكامل (بنفس BootOrchestrator المعتمد في Foundation
 * دون أي تعديل عليه)، ثم يركّب App Shell بعد اكتمال الإقلاع.
 *
 * أداة اختبار Foundation المنفصلة (New/Continue يدويًا، حفظ يدوي، مسح حفظ...)
 * لا تزال متاحة بشكلها الكامل في dev/boot-harness.html، ولم تُمس.
 */

import { StateManager } from './engine/core/state/StateManager.js';
import { EventBus } from './engine/rules/EventBus.js';
import { ConditionEngine } from './engine/rules/ConditionEngine.js';
import { ActionEngine } from './engine/rules/ActionEngine.js';
import { RuleEngine } from './engine/rules/RuleEngine.js';
import { boot } from './engine/core/boot/BootOrchestrator.js';

import { DevAccessProvider } from './engine/core/providers/access/DevAccessProvider.js';
import { LocalCaseProvider } from './engine/core/providers/case-content/LocalCaseProvider.js';
import { LocalStoragePersistenceProvider } from './engine/core/providers/persistence/LocalStoragePersistenceProvider.js';

import { showBootDecisionScreen } from './shell/BootScreen.js';
import { mountShell } from './shell/Shell.js';
import { discoverEvidence } from './engine/domains/evidence/EvidenceDomain.js';
import { installProgressionSync } from './engine/core/progression/ProgressionEngine.js';
import { installLabRuntimeWatcher } from './engine/domains/lab/LabDomain.js';

const CASE_ID = 'case-natural-death';
const rootEl = document.getElementById('app-root');

// ---------- Foundation Core (بلا أي تعديل معماري) ----------
const stateManager = new StateManager();
const eventBus = new EventBus();
const conditionEngine = new ConditionEngine();
const actionEngine = new ActionEngine();
const ruleEngine = new RuleEngine({ eventBus, conditionEngine, actionEngine });

// ---------- Providers محلية (نفس المستخدمة في Foundation) ----------
const accessProvider = new DevAccessProvider({ defaultCaseId: CASE_ID });
const caseContentProvider = new LocalCaseProvider({ casesRootPath: '/cases' });
const persistenceProvider = new LocalStoragePersistenceProvider();

async function start() {
  try {
    const bootResult = await boot({
      accessProvider,
      caseContentProvider,
      persistenceProvider,
      stateManager,
      eventBus,
      ruleEngine,
      accessInput: { caseId: CASE_ID },
      decideContinueOrNew: (savedRecord) => showBootDecisionScreen(rootEl, savedRecord),
    });

    // إتاحة مواد الملف التي تصل للمحقق منذ لحظة استلام القضية.
    for (const evidence of (bootResult.caseData.evidence || [])) {
      if (evidence.initiallyAvailable && stateManager.getState()?.evidenceState?.[evidence.id]?.discovery !== 'discovered') {
        discoverEvidence({ evidenceId:evidence.id, source:{type:'caseFile'}, caseData:bootResult.caseData, stateManager, eventBus });
      }
    }

    // مزامنة التقدم المعلن في Case Data (فتح مواد + حقائق مشتقة)
    installProgressionSync({ caseData: bootResult.caseData, stateManager });
    installLabRuntimeWatcher({ caseData: bootResult.caseData, stateManager, eventBus });

    // حفظ تلقائي لأي تقدم حتى تستمر التحاليل الزمنية بعد إعادة فتح اللعبة.
    let saveTimer = null;
    stateManager.subscribe((state) => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        persistenceProvider.save(CASE_ID, state.schemaVersion, state).catch((err) => {
          console.error('[app] تعذر الحفظ التلقائي:', err);
        });
      }, 120);
    });
    await persistenceProvider.save(CASE_ID, stateManager.getState().schemaVersion, stateManager.getState());

    mountShell({ container: rootEl, stateManager, eventBus, caseData: bootResult.caseData });
  } catch (err) {
    console.error('[app] فشل تشغيل Boot:', err);
    rootEl.innerHTML = `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding: 24px; text-align:center;">
        <div>
          <h1>تعذّر فتح الملف</h1>
          <p style="color: var(--jn-text-muted);">حدث خطأ أثناء تحميل التحقيق. جرّب إعادة تحميل الصفحة.</p>
        </div>
      </div>
    `;
  }
}

start();
