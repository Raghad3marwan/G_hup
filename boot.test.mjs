// اختبار منطقي مباشر لـ BootOrchestrator + الوحدات المرتبطة، بدون DOM/localStorage
// (Providers هنا Mocks بسيطة في الذاكرة فقط لأغراض التحقق من الصحة المنطقية).

import { StateManager } from '../engine/core/state/StateManager.js';
import { EventBus } from '../engine/rules/EventBus.js';
import { ConditionEngine } from '../engine/rules/ConditionEngine.js';
import { ActionEngine } from '../engine/rules/ActionEngine.js';
import { RuleEngine } from '../engine/rules/RuleEngine.js';
import { boot, CURRENT_SCHEMA_VERSION } from '../engine/core/boot/BootOrchestrator.js';

const CASE_DATA = {
  meta: { id: 'case-000-placeholder', title: 'test', schemaVersion: 1 },
  caseFile: { fileNumber: 'TEST-000' },
  people: [],
  rules: [
    {
      id: 'rule-test-flag-on-boot',
      trigger: 'boot:complete',
      conditions: { type: 'not', node: { type: 'flagTrue', key: 'devTestRuleFired' } },
      actions: [
        { type: 'setFlag', params: { key: 'devTestRuleFired', value: true } },
        { type: 'log', params: { message: 'rule fired' } },
      ],
    },
  ],
};

const MANIFEST = { id: 'case-000-placeholder', defaultSection: 'caseFile' };

class MockAccessProvider {
  async resolveSession(input) {
    return { caseId: input.caseId, authToken: null };
  }
}
class MockCaseContentProvider {
  async getManifest() { return MANIFEST; }
  async getCaseData() { return JSON.parse(JSON.stringify(CASE_DATA)); }
  async resolveAssetUrl(caseId, ref) { return `/mock/${ref}`; }
}
class MockPersistenceProvider {
  constructor() { this.store = new Map(); }
  async load(caseId) { return this.store.get(caseId) || null; }
  async save(caseId, schemaVersion, state) { this.store.set(caseId, { schemaVersion, state, savedAt: Date.now() }); }
  async clear(caseId) { this.store.delete(caseId); }
}

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
  console.log('  ✓ ' + msg);
}

