/**
 * Shell.js
 * ---------
 * يبني App Shell الكامل (Header + Navigation + Workspace + Global Tools)
 * ويربطه بـGameState عبر الحدود المعمارية الحالية فقط:
 *   - قراءة الحالة: stateManager.getState() / stateManager.subscribe()
 *   - كتابة الحالة: stateManager.setState() (لا كتابة مباشرة على أي كائن حالة)
 * لا يتجاوز Shell أي Provider ولا يتحايل على State Manager.
 *
 * لا وظائف فعلية لأي قسم هنا — فقط Placeholder موحّد الهوية (انظر
 * WorkspacePlaceholder.js)، وأدوات عامة بلا منطق حقيقي بعد (انظر GlobalTools.js).
 */

import { SECTIONS, GLOBAL_TOOLS } from './sections.config.js';
import { renderNavigation, setActiveNavItem } from './Navigation.js';
import { renderWorkspacePlaceholder } from './WorkspacePlaceholder.js';
import { renderGlobalTools, renderToolContent, updateNotificationBadge, installAutomaticFactCapture } from './GlobalTools.js';
import { iconMarkup } from './icons/icons.js';
import { renderPeopleWorkspace } from './PeopleWorkspace.js';
import { renderCrimeSceneWorkspace } from './CrimeSceneWorkspace.js';
import { renderEvidenceWorkspace } from './EvidenceWorkspace.js';
import { renderLabWorkspace } from './LabWorkspace.js';
import { renderBoardWorkspace } from './BoardWorkspace.js';
import { renderDeductionWorkspace } from './DeductionWorkspace.js';
import { renderCaseFileWorkspace } from './CaseFileWorkspace.js';

const SECTIONS_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/**
 * @param {{ container: HTMLElement, stateManager: object, eventBus: object }} params
 */
export function mountShell({ container, stateManager, eventBus, caseData }) {
  container.innerHTML = '';

  const shellEl = document.createElement('div');
  shellEl.className = 'jn-shell';

  shellEl.innerHTML = `
    <header class="jn-shell__header">
      <div class="jn-shell__brand">
        <span class="jn-shell__brand-mark jn-mono" aria-hidden="true">◆</span>
        <span class="jn-shell__brand-full">جنايات</span>
      </div>
      <div class="jn-shell__section-title" data-role="section-title"></div>
      <div class="jn-shell__global-tools" data-role="global-tools"></div>
    </header>
    <nav class="jn-nav" data-role="nav"></nav>
    <main class="jn-workspace" data-role="workspace"></main>
  `;

  container.appendChild(shellEl);

  const navEl = shellEl.querySelector('[data-role="nav"]');
  const workspaceEl = shellEl.querySelector('[data-role="workspace"]');
  const sectionTitleEl = shellEl.querySelector('[data-role="section-title"]');
  const globalToolsEl = shellEl.querySelector('[data-role="global-tools"]');

  const initialSection = stateManager.getState()?.navigation?.activeSection || SECTIONS[0].id;

  // ---------- Navigation ----------
  renderNavigation(navEl, {
    sections: SECTIONS,
    activeSection: initialSection,
    onSelect: (sectionId) => {
      stateManager.setState((state) => ({
        ...state,
        navigation: { ...state.navigation, activeSection: sectionId },
      }));
    },
  });

  // ---------- Global Tools + Popover ----------
  let openToolId = null;
  let popoverEl = null;
  let lastFocusedButton = null;

  const toolButtons = renderGlobalTools(globalToolsEl, GLOBAL_TOOLS, (toolId, buttonEl) => {
    if (openToolId === toolId) {
      closePopover();
      return;
    }
    openPopover(toolId, buttonEl);
  });

  function openPopover(toolId, buttonEl) {
    closePopover(); // بند واحد مفتوح كحد أقصى

    const titles = { notebook: 'دفتر الملاحظات', hints: 'التلميحات', notifications: 'الإشعارات' };
    const content = { title: titles[toolId] || '' };
    popoverEl = document.createElement('div');
    popoverEl.className = 'jn-tool-popover jn-paper jn-paper--clean jn-anim-paper-open';
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.setAttribute('aria-label', content.title);
    popoverEl.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: var(--jn-space-3); margin-block-end: var(--jn-space-2);">
        <h3 style="margin:0;">${escapeHtml(content.title)}</h3>
        <button type="button" class="jn-btn jn-btn--icon" data-role="popover-close" aria-label="إغلاق" style="width:28px;height:28px;color:var(--jn-ink-muted);">
          <span class="jn-btn__icon">${iconMarkup('close')}</span>
        </button>
      </div>
      <div data-role="tool-content"></div>
    `;

    globalToolsEl.appendChild(popoverEl);
    popoverEl.querySelector('[data-role="popover-close"]').addEventListener('click', closePopover);
    renderToolContent({ toolId, host: popoverEl.querySelector('[data-role="tool-content"]'), caseData, stateManager, eventBus, onNavigate: (sectionId) => stateManager.setState(s => ({...s, navigation:{...s.navigation, activeSection:sectionId}})) });

    buttonEl.setAttribute('aria-expanded', 'true');
    openToolId = toolId;
    lastFocusedButton = buttonEl;

    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onOutsideClick, true);
  }

  function closePopover() {
    if (!openToolId) return;
    toolButtons.get(openToolId)?.setAttribute('aria-expanded', 'false');
    popoverEl?.remove();
    popoverEl = null;
    openToolId = null;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onOutsideClick, true);
    lastFocusedButton?.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closePopover();
  }

  function onOutsideClick(e) {
    if (popoverEl && !popoverEl.contains(e.target) && !globalToolsEl.contains(e.target)) {
      closePopover();
    }
  }

  const disposeFactCapture = installAutomaticFactCapture({ caseData, stateManager, eventBus });
  updateNotificationBadge(toolButtons, stateManager.getState());

  // ---------- Render workspace + header title لأي حالة (أولية أو لاحقة) ----------
  let workspaceCleanup = null;
  function renderForSection(sectionId) {
    if (typeof workspaceCleanup === 'function') { workspaceCleanup(); workspaceCleanup = null; }
    const section = SECTIONS_BY_ID[sectionId] || SECTIONS[0];
    sectionTitleEl.innerHTML = `
      <span style="width:16px;height:16px;display:inline-flex;">${iconMarkup(section.icon)}</span>
      <span>${escapeHtml(section.label)}</span>
    `;
    setActiveNavItem(navEl, section.id);
    if (section.id === 'caseFile') {
      renderCaseFileWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else if (section.id === 'people') {
      renderPeopleWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else if (section.id === 'crimeScene') {
      renderCrimeSceneWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else if (section.id === 'evidence') {
      renderEvidenceWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else if (section.id === 'lab') {
      workspaceCleanup = renderLabWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else if (section.id === 'board') {
      renderBoardWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else if (section.id === 'deduction') {
      workspaceCleanup = renderDeductionWorkspace(workspaceEl, { caseData, stateManager, eventBus });
    } else {
      renderWorkspacePlaceholder(workspaceEl, section);
    }
  }

  renderForSection(initialSection);

  // ---------- الاشتراك في تغيّرات الحالة (قراءة فقط، عبر الحد المعماري الرسمي) ----------
  let lastRenderedSection = initialSection;
  stateManager.subscribe((state) => {
    updateNotificationBadge(toolButtons, state);
    const activeSection = state?.navigation?.activeSection;
    if (activeSection && activeSection !== lastRenderedSection) {
      lastRenderedSection = activeSection;
      renderForSection(activeSection);
    }
  });

  eventBus.emit('shell:mounted', { activeSection: initialSection });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
