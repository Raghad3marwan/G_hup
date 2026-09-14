/**
 * CaseContentProvider (Interface)
 * ---------------------------------
 * مسؤوليته: تحميل محتوى القضية (manifest + CaseData + روابط الأصول) لِـ caseId
 * تم التصريح به مسبقًا عبر AccessProvider.
 *
 * كل دالة تستقبل authToken (قد يكون null في Dev) حتى لا يُفترض مستقبلًا أن
 * المحتوى متاح دائمًا عبر مسار Static عام دون تحقق — هذا القرار المعماري
 * صريح ومقصود (راجع القسم 21 من Architecture Plan: "AccessProvider وحده غير كافٍ").
 *
 * المحرك (Domains/Renderers/UI) لا يستدعي هذا العقد مباشرة أبدًا؛ فقط
 * BootOrchestrator يستدعيه أثناء الإقلاع، وما ينتج (CaseData/Manifest)
 * يُمرَّر بعدها كبيانات عادية لبقية النظام.
 */

export class CaseContentProvider {
  /**
   * @param {string} caseId
   * @param {string|null} authToken
   * @returns {Promise<object>} Manifest (بنية خفيفة، انظر manifest.json في case-template)
   */
  async getManifest(caseId, authToken = null) {
    throw new Error('[CaseContentProvider] getManifest() غير منفَّذة.');
  }

  /**
   * @param {string} caseId
   * @param {string|null} authToken
   * @returns {Promise<object>} CaseData الكاملة وفق الـ Schema المتفق عليه
   */
  async getCaseData(caseId, authToken = null) {
    throw new Error('[CaseContentProvider] getCaseData() غير منفَّذة.');
  }

  /**
   * @param {string} caseId
   * @param {string} assetRef مرجع نسبي كما يظهر في CaseData (مثال: "people/p1.jpg")
   * @param {string|null} authToken
   * @returns {Promise<string>} رابط قابل للاستخدام في <img>/<audio> إلخ
   */
  async resolveAssetUrl(caseId, assetRef, authToken = null) {
    throw new Error('[CaseContentProvider] resolveAssetUrl() غير منفَّذة.');
  }
}
