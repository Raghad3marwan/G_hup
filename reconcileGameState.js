/**
 * reconcileGameState
 * -------------------
 * Hook للمصالحة الزمنية (Reconciliation) للعمليات ذات المدة الحقيقية
 * (مثل Lab Jobs لاحقًا: startedAt/completesAt). في Foundation لا يوجد
 * أي Domain يسجّل مصالحة فعلية بعد — الآلية فقط جاهزة وموصولة في Boot Flow.
 *
 * كل Domain مستقبلي (مثل Lab) يسجّل دالة المصالحة الخاصة به عبر
 * registerReconciler(domainName, fn) عند تهيئته، بدل أن يُكتب منطقه هنا.
 */

const reconcilers = new Map(); // domainName -> reconcilerFn

/**
 * @param {string} domainName اسم فريد للـ Domain (لأغراض التشخيص فقط)
 * @param {(state: object, caseData: object, now: number) => object} reconcilerFn
 *        يُرجع الحالة (معدَّلة أو نفسها إن لم يوجد شيء للمصالحة)
 */
export function registerReconciler(domainName, reconcilerFn) {
  if (reconcilers.has(domainName)) {
    throw new Error(`[Reconciliation] يوجد reconciler مسجّل مسبقًا باسم "${domainName}".`);
  }
  reconcilers.set(domainName, reconcilerFn);
}

/**
 * يُستدعى مرة واحدة ضمن Boot Flow (بعد Migration، قبل Render) عند Continue فقط.
 * @param {object} state
 * @param {object} caseData
 * @param {{ now?: number }} options
 * @returns {object} الحالة بعد تطبيق كل عمليات المصالحة المسجّلة
 */
export function reconcileGameState(state, caseData, { now = Date.now() } = {}) {
  let current = state;
  for (const [domainName, reconcilerFn] of reconcilers) {
    try {
      current = reconcilerFn(current, caseData, now) ?? current;
    } catch (err) {
      console.error(`[Reconciliation] فشل reconciler الخاص بـ "${domainName}":`, err);
    }
  }
  return current;
}

/** لأغراض الاختبار فقط: إعادة ضبط كل الـ reconcilers المسجّلة. */
export function _resetReconcilersForTesting() {
  reconcilers.clear();
}
