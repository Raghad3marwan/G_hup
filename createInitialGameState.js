/**
 * createInitialGameState
 * -----------------------
 * ينشئ GameState فارغة عند "بدء تحقيق جديد"، وفق الشكل المتفق عليه في
 * Architecture Plan (القسم 6: GameState Architecture).
 *
 * ملاحظة: هذه هي البنية الأولية فقط. حقول مثل evidenceState/personState
 * ستُملأ تدريجيًا من قبل الـ Domains المعنية عند بنائها (لاحقًا)، وليس من هنا.
 */

export function createInitialGameState({ caseId, schemaVersion, manifest }) {
  return {
    schemaVersion,
    caseId,

    meta: {
      startedAt: Date.now(),
      lastSavedAt: null,
    },

    assignmentSeen: false,

    // حالات الكيانات (تُملأ لاحقًا من كل Domain عند بنائه)
    evidenceState: {},
    crimeSceneState: {},
    documentState: {},
    personState: {},
    interrogationState: {},
    contradictionState: {},
    labJobs: {},
    puzzleState: {},
    deductionState: { answers: {}, attempts: 0, completed: false, submittedAt: null },
    boardPlacedItems: [],
    boardLinks: [],
    boardPositions: {},
    boardNotes: [],

    notes: {
      automaticFacts: [],
      personalNotes: [],
    },

    hintsUsed: {},
    notifications: [],

    // عام: تُستخدم من Rule Engine لأي منطق شرطي بسيط لا يحتاج Domain خاص
    flags: {},

    navigation: {
      activeSection: manifest?.defaultSection ?? null,
      activePersonId: null,
      activeDossierTab: null,
    },
  };
}
