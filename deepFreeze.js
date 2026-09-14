/**
 * deepFreeze
 * -----------
 * أداة عامة لتجميد كائن بالكامل (بما في ذلك الكائنات والمصفوفات المتداخلة)
 * بشكل تكراري (recursive)، بخلاف Object.freeze() الذي يجمّد المستوى الأول فقط.
 *
 * تُستخدم لإنفاذ قاعدة "CASE_DATA لا تُعدَّل أثناء اللعب" فعليًا وليس فقط
 * بالاتفاق البرمجي — أي محاولة تعديل حقل متداخل (مثل caseData.people[0].name)
 * ستفشل بصمت في الوضع العادي، أو تُطلق TypeError في "use strict" (وهو
 * الوضع الافتراضي داخل ES Modules، لذا الفشل هنا صريح وليس صامتًا).
 *
 * ملاحظات تنفيذية:
 * - تتعامل مع الدورات المرجعية (circular references) عبر WeakSet لمنع
 *   التكرار اللانهائي في حال احتوت البيانات على مرجع دائري (احترازي، غير
 *   متوقع في CASE_DATA لكنه لا يكلّف شيئًا هنا).
 * - تتجاهل القيم غير القابلة للتجميد أصلًا (null, primitives) بأمان.
 * - تعمل على المصفوفات كما تعمل على الكائنات العادية (Array هو Object في JS).
 */

export function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') {
    return value; // القيم البدائية (string/number/boolean/null/undefined) مجمّدة أصلًا بطبيعتها
  }

  if (seen.has(value)) {
    return value; // تفادي حلقة لا نهائية عند وجود مرجع دائري
  }
  seen.add(value);

  // نُجمّد الأبناء أولًا، ثم الأب — حتى لا يُفلت أي مستوى من التجميد
  const propertyNames = Object.getOwnPropertyNames(value);
  for (const key of propertyNames) {
    const child = value[key];
    if (child !== null && typeof child === 'object' && !Object.isFrozen(child)) {
      deepFreeze(child, seen);
    }
  }

  return Object.freeze(value);
}
