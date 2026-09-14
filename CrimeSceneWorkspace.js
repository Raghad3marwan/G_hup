import { iconMarkup } from './icons/icons.js';
import { interactHotspot, markSceneVisited } from '../engine/domains/crime-scene/CrimeSceneDomain.js';
import { discoverEvidence } from '../engine/domains/evidence/EvidenceDomain.js';
import { openPuzzleModal } from './PuzzleModal.js';
import { isPuzzleSolved } from '../engine/domains/PuzzleDomain.js';

export function renderCrimeSceneWorkspace(workspaceEl, { caseData, stateManager, eventBus }) {
  const scenes = caseData?.crimeScenes || [];
  if (!scenes.length) {
    workspaceEl.innerHTML = `<section class="jn-crime"><div class="jn-crime__empty"><span class="jn-mono">CRIME SCENE / EMPTY</span><h1>لا يوجد مسرح جريمة في هذه القضية</h1><p>تحدد القضية المشاهد ونقاط الفحص من Case Data.</p></div></section>`;
    return;
  }

  let activeSceneId = stateManager.getState()?.navigation?.activeCrimeSceneId || scenes[0].id;
  let zoom = 1;
  let selectedHotspotId = null;

  workspaceEl.innerHTML = `<section class="jn-crime jn-anim-section-enter" aria-labelledby="jn-crime-title">
    <header class="jn-crime__header">
      <div><span class="jn-crime__eyebrow jn-mono">SCENE EXAMINATION / ${escapeHtml(activeSceneId.toUpperCase())}</span><h1 id="jn-crime-title">مسرح الجريمة</h1><p>افحص المشهد بعناية. ليست كل التفاصيل المهمة واضحة من النظرة الأولى.</p></div>
      <div class="jn-crime__scene-switcher" data-role="scene-switcher"></div>
    </header>
    <div class="jn-crime__layout">
      <div class="jn-crime-viewer">
        <div class="jn-crime-viewer__toolbar">
          <span class="jn-mono" data-role="scene-ref"></span>
          <div class="jn-crime-viewer__zoom" aria-label="أدوات التكبير">
            <button class="jn-btn jn-btn--icon" data-role="zoom-out" aria-label="تصغير">−</button>
            <span class="jn-mono" data-role="zoom-label">100%</span>
            <button class="jn-btn jn-btn--icon" data-role="zoom-in" aria-label="تكبير">+</button>
            <button class="jn-btn jn-btn--ghost jn-crime__reset" data-role="zoom-reset">ملاءمة</button>
          </div>
        </div>
        <div class="jn-crime-viewer__viewport" data-role="viewport">
          <div class="jn-crime-viewer__canvas" data-role="canvas"></div>
        </div>
        <div class="jn-crime-viewer__hint"><span aria-hidden="true">⌖</span><span>مرّر المؤشر أو المس مناطق المشهد للفحص. نقاط التفاعل لا تظهر كعلامات ألعاب كبيرة.</span></div>
      </div>
      <aside class="jn-crime-inspector" data-role="inspector" aria-live="polite"></aside>
    </div>
  </section>`;

  const canvas = workspaceEl.querySelector('[data-role="canvas"]');
  const inspector = workspaceEl.querySelector('[data-role="inspector"]');
  const switcher = workspaceEl.querySelector('[data-role="scene-switcher"]');
  const ref = workspaceEl.querySelector('[data-role="scene-ref"]');
  const zoomLabel = workspaceEl.querySelector('[data-role="zoom-label"]');

  workspaceEl.querySelector('[data-role="zoom-in"]').addEventListener('click', () => setZoom(Math.min(1.75, zoom + .25)));
  workspaceEl.querySelector('[data-role="zoom-out"]').addEventListener('click', () => setZoom(Math.max(1, zoom - .25)));
  workspaceEl.querySelector('[data-role="zoom-reset"]').addEventListener('click', () => setZoom(1));

  function setZoom(value) { zoom = value; canvas.style.setProperty('--jn-scene-zoom', zoom); zoomLabel.textContent = `${Math.round(zoom * 100)}%`; }

  function renderScene() {
    const scene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
    activeSceneId = scene.id;
    markSceneVisited({ sceneId: scene.id, stateManager });
    stateManager.setState((state) => ({ ...state, navigation: { ...state.navigation, activeCrimeSceneId: scene.id } }));
    selectedHotspotId = null;
    ref.textContent = `${scene.reference || scene.id} · ${scene.name}`;
    switcher.innerHTML = scenes.map((s, i) => `<button type="button" class="jn-crime__scene-chip ${s.id === scene.id ? 'is-active' : ''}" data-scene-id="${escapeAttr(s.id)}"><span class="jn-mono">${String(i + 1).padStart(2,'0')}</span>${escapeHtml(s.name)}</button>`).join('');
    switcher.querySelectorAll('[data-scene-id]').forEach((button) => button.addEventListener('click', () => { activeSceneId = button.dataset.sceneId; setZoom(1); renderScene(); }));

    canvas.innerHTML = `<img src="${escapeAttr(scene.image)}" alt="${escapeAttr(scene.alt || scene.name)}" draggable="false">${(scene.hotspots || []).map((h) => hotspotButton(h, scene)).join('')}`;
    canvas.querySelectorAll('[data-hotspot-id]').forEach((button) => button.addEventListener('click', () => {
      selectedHotspotId = button.dataset.hotspotId;
      const hotspot = interactHotspot({ sceneId: scene.id, hotspotId: selectedHotspotId, caseData, stateManager, eventBus });
      if (hotspot?.puzzleRef || hotspot?.type === 'puzzle') {
        const puzzleId = hotspot.puzzleRef || hotspot.targetRef;
        if (puzzleId) openPuzzleModal({ puzzleId, caseData, stateManager, eventBus });
      } else if (hotspot?.targetRef && ['evidence','digital_device','locked_object'].includes(hotspot.type)) {
        discoverEvidence({ evidenceId: hotspot.targetRef, source: { type: 'crimeScene', sceneId: scene.id, hotspotId: hotspot.id }, caseData, stateManager, eventBus });
      }
      renderInspector(scene, hotspot);
      updateDiscoveredStyles(scene);
    }));
    updateDiscoveredStyles(scene);
    renderInspector(scene, null);
  }

  function hotspotButton(h, scene) {
    const size = h.size || 7;
    const showDevPuzzle = !!scene?.devShowPuzzleMarkers && h.type === 'puzzle';
    const cls = `jn-scene-hotspot ${showDevPuzzle ? 'jn-scene-hotspot--dev-puzzle' : ''}`;
    const label = showDevPuzzle ? `<b class="jn-dev-puzzle-label">🔐 ${escapeHtml(h.title || 'عنصر مقفل')}</b>` : '';
    return `<button type="button" class="${cls}" data-hotspot-id="${escapeAttr(h.id)}" style="--x:${Number(h.x)}%;--y:${Number(h.y)}%;--size:${Number(size)}%;" aria-label="${escapeAttr(showDevPuzzle ? (h.title || 'عنصر مقفل') : 'فحص جزء من المشهد')}"><span></span>${label}</button>`;
  }

  function updateDiscoveredStyles(scene) {
    const discovered = stateManager.getState()?.crimeSceneState?.[scene.id]?.discoveredHotspots || {};
    canvas.querySelectorAll('[data-hotspot-id]').forEach((button) => button.classList.toggle('is-discovered', !!discovered[button.dataset.hotspotId]?.discovered));
  }

  function renderInspector(scene, hotspot) {
    const discovered = stateManager.getState()?.crimeSceneState?.[scene.id]?.discoveredHotspots || {};
    const count = Object.keys(discovered).length;
    if (!hotspot) {
      inspector.innerHTML = `<div class="jn-crime-inspector__top"><span class="jn-mono">SCENE NOTES</span><h2>${escapeHtml(scene.name)}</h2><p>${escapeHtml(scene.description || 'ابدأ بفحص المشهد، وستظهر هنا التفاصيل التي اخترت فحصها.')}</p></div><div class="jn-crime-inspector__status"><span>تم فحص</span><strong>${count}</strong><span>تفاصيل حتى الآن</span></div><p class="jn-crime-inspector__privacy">لا نعرض العدد الإجمالي للنقاط المخفية حتى لا نكشف حجم المحتوى مسبقًا.</p>`;
      return;
    }
    const typeLabels = { evidence:'دليل محتمل', scene_detail:'تفصيل في المشهد', document:'مستند', digital_device:'جهاز رقمي', locked_object:'عنصر مقفل', puzzle:'عنصر يحتاج حلًا', scene_transition:'انتقال' };
    const puzzleId = hotspot.puzzleRef || (hotspot.type === 'puzzle' ? hotspot.targetRef : null);
    const puzzleSolved = puzzleId ? isPuzzleSolved(stateManager.getState(), puzzleId) : false;
    inspector.innerHTML = `<div class="jn-crime-inspector__top"><span class="jn-mono">EXAMINED / ${escapeHtml(hotspot.id.toUpperCase())}</span><span class="jn-crime-inspector__type">${escapeHtml(typeLabels[hotspot.type] || 'تفصيل')}</span><h2>${escapeHtml(hotspot.title || 'تفصيل تم فحصه')}</h2><p>${escapeHtml(hotspot.description || 'تم تسجيل هذا التفصيل ضمن معاينة المشهد.')}</p></div>${hotspot.targetRef ? `<div class="jn-crime-inspector__link"><span>${iconMarkup('evidence')}</span><div><small>مرجع مرتبط</small><strong class="jn-mono">${escapeHtml(hotspot.targetRef)}</strong></div></div>` : ''}${puzzleId ? `<button class="jn-btn jn-btn--primary jn-crime__puzzle-open" data-role="open-puzzle">${puzzleSolved ? 'عرض العنصر المفتوح' : 'محاولة فتح العنصر'}</button>` : ''}<div class="jn-crime-inspector__stamp">${puzzleSolved ? 'تم الفتح' : 'تم الفحص'}</div>`;
    inspector.querySelector('[data-role="open-puzzle"]')?.addEventListener('click',()=>openPuzzleModal({ puzzleId, caseData, stateManager, eventBus }));
  }

  renderScene();
}

function escapeHtml(value='') { const d=document.createElement('div'); d.textContent=String(value); return d.innerHTML; }
function escapeAttr(value='') { return escapeHtml(value).replace(/"/g,'&quot;'); }
