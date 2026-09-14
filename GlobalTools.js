import { iconMarkup } from './icons/icons.js';
import { conditionMet } from '../engine/domains/interrogation/InterrogationDomain.js';

export function renderGlobalTools(container, tools, onToggle) {
  const buttons = new Map();
  for (const tool of tools) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `jn-global-tool jn-global-tool--${tool.id}`;
    btn.setAttribute('aria-label', tool.label);
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.dataset.toolId = tool.id;
    btn.innerHTML = `
      <span class="jn-global-tool__icon" aria-hidden="true">${iconMarkup(tool.icon)}</span>
      <span class="jn-global-tool__label">${tool.label}</span>
    `;
    if (tool.id === 'notifications') {
      const badge = document.createElement('span');
      badge.className = 'jn-badge jn-badge--floating';
      badge.dataset.role='notification-badge';
      badge.style.display='none';
      badge.textContent='0';
      btn.appendChild(badge);
    }
    btn.addEventListener('click', () => onToggle(tool.id, btn));
    buttons.set(tool.id, btn);
    container.appendChild(btn);
  }
  return buttons;
}

export function updateNotificationBadge(buttons, state) {
  const badge = buttons.get('notifications')?.querySelector('[data-role="notification-badge"]');
  if (!badge) return;
  const count = (state?.notifications || []).filter(n => !n.read).length;
  badge.textContent = String(count); badge.style.display = count ? 'inline-flex' : 'none';
}

export function renderToolContent({ toolId, host, caseData, stateManager, eventBus, onNavigate }) {
  const state = stateManager.getState();
  if (toolId === 'notebook') return renderNotebook(host, stateManager, eventBus);
  if (toolId === 'hints') return renderHints(host, caseData, stateManager, eventBus);
  if (toolId === 'notifications') return renderNotifications(host, stateManager, eventBus, onNavigate);
}

