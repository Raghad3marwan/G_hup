/**
 * DevAccessProvider
 * ------------------
 * تطبيق تطوير محلي بحت لعقد AccessProvider. لا يحتوي أي رموز وصول حقيقية،
 * ولا يتصل بأي Backend. يُرجع caseId مباشرة من المدخل (أو قيمة افتراضية)،
 * و authToken = null دائمًا (لأن لا مصادقة فعلية في هذه المرحلة).
 *
 * ممنوع استخدام هذا التطبيق في أي بيئة إنتاج فعلية — هو فقط لاختبار
 * Foundation ولتطوير القضايا محليًا قبل وجود Backend حقيقي.
 */

import { AccessProvider } from './AccessProvider.interface.js';

export class DevAccessProvider extends AccessProvider {
  #defaultCaseId;

  constructor({ defaultCaseId = 'case-000-placeholder' } = {}) {
    super();
    this.#defaultCaseId = defaultCaseId;
  }

  async resolveSession(input = {}) {
    const caseId = input.caseId || this.#defaultCaseId;
    return { caseId, authToken: null };
  }
}
