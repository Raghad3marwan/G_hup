/**
 * LocalCaseProvider
 * -------------------
 * تطبيق تطوير محلي لعقد CaseContentProvider: يقرأ ملفات القضية مباشرة من
 * مسار Static عادي (/cases/{caseId}/...) دون أي تحقق صلاحية حقيقي.
 *
 * هذا مقبول في Foundation/Development لأن AccessProvider لم يُصدر بعد أي
 * authToken فعلي (Dev دائمًا null). عند الانتقال لاحقًا إلى بيئة إنتاج،
 * يُستبدل هذا التطبيق بالكامل بتطبيق آخر (مثلًا يطلب المحتوى من API محمي،
 * أو يُرجع Signed URLs للأصول) يلتزم بنفس عقد CaseContentProvider —
 * دون أي تعديل على BootOrchestrator أو أي Domain.
 */

import { CaseContentProvider } from './CaseContentProvider.interface.js';
import { loadCaseData } from './CaseDataLoader.js';

export class LocalCaseProvider extends CaseContentProvider {
  #casesRootPath;
  #manifestCache; // Map<caseId, manifest> - يمنع طلب manifest.json مرتين أثناء نفس الإقلاع

  constructor({ casesRootPath = '/cases' } = {}) {
    super();
    this.#casesRootPath = casesRootPath;
    this.#manifestCache = new Map();
  }

  #basePathFor(caseId) {
    return `${this.#casesRootPath}/${caseId}`;
  }

  async getManifest(caseId, _authToken = null) {
    if (this.#manifestCache.has(caseId)) {
      return this.#manifestCache.get(caseId);
    }
    const url = `${this.#basePathFor(caseId)}/manifest.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[LocalCaseProvider] تعذّر تحميل manifest.json للقضية "${caseId}" (${response.status}).`);
    }
    const manifest = await response.json();
    this.#manifestCache.set(caseId, manifest);
    return manifest;
  }

  async getCaseData(caseId, _authToken = null) {
    const manifest = await this.getManifest(caseId);
    return loadCaseData({ caseId, manifest, basePath: this.#basePathFor(caseId) });
  }

  async resolveAssetUrl(caseId, assetRef, _authToken = null) {
    // في Dev: مجرد مسار ثابت. مستقبلًا يمكن أن يُرجع رابطًا موقّعًا مؤقتًا بدل ذلك.
    return `${this.#basePathFor(caseId)}/assets/${assetRef}`;
  }
}
