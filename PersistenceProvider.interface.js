/**
 * PersistenceProvider (Interface)
 * ----------------------------------
 * مسؤوليته: حفظ/تحميل/مسح GameState لقضية معيّنة، دون أن يعرف BootOrchestrator
 * أو أي Domain أين تُخزَّن البيانات فعليًا (localStorage الآن، Cloud لاحقًا).
 *
 * ملاحظة تنفيذية مهمة بخصوص إصدار الحفظ (schemaVersion):
 * السجل المُرجَع من load() يحتوي schemaVersion الذي حُفظت به الحالة (وقد يكون
 * أقدم من الإصدار الحالي للمحرك) — المُستدعي (BootOrchestrator) هو من يقارن
 * هذا الإصدار بالإصدار الحالي ويستدعي migrateGameState() عند الحاجة.
 * PersistenceProvider نفسه لا يقرر شيئًا بخصوص التوافق، فقط يخزّن ويُرجع.
 */

export class PersistenceProvider {
  /**
   * @param {string} caseId
   * @returns {Promise<{ schemaVersion: number, state: object, savedAt: number } | null>}
   */
  async load(caseId) {
    throw new Error('[PersistenceProvider] load() غير منفَّذة.');
  }

  /**
   * @param {string} caseId
   * @param {number} schemaVersion
   * @param {object} state
   * @returns {Promise<void>}
   */
  async save(caseId, schemaVersion, state) {
    throw new Error('[PersistenceProvider] save() غير منفَّذة.');
  }

  /**
   * @param {string} caseId
   * @returns {Promise<void>}
   */
  async clear(caseId) {
    throw new Error('[PersistenceProvider] clear() غير منفَّذة.');
  }
}