function renderNotebook(host, stateManager, eventBus) {
  const state = stateManager.getState(); const facts = state?.notes?.automaticFacts || []; const personal = state?.notes?.personalNotes || [];
  host.innerHTML = `<div class="jn-tool-tabs"><span class="jn-tool-chip">حقائق تلقائية ${facts.length}</span><span class="jn-tool-chip">ملاحظاتي ${personal.length}</span></div>
    <section class="jn-tool-section"><h4>حقائق التحقيق</h4><div class="jn-tool-list">${facts.length ? facts.map(f=>`<article class="jn-tool-entry"><strong>${esc(f.title||'معلومة')}</strong><p>${esc(f.text||f.message||'')}</p></article>`).join('') : '<p class="jn-tool-empty">ستظهر هنا المعلومات المهمة التي يسجلها النظام أثناء التحقيق.</p>'}</div></section>
    <section class="jn-tool-section"><h4>ملاحظاتي الشخصية</h4><form data-role="note-form" class="jn-note-form"><textarea maxlength="500" placeholder="اكتب ملاحظة للمحقق…" aria-label="ملاحظة جديدة"></textarea><button class="jn-btn jn-btn--primary" type="submit">حفظ الملاحظة</button></form><div class="jn-tool-list">${personal.length ? personal.slice().reverse().map(n=>`<article class="jn-tool-entry jn-tool-entry--personal"><p>${esc(n.text)}</p><button type="button" data-delete-note="${esc(n.id)}" class="jn-tool-delete">حذف</button></article>`).join('') : '<p class="jn-tool-empty">لا توجد ملاحظات شخصية بعد.</p>'}</div></section>`;
  host.querySelector('[data-role="note-form"]')?.addEventListener('submit', e=>{e.preventDefault(); const ta=e.currentTarget.querySelector('textarea'); const text=ta.value.trim(); if(!text)return; stateManager.setState(s=>({...s,notes:{...(s.notes||{}),automaticFacts:s.notes?.automaticFacts||[],personalNotes:[...(s.notes?.personalNotes||[]),{id:`note-${Date.now()}`,text,createdAt:Date.now()}]}})); eventBus?.emit('notebook:noteAdded',{text}); renderNotebook(host,stateManager,eventBus);});
  host.querySelectorAll('[data-delete-note]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.deleteNote; stateManager.setState(s=>({...s,notes:{...(s.notes||{}),personalNotes:(s.notes?.personalNotes||[]).filter(n=>n.id!==id)}})); renderNotebook(host,stateManager,eventBus);}));
}

function renderHints(host, caseData, stateManager, eventBus) {
  const state=stateManager.getState(); const defs=(caseData?.hints||[]).filter(h=>conditionMet(h.unlockWhen,state)); const used=state?.hintsUsed||{};
  host.innerHTML=`<p class="jn-tool-intro">التلميحات تدريجية ولا تكشف الحل مباشرة. افتح المستوى التالي فقط إذا احتجته.</p><div class="jn-tool-list">${defs.length?defs.map(h=>{const level=Math.min(Number(used[h.id]||0),h.levels?.length||0); const shown=(h.levels||[]).slice(0,level); return `<article class="jn-hint-card"><div class="jn-hint-head"><strong>${esc(h.title||'مسار تلميح')}</strong><span>${level}/${h.levels?.length||3}</span></div>${shown.map((x,i)=>`<p><b>المستوى ${i+1}:</b> ${esc(x)}</p>`).join('')}${level<(h.levels?.length||0)?`<button type="button" class="jn-btn jn-btn--secondary" data-hint="${esc(h.id)}">فتح التلميح ${level+1}</button>`:'<small>تم فتح جميع مستويات هذا التلميح.</small>'}</article>`}).join(''):'<p class="jn-tool-empty">لا يوجد تلميح مناسب لمرحلة التحقيق الحالية.</p>'}</div>`;
  host.querySelectorAll('[data-hint]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.hint; const h=defs.find(x=>x.id===id); stateManager.setState(s=>({...s,hintsUsed:{...(s.hintsUsed||{}),[id]:Math.min(Number(s.hintsUsed?.[id]||0)+1,h?.levels?.length||3)}})); eventBus?.emit('hint:used',{hintId:id}); renderHints(host,caseData,stateManager,eventBus);}));
}

function renderNotifications(host,stateManager,eventBus,onNavigate){
  const items=(stateManager.getState()?.notifications||[]).slice().reverse();
  host.innerHTML=`<div class="jn-tool-row"><span>${items.filter(n=>!n.read).length} غير مقروء</span>${items.some(n=>!n.read)?'<button type="button" class="jn-tool-link" data-read-all>تحديد الكل كمقروء</button>':''}</div><div class="jn-tool-list">${items.length?items.map(n=>`<button type="button" class="jn-notification ${n.read?'is-read':''}" data-notification="${esc(n.id)}"><span class="jn-notification__dot"></span><span><strong>${esc(n.title||'إشعار')}</strong><small>${esc(n.message||'')}</small></span></button>`).join(''):'<p class="jn-tool-empty">لا توجد إشعارات حتى الآن.</p>'}</div>`;
  host.querySelector('[data-read-all]')?.addEventListener('click',()=>{stateManager.setState(s=>({...s,notifications:(s.notifications||[]).map(n=>({...n,read:true}))})); renderNotifications(host,stateManager,eventBus,onNavigate);});
  host.querySelectorAll('[data-notification]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.notification; const n=(stateManager.getState()?.notifications||[]).find(x=>x.id===id); stateManager.setState(s=>({...s,notifications:(s.notifications||[]).map(x=>x.id===id?{...x,read:true}:x)})); if(n?.evidenceId) onNavigate?.('lab'); eventBus?.emit('notification:opened',{notificationId:id});}));
}

export function installAutomaticFactCapture({caseData,stateManager,eventBus}){
  const add=(id,title,text)=>stateManager.setState(s=>{const current=s.notes?.automaticFacts||[]; if(current.some(f=>f.id===id))return s; return {...s,notes:{...(s.notes||{}),automaticFacts:[...current,{id,title,text,createdAt:Date.now()}],personalNotes:s.notes?.personalNotes||[]}}});
  const evidence=id=>(caseData?.evidence||[]).find(e=>e.id===id);
  const offs=[];
  offs.push(eventBus.on('evidence:discovered',({evidenceId})=>{const e=evidence(evidenceId); add(`found:${evidenceId}`,'دليل جديد',`${e?.reference||evidenceId} · ${e?.title||'تم اكتشاف دليل جديد'}`);}));
  offs.push(eventBus.on('lab:analysisCompleted',({evidenceId})=>{const e=evidence(evidenceId); add(`lab:${evidenceId}`,'نتيجة مخبرية',`اكتمل تحليل ${e?.reference||evidenceId} · ${e?.title||''}`);}));
  offs.push(eventBus.on('interrogation:confrontSucceeded',({personId})=>{const p=(caseData?.people||[]).find(x=>x.id===personId); add(`confront:${personId}:${Date.now()}`,'مواجهة ناجحة',`تغيرت الإفادة بعد مواجهة ${p?.name||personId} بدليل.`);}));
  return ()=>offs.forEach(off=>off());
}
function esc(v=''){const d=document.createElement('div');d.textContent=String(v);return d.innerHTML;}
