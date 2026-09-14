/**
 * Navigation.js
 * --------------
 * Desktop/Tablet: جميع الأقسام في rail واحدة.
 * Mobile: أربعة أقسام أساسية + زر «المزيد» يفتح بقية الأقسام في sheet صغيرة.
 * الهدف منع قص النصوص/العناصر بدل تصغيرها قسرًا.
 */

import { iconMarkup } from './icons/icons.js';

const MOBILE_PRIMARY_COUNT = 4;

export function renderNavigation(navEl, { sections, activeSection, onSelect }) {
  navEl.innerHTML = '';
  navEl.setAttribute('role', 'navigation');
  navEl.setAttribute('aria-label', 'أقسام التحقيق الرئيسية');

  sections.forEach((section, index) => {
    const btn = createSectionButton(section, activeSection, onSelect);
    if (index >= MOBILE_PRIMARY_COUNT) btn.classList.add('jn-nav__item--mobile-secondary');
    navEl.appendChild(btn);
  });

  const moreWrap = document.createElement('div');
  moreWrap.className = 'jn-nav__more-wrap';

  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'jn-nav__item jn-nav__more';
  moreBtn.setAttribute('aria-haspopup', 'menu');
  moreBtn.setAttribute('aria-expanded', 'false');
  moreBtn.innerHTML = `
    <span class="jn-nav__icon">${iconMarkup('menu')}</span>
    <span class="jn-nav__label">المزيد</span>
  `;

  const menu = document.createElement('div');
  menu.className = 'jn-nav__mobile-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  sections.slice(MOBILE_PRIMARY_COUNT).forEach((section) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'jn-nav__mobile-menu-item';
    item.dataset.sectionId = section.id;
    item.setAttribute('role', 'menuitem');
    item.innerHTML = `
      <span class="jn-nav__mobile-menu-icon">${iconMarkup(section.icon)}</span>
      <span>${escapeHtml(section.label)}</span>
    `;
    item.addEventListener('click', () => {
      closeMenu();
      onSelect(section.id);
    });
    menu.appendChild(item);
  });

  function openMenu() {
    menu.hidden = false;
    moreBtn.setAttribute('aria-expanded', 'true');
    moreBtn.classList.add('is-open');
    requestAnimationFrame(() => menu.querySelector('button')?.focus());
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onOutsideClick, true);
  }

  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.classList.remove('is-open');
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onOutsideClick, true);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
      moreBtn.focus();
    }
  }

  function onOutsideClick(event) {
    if (!moreWrap.contains(event.target)) closeMenu();
  }

  moreBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden ? openMenu() : closeMenu();
  });

  moreWrap.append(moreBtn, menu);
  navEl.appendChild(moreWrap);

  syncMoreActiveState(navEl, activeSection);
}

function createSectionButton(section, activeSection, onSelect) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'jn-nav__item';
  btn.dataset.sectionId = section.id;
  btn.setAttribute('aria-current', section.id === activeSection ? 'page' : 'false');
  btn.innerHTML = `
    <span class="jn-nav__icon">${iconMarkup(section.icon)}</span>
    <span class="jn-nav__label">${escapeHtml(section.label)}</span>
  `;
  btn.addEventListener('click', () => onSelect(section.id));
  return btn;
}

export function setActiveNavItem(navEl, activeSection) {
  navEl.querySelectorAll('[data-section-id]').forEach((btn) => {
    const isActive = btn.dataset.sectionId === activeSection;
    if (btn.classList.contains('jn-nav__item')) {
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
    btn.classList.toggle('is-active', isActive);
  });
  syncMoreActiveState(navEl, activeSection);
}

function syncMoreActiveState(navEl, activeSection) {
  const moreBtn = navEl.querySelector('.jn-nav__more');
  if (!moreBtn) return;
  const activeSecondary = [...navEl.querySelectorAll('.jn-nav__item--mobile-secondary')]
    .some((btn) => btn.dataset.sectionId === activeSection);
  moreBtn.classList.toggle('has-active-child', activeSecondary);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
