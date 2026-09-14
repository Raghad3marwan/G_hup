/**
 * AccessProvider (Interface)
 * ---------------------------
 * مسؤوليته الوحيدة: تحديد القضية (caseId) التي يحق للاعب تحميلها، بناءً
 * على مدخل معيّن (رمز شراء لاحقًا، أو مدخل تطوير بسيط الآن).
 *
 * لا يعرف هذا العقد أي شيء عن كيفية تحميل محتوى القضية أو حفظ التقدّم —
 * تلك مسؤولية CaseContentProvider و PersistenceProvider بالترتيب.
 *
 * أي تطبيق (Provider) حقيقي لاحقًا (Backend/Salla) يجب أن يلتزم بهذا الشكل
 * تمامًا دون تغييره، حتى لا يحتاج BootOrchestrator لأي تعديل.
 */

export class AccessProvider {
  /**
   * @param {object} input مدخل خاص بالتطبيق (مثال Dev: { caseId }؛ لاحقًا: { accessCode })
   * @returns {Promise<{ caseId: string, authToken: string|null }>}
   */
  async resolveSession(input) {
    throw new Error('[AccessProvider] resolveSession() غير منفَّذة. يجب على أي Provider فرعي تنفيذها.');
  }
}
