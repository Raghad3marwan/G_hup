/**
 * CaseDataLoader
 * ---------------
 * يجمّع CASE_DATA من ملف واحد ("single") أو عدة ملفات ("fragmented") إلى
 * نفس شكل CaseData الموحّد الذي يراه بقية المحرك. الـ Domains/Rule Engine
 * لا تعرف أبدًا أي من الشكلين استُخدم فعليًا لهذه القضية.
 *
 * الشكل الافتراضي (single):
 *   <basePath>/case.data.js  يُصدّر window.CASE_DATA = { ...الكل... }
 *
 * الشكل الموسّع (fragmented) — جاهز معماريًا، غير مستخدم من القضية التجريبية حاليًا:
 *   <basePath>/data/<fragment-file>.js  كل ملف يضيف مفتاحًا إلى
 *   window.CASE_DATA_FRAGMENTS، مثل: window.CASE_DATA_FRAGMENTS.people = [...]
 *   يتم دمج كل المفاتيح في كائن CaseData نهائي واحد.
 *
 * الاختيار بين الشكلين يتم عبر manifest.dataFormat ("single" | "fragmented").
 */

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // نحافظ على ترتيب التحميل عند تحميل عدة fragments بالتتابع
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`[CaseDataLoader] فشل تحميل السكربت: ${src}`));
    document.head.appendChild(script);
  }).finally(() => {
    // إزالة الوسم بعد التحميل — لا حاجة لإبقائه في DOM بعد تنفيذ محتواه.
    // (لا نزيله فورًا داخل onload لتفادي مشاكل توقيت نادرة في بعض المتصفحات)
  });
}

/**
 * @param {{ caseId: string, manifest: object, basePath: string }} params
 *   basePath: المسار الأساسي لمجلد القضية (مثال: "/cases/case-000-placeholder")
 * @returns {Promise<object>} CaseData موحّدة
 */
export async function loadCaseData({ caseId, manifest, basePath }) {
  const format = manifest.dataFormat || 'single';

  if (format === 'single') {
    return loadSingleFormat(basePath);
  }

  if (format === 'fragmented') {
    return loadFragmentedFormat(basePath, manifest.dataFragments);
  }

  throw new Error(`[CaseDataLoader] قيمة dataFormat غير مدعومة: "${format}" (القضية: ${caseId})`);
}

async function loadSingleFormat(basePath) {
  await loadScriptOnce(`${basePath}/case.data.js`);

  if (!window.CASE_DATA) {
    throw new Error('[CaseDataLoader] تم تحميل case.data.js لكن window.CASE_DATA غير موجودة.');
  }

  const data = window.CASE_DATA;
  delete window.CASE_DATA; // تنظيف الفضاء العام فورًا حتى لا يتسرب بين تحميل قضايا متعددة
  return data;
}

async function loadFragmentedFormat(basePath, dataFragments) {
  const fragmentFiles = dataFragments && dataFragments.length
    ? dataFragments
    : DEFAULT_FRAGMENT_FILES;

  window.CASE_DATA_FRAGMENTS = {};

  for (const fileName of fragmentFiles) {
    // بالتتابع (وليس Promise.all) للحفاظ على ترتيب متوقّع وتفادي تضارب كتابة نفس الكائن العام
    await loadScriptOnce(`${basePath}/data/${fileName}`);
  }

  const merged = window.CASE_DATA_FRAGMENTS;
  delete window.CASE_DATA_FRAGMENTS;

  if (!merged || Object.keys(merged).length === 0) {
    throw new Error('[CaseDataLoader] لم يُضِف أي ملف fragment بيانات إلى window.CASE_DATA_FRAGMENTS.');
  }

  return merged;
}

// قائمة افتراضية توضيحية فقط لأسماء ملفات محتملة عند استخدام الشكل الموسّع.
// القضية الفعلية تحدد قائمتها الخاصة عبر manifest.dataFragments.
const DEFAULT_FRAGMENT_FILES = [
  'people.data.js',
  'evidence.data.js',
  'documents.data.js',
  'crime-scenes.data.js',
];
