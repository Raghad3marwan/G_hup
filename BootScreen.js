/**
 * BootScreen.js
 * --------------
 * واجهة قرار "استمرار التحقيق / بدء تحقيق جديد" المطلوبة من BootOrchestrator
 * عند وجود حفظ سابق (انظر decideContinueOrNew في boot()). مبنية بنفس هوية
 * النظام البصري (ختم + ورق)، بدل الأزرار الخام التي استُخدمت في Dev Harness
 * الخاص بمرحلة Foundation.
 */

/**
 * @param {HTMLElement} container
 * @param {{ schemaVersion: number, savedAt: number }} savedRecord
 * @returns {Promise<'continue'|'new'>}
 */
export function showBootDecisionScreen(container, savedRecord) {
  return new Promise((resolve) => {
    container.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'jn-decision-screen';

    const _saved = new Date(savedRecord.savedAt);
    const _h24 = _saved.getHours();
    const _period = _h24 < 12 ? 'صباحًا' : 'مساءً';
    const _h12 = _h24 % 12 || 12;
    const savedDate = `${_saved.toLocaleDateString('ar-SA', { dateStyle: 'medium' })} · ${_h12}:${String(_saved.getMinutes()).padStart(2, '0')} ${_period}`;

    screen.innerHTML = `
      <div class="jn-decision-screen__panel jn-paper jn-paper--aged jn-anim-paper-open">
        <span class="jn-stamp jn-stamp--accent" style="margin-block-end: var(--jn-space-3);">ملف مفتوح</span>
        <h1 style="margin-block-end: var(--jn-space-2);">هل تريد المتابعة؟</h1>
        <p class="jn-text-muted-on-paper" style="margin-block-end: var(--jn-space-1);">
          يوجد تحقيق محفوظ سابقًا لهذه القضية.
        </p>
        <span class="jn-reference-number" style="color: var(--jn-ink-muted);">آخر حفظ: ${escapeHtml(savedDate)}</span>
        <div class="jn-decision-screen__actions">
          <button type="button" class="jn-btn jn-btn--primary" data-role="continue">استمرار التحقيق</button>
          <button type="button" class="jn-btn jn-btn--secondary" data-role="new">بدء تحقيق جديد</button>
        </div>
      </div>
    `;

    container.appendChild(screen);

    screen.querySelector('[data-role="continue"]').addEventListener('click', () => resolve('continue'));
    screen.querySelector('[data-role="new"]').addEventListener('click', () => resolve('new'));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