async function run() {
  console.log('== Test 1: New Game (no save) ==');
  {
    const stateManager = new StateManager();
    const eventBus = new EventBus();
    const conditionEngine = new ConditionEngine();
    const actionEngine = new ActionEngine();
    const ruleEngine = new RuleEngine({ eventBus, conditionEngine, actionEngine });
    const persistenceProvider = new MockPersistenceProvider();

    const result = await boot({
      accessProvider: new MockAccessProvider(),
      caseContentProvider: new MockCaseContentProvider(),
      persistenceProvider,
      stateManager,
      eventBus,
      ruleEngine,
      accessInput: { caseId: 'case-000-placeholder' },
    });

    assert(result.mode === 'new', 'mode يجب أن يكون new');
    const state = stateManager.getState();
    assert(state.caseId === 'case-000-placeholder', 'caseId صحيح في GameState');
    assert(state.schemaVersion === CURRENT_SCHEMA_VERSION, 'schemaVersion صحيح');
    assert(state.flags.devTestRuleFired === true, 'Rule Engine نفّذ setFlag بنجاح عبر boot:complete');
    assert(Object.isFrozen(result.caseData), 'CaseData مجمّدة (Immutable) بعد التحميل');

    // حفظ يدوي ثم التأكد من استرجاعه
    await persistenceProvider.save(state.caseId, CURRENT_SCHEMA_VERSION, state);
    const saved = await persistenceProvider.load(state.caseId);
    assert(saved && saved.schemaVersion === CURRENT_SCHEMA_VERSION, 'الحفظ اليدوي يعمل');
  }

  console.log('== Test 2: Continue flow (save exists) ==');
  {
    const persistenceProvider = new MockPersistenceProvider();
    // نحاكي وجود حفظ مسبق يدويًا بإصدار مطابق للحالي
    const fakeSavedState = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      caseId: 'case-000-placeholder',
      meta: { startedAt: 1000, lastSavedAt: 1000 },
      assignmentSeen: true,
      evidenceState: {}, documentState: {}, personState: {}, interrogationState: {},
      contradictionState: {}, labJobs: {}, puzzleState: {}, boardLinks: [],
      notes: { automaticFacts: [], personalNotes: ['ملاحظة اختبار'] },
      hintsUsed: {}, notifications: [],
      flags: { devTestRuleFired: true }, // مضبوط مسبقًا: الشرط "not flagTrue" يجب ألا يُفعَّل الفعل مجددًا
      navigation: { activeSection: 'caseFile', activePersonId: null, activeDossierTab: null },
    };
    await persistenceProvider.save('case-000-placeholder', CURRENT_SCHEMA_VERSION, fakeSavedState);

    const stateManager = new StateManager();
    const eventBus = new EventBus();
    const conditionEngine = new ConditionEngine();
    const actionEngine = new ActionEngine();
    const ruleEngine = new RuleEngine({ eventBus, conditionEngine, actionEngine });

    let decisionWasAsked = false;
    const result = await boot({
      accessProvider: new MockAccessProvider(),
      caseContentProvider: new MockCaseContentProvider(),
      persistenceProvider,
      stateManager,
      eventBus,
      ruleEngine,
      accessInput: { caseId: 'case-000-placeholder' },
      decideContinueOrNew: async (savedRecord) => {
        decisionWasAsked = true;
        assert(savedRecord.schemaVersion === CURRENT_SCHEMA_VERSION, 'savedRecord يحمل schemaVersion صحيح عند سؤال المستخدم');
        return 'continue';
      },
    });

    assert(decisionWasAsked === true, 'تم استدعاء decideContinueOrNew فعليًا عند وجود حفظ');
    assert(result.mode === 'continue', 'mode يجب أن يكون continue');
    const state = stateManager.getState();
    assert(state.notes.personalNotes[0] === 'ملاحظة اختبار', 'الحالة المحمّلة (Continue) تحتفظ ببيانات الحفظ الأصلية');
    assert(state.assignmentSeen === true, 'assignmentSeen محفوظة من قبل ولم تُعاد للصفر');
  }

  console.log('== Test 3: New Game chosen despite existing save (يمسح الحفظ) ==');
  {
    const persistenceProvider = new MockPersistenceProvider();
    await persistenceProvider.save('case-000-placeholder', CURRENT_SCHEMA_VERSION, { schemaVersion: 1, dummy: true });

    const stateManager = new StateManager();
    const eventBus = new EventBus();
    const conditionEngine = new ConditionEngine();
    const actionEngine = new ActionEngine();
    const ruleEngine = new RuleEngine({ eventBus, conditionEngine, actionEngine });

    const result = await boot({
      accessProvider: new MockAccessProvider(),
      caseContentProvider: new MockCaseContentProvider(),
      persistenceProvider,
      stateManager,
      eventBus,
      ruleEngine,
      accessInput: { caseId: 'case-000-placeholder' },
      decideContinueOrNew: async () => 'new',
    });

    assert(result.mode === 'new', 'مود new حتى مع وجود حفظ سابق عند اختيار المستخدم');
    const afterClear = await persistenceProvider.load('case-000-placeholder');
    assert(afterClear === null, 'الحفظ القديم مُسح فعليًا بعد اختيار "بدء جديد"');
  }

  console.log('== Test 4: Migration hook تُستدعى مع فرق إصدار (محاكاة) ==');
  {
    const { migrateGameState, registerMigrationStep } = await import('../engine/core/state/migrateGameState.js');
    registerMigrationStep(1, (state) => ({ ...state, migratedMarker: true }));
    const result = migrateGameState({ schemaVersion: 1, foo: 'bar' }, 1, 2);
    assert(result.migratedMarker === true, 'خطوة ترحيل مسجّلة تُطبَّق فعليًا');
    assert(result.schemaVersion === 2, 'schemaVersion يُحدَّث للإصدار المستهدف بعد الترحيل');
  }

  console.log('== Test 5: Reconciliation hook يُستدعى ==');
  {
    const { reconcileGameState, registerReconciler, _resetReconcilersForTesting } = await import('../engine/core/state/reconcileGameState.js');
    _resetReconcilersForTesting();
    let called = false;
    registerReconciler('mockLab', (state) => { called = true; return { ...state, reconciled: true }; });
    const result = reconcileGameState({ foo: 1 }, {});
    assert(called === true, 'reconciler المسجّل يُستدعى فعليًا');
    assert(result.reconciled === true, 'نتيجة المصالحة تُطبَّق على الحالة');
  }

  console.log('== Test 6: Boot مرتين بنفس RuleEngine/EventBus — لا تكرار تنفيذ القاعدة ==');
  {
    const stateManager = new StateManager();
    const eventBus = new EventBus();
    const conditionEngine = new ConditionEngine();
    const actionEngine = new ActionEngine();
    const ruleEngine = new RuleEngine({ eventBus, conditionEngine, actionEngine });
    const persistenceProvider = new MockPersistenceProvider();

    let logActionCallCount = 0;
    actionEngine.registerActionType('__test_count__', () => { logActionCallCount += 1; });

    // نُلحق فعلًا إضافيًا بالقاعدة الأصلية عبر case data معدّلة محليًا لهذا الاختبار فقط
    class CountingCaseContentProvider extends MockCaseContentProvider {
      async getCaseData() {
        const data = await super.getCaseData();
        data.rules[0].actions.push({ type: '__test_count__', params: {} });
        return data;
      }
    }
    const caseContentProvider = new CountingCaseContentProvider();

    // --- Boot أول مرة ---
    await boot({
      accessProvider: new MockAccessProvider(),
      caseContentProvider,
      persistenceProvider,
      stateManager,
      eventBus,
      ruleEngine,
      accessInput: { caseId: 'case-000-placeholder' },
    });
    assert(logActionCallCount === 1, 'الفعل نُفِّذ مرة واحدة بعد Boot الأول');

    // نمسح devTestRuleFired يدويًا لمحاكاة "قضية جديدة/حالة جديدة" تسمح للقاعدة
    // بالتفعّل مجددًا منطقيًا، لكن الأهم هنا هو عدد الاشتراكات/القواعد المسجّلة
    // في RuleEngine نفسه، وليس شرط الحالة. نستخدم persistenceProvider.clear
    // لضمان مسار "New Game" في Boot الثاني أيضًا.
    await persistenceProvider.clear('case-000-placeholder');

    // --- Boot مرة ثانية بنفس RuleEngine و EventBus بالضبط (بدون dispose يدوي من الاختبار) ---
    await boot({
      accessProvider: new MockAccessProvider(),
      caseContentProvider,
      persistenceProvider,
      stateManager,
      eventBus,
      ruleEngine,
      accessInput: { caseId: 'case-000-placeholder' },
    });

    assert(
      logActionCallCount === 2,
      'الفعل نُفِّذ مرة واحدة إضافية فقط بعد Boot الثاني (المجموع 2)، وليس 3 أو أكثر بسبب تسجيل مكرر'
    );
  }

  console.log('== Test 7: deepFreeze يمنع تعديل الكائنات المتداخلة في CaseData ==');
  {
    const { deepFreeze } = await import('../engine/core/utils/deepFreeze.js');

    const nested = {
      people: [{ id: 'p1', name: 'placeholder', address: { city: 'x' } }],
      rules: [{ id: 'r1', actions: [{ type: 'setFlag' }] }],
    };
    deepFreeze(nested);

    assert(Object.isFrozen(nested), 'الكائن الجذر مجمّد');
    assert(Object.isFrozen(nested.people), 'المصفوفة المتداخلة (people) مجمّدة');
    assert(Object.isFrozen(nested.people[0]), 'عنصر داخل المصفوفة مجمّد');
    assert(Object.isFrozen(nested.people[0].address), 'كائن متداخل بعمق ثانٍ (address) مجمّد');
    assert(Object.isFrozen(nested.rules[0].actions[0]), 'كائن متداخل بعمق ثالث (rules[0].actions[0]) مجمّد');

    let threw = false;
    try {
      'use strict';
      nested.people[0].name = 'محاولة تعديل';
    } catch (err) {
      threw = true;
    }
    assert(threw === true, 'محاولة تعديل حقل متداخل تُطلق خطأ فعليًا (strict mode داخل ES Module)');
    assert(nested.people[0].name === 'placeholder', 'القيمة الأصلية لم تتغيّر فعليًا بعد محاولة التعديل الفاشلة');

    // تأكيد إضافي عبر boot الفعلي: caseData الناتجة من BootOrchestrator نفسها مجمّدة بعمق
    const stateManager2 = new StateManager();
    const eventBus2 = new EventBus();
    const ruleEngine2 = new RuleEngine({
      eventBus: eventBus2,
      conditionEngine: new ConditionEngine(),
      actionEngine: new ActionEngine(),
    });
    const result = await boot({
      accessProvider: new MockAccessProvider(),
      caseContentProvider: new MockCaseContentProvider(),
      persistenceProvider: new MockPersistenceProvider(),
      stateManager: stateManager2,
      eventBus: eventBus2,
      ruleEngine: ruleEngine2,
      accessInput: { caseId: 'case-000-placeholder' },
    });
    assert(Object.isFrozen(result.caseData.caseFile), 'caseData.caseFile الناتجة من boot() الفعلي مجمّدة بعمق أيضًا');
  }

  console.log('\nALL TESTS PASSED ✅');
}

run().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
