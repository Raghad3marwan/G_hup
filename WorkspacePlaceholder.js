/**
 * Placeholder بصري للمرحلة الثانية فقط.
 * يثبت Composition الـWorkspace وهوية الأرشيف دون بناء أي Domain حقيقي.
 */

import { iconMarkup } from './icons/icons.js';

export function renderWorkspacePlaceholder(workspaceEl, section) {
  workspaceEl.innerHTML = '';

  const wrapper = document.createElement('section');
  wrapper.className = 'jn-workspace-placeholder jn-anim-section-enter';
  wrapper.setAttribute('aria-labelledby', 'jn-workspace-section-title');

  wrapper.innerHTML = `
    <div class="jn-workspace-context" aria-hidden="true">
      <span class="jn-workspace-context__rule"></span>
      <span class="jn-workspace-context__eyebrow jn-mono">INVESTIGATION WORKSPACE</span>
      <span class="jn-workspace-context__ref jn-mono">DEV / ${escapeHtml(section.id).toUpperCase()}</span>
    </div>

    <div class="jn-workspace-stage">
      <div class="jn-workspace-stage__index" aria-hidden="true">
        <span>ملف نشط</span>
        <span class="jn-mono">DEV-001</span>
      </div>

      <div class="jn-folder jn-folder--workspace">
        <span class="jn-folder-tab jn-mono">${escapeHtml(section.id)}</span>
        <span class="jn-folder__edge-code jn-mono" aria-hidden="true">JNY / 01</span>

        <div class="jn-folder__content">
          <div class="jn-workspace-placeholder__heading">
            <span class="jn-workspace-placeholder__icon">${iconMarkup(section.icon)}</span>
            <div>
              <span class="jn-workspace-placeholder__kicker">قسم التحقيق</span>
              <h1 id="jn-workspace-section-title">${escapeHtml(section.label)}</h1>
              <span class="jn-reference-number">DEV-001</span>
            </div>
          </div>

          <div class="jn-workspace-placeholder__body">
            <p>${escapeHtml(section.description)}</p>
            <p class="jn-workspace-placeholder__note">
              هذه مساحة تجريبية لاختبار الـShell والهوية فقط. محتوى القسم الفعلي سيُبنى في مرحلته المخصصة.
            </p>
          </div>

          <div class="jn-workspace-placeholder__footer" aria-hidden="true">
            <span>أرشيف جنايات</span>
            <span class="jn-mono">STATUS / DEV</span>
          </div>
        </div>
      </div>
    </div>
  `;

  workspaceEl.appendChild(wrapper);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
