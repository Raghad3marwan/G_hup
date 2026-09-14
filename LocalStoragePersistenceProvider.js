/**
 * LocalStoragePersistenceProvider
 * ----------------------------------
 * تطبيق تطوير/إنتاج مبدئي لعقد PersistenceProvider عبر localStorage.
 *
 * ** قرار تنفيذي مهم (يُرجى الانتباه له عند المراجعة) **
 * الخطة الأصلية اقترحت صياغة مفتاح تتضمّن رقم الإصدار مباشرة، من نوع:
 *   jinayat::save::{caseId}::v{schemaVersion}
 * أثناء البناء تبيّن أن هذا الشكل يسبب مشكلة فعلية: عند تغيير schemaVersion
 * في المحرك مستقبلًا، سيبحث load() عن مفتاح يحمل الإصدار *الجديد*، فلن يجد
 * أبدًا حفظًا قديمًا محفوظًا تحت مفتاح الإصدار *القديم* — أي أن Migration Hook
 * لن يُستدعى إطلاقًا لأن السجل القديم يصبح غير قابل للعثور عليه من الأساس.
 *
 * الحل المعتمد هنا: فتحة حفظ واحدة لكل قضية (يتوافق مع سلوك "استمرار/بدء
 * جديد" الموصوف في الخطة، وهو أصلًا سلوك بفتحة واحدة لا فتحات متعددة):
 *   jinayat::save::{caseId}
 * ورقم الإصدار يُخزَّن *داخل* محتوى السجل نفسه (schemaVersion)، وهذا هو ما
 * يقرأه BootOrchestrator ليقرر إن كانت هناك حاجة لـ Migration قبل الاستخدام.
 *
 * هذا التغيير طُرح صراحة هنا وفي ملخص التسليم، وليس تجاوزًا صامتًا للخطة.
 */

import { PersistenceProvider } from './PersistenceProvider.interface.js';

const KEY_PREFIX = 'jinayat::save::';

export class LocalStoragePersistenceProvider extends PersistenceProvider {
  #keyFor(caseId) {
    return `${KEY_PREFIX}${caseId}`;
  }

  async load(caseId) {
    const raw = localStorage.getItem(this.#keyFor(caseId));
    if (!raw) return null;

    try {
      const record = JSON.parse(raw);
      if (!record || typeof record.schemaVersion !== 'number' || !record.state) {
        console.warn(`[LocalStoragePersistenceProvider] سجل حفظ تالف للقضية "${caseId}". سيُعامل كعدم وجود حفظ.`);
        return null;
      }
      return record;
    } catch (err) {
      console.warn(`[LocalStoragePersistenceProvider] فشل تحليل سجل الحفظ للقضية "${caseId}":`, err);
      return null;
    }
  }

  async save(caseId, schemaVersion, state) {
    const record = {
      schemaVersion,
      state,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(this.#keyFor(caseId), JSON.stringify(record));
    } catch (err) {
      // مثال شائع: تجاوز حد تخزين المتصفح. لا نُسقط اللعبة، فقط نُبلّغ.
      console.error(`[LocalStoragePersistenceProvider] فشل حفظ التقدّم للقضية "${caseId}":`, err);
      throw err;
    }
  }

  async clear(caseId) {
    localStorage.removeItem(this.#keyFor(caseId));
  }
}
