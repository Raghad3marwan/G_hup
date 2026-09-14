/**
 * Icons — رموز خطية بسيطة (Stroke-based)، مرسومة يدويًا خصيصًا لهذا المشروع.
 * ليست من مكتبة أيقونات جاهزة (تجنبًا لشكل UI Library العام)، وموحّدة
 * السماكة والزوايا لتبدو كعائلة واحدة متماسكة.
 *
 * كل دالة تُرجع سلسلة SVG جاهزة (viewBox 0 0 24 24)، تُستخدم عبر innerHTML
 * داخل أزرار Navigation/Global Tools.
 */

const STROKE = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  caseFile: `
    <path ${STROKE} d="M4 6.5C4 5.67 4.67 5 5.5 5H9l2 2h7.5c.83 0 1.5.67 1.5 1.5V18c0 .83-.67 1.5-1.5 1.5h-13C4.67 19.5 4 18.83 4 18V6.5Z"/>
  `,
  crimeScene: `
    <path ${STROKE} d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/>
    <circle ${STROKE} cx="12" cy="9.5" r="2.4"/>
  `,
  evidence: `
    <circle ${STROKE} cx="10.5" cy="10.5" r="6"/>
    <path ${STROKE} d="M15 15l5 5"/>
  `,
  people: `
    <circle ${STROKE} cx="9" cy="8" r="3"/>
    <path ${STROKE} d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
    <circle ${STROKE} cx="17" cy="8.5" r="2.3"/>
    <path ${STROKE} d="M15.2 14.2c2.6.3 4.3 2 4.3 4.8"/>
  `,
  lab: `
    <path ${STROKE} d="M9.5 3.5h5"/>
    <path ${STROKE} d="M10.3 3.5v6.2L5.8 17a2 2 0 0 0 1.7 3h9a2 2 0 0 0 1.7-3l-4.5-7.3V3.5"/>
    <path ${STROKE} d="M7.8 15h8.4"/>
  `,
  board: `
    <circle ${STROKE} cx="6" cy="7" r="1.8"/>
    <circle ${STROKE} cx="18" cy="6.5" r="1.8"/>
    <circle ${STROKE} cx="12" cy="17.5" r="1.8"/>
    <path ${STROKE} d="M7.5 8.2 10.7 16M16.3 7.7 13.3 16"/>
  `,
  deduction: `
    <path ${STROKE} d="M5 12.5 9.5 17 19 6.5"/>
  `,
  notebook: `
    <path ${STROKE} d="M6.5 4.5h11a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"/>
    <path ${STROKE} d="M9 8.5h6M9 12h6M9 15.5h4"/>
  `,
  hints: `
    <path ${STROKE} d="M9 18h6"/>
    <path ${STROKE} d="M10 21h4"/>
    <path ${STROKE} d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z"/>
  `,
  notifications: `
    <path ${STROKE} d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14.5 6 10.5Z"/>
    <path ${STROKE} d="M10 19a2 2 0 0 0 4 0"/>
  `,
  chevron: `
    <path ${STROKE} d="M9 6l6 6-6 6"/>
  `,
  close: `
    <path ${STROKE} d="M6 6l12 12M18 6 6 18"/>
  `,
  menu: `
    <circle cx="6" cy="12" r="1.3" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
    <circle cx="18" cy="12" r="1.3" fill="currentColor"/>
  `,
};

/**
 * @param {keyof typeof ICONS} name
 * @returns {string} SVG markup (بدون <svg> wrapper — الاستدعاء يضيفه)
 */
export function iconMarkup(name) {
  const inner = ICONS[name];
  if (!inner) {
    console.warn(`[icons] أيقونة غير معرّفة: "${name}"`);
    return '';
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
}

export const ICON_NAMES = Object.keys(ICONS);
