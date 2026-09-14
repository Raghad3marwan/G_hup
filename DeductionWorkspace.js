import { isDeductionUnlocked, submitDeduction, evaluateDeductionCondition } from '../engine/domains/DeductionDomain.js';

export function renderDeductionWorkspace(host,{caseData,stateManager,eventBus}) {
  const config=caseData?.deduction||{}; const state=stateManager.getState();
  const saved=state.deductionState||{}; const answers=deepClone(saved.answers||{}); const unlockedAtRender=isDeductionUnlocked(config,state);
  host.innerHTML=`<section class="jn-deduction"><header class="jn-deduction__head"><div><span class="jn-kicker">FINAL DEDUCTION</span><h1>تقرير الاستنتاج النهائي</h1><p>قدّم النظرية كاملة. التقديم الخاطئ لا يكشف أي جزء صحيح أو خاطئ.</p></div><div class="jn-deduction__seal">جنايات<br><small>تقرير ختامي</small></div></header><div data-role="body"></div></section>`;
  const body=host.querySelector('[data-role=body]');
  if (!unlockedAtRender) {
    body.innerHTML=`<div class="jn-deduction__locked"><strong>الاستنتاج النهائي غير متاح بعد</strong><p>${esc(config.lockedMessage||'لا تزال بعض مواد التحقيق الأساسية غير مكتملة.')}</p><small>إذا اكتملت مادة أثناء بقائك في هذه الصفحة، ستتحدث البوابة تلقائيًا.</small></div>`;
    const unsub = stateManager.subscribe((nextState) => {
      if (isDeductionUnlocked(config, nextState)) {
        unsub?.();
        renderDeductionWorkspace(host,{caseData,stateManager,eventBus});
      }
    });
    return () => unsub?.();
  }
  if(saved.completed){ renderCaseClosure(body,config,{caseData,stateManager,staticView:true}); return; }
  const submitReady = !config.submitWhen || evaluateDeductionCondition(config.submitWhen,stateManager.getState());
  body.innerHTML=`<div class="jn-deduction__paper"><div class="jn-deduction__meta"><span>القضية: ${esc(caseData?.meta?.title||caseData?.title||'ملف')}</span><span>محاولات التقديم: ${saved.attempts||0}</span></div>${!submitReady?`<div class="jn-deduction__feedback is-warn">${esc(config.submitLockedMessage||'لا يمكن إرسال التقرير النهائي بعد.')}</div>`:''}<form data-role="form">${(config.questions||[]).map((q,i)=>renderQuestion(q,i,caseData,answers[q.id])).join('')}<div class="jn-deduction__feedback" data-role="feedback" hidden></div><button class="jn-btn jn-btn--primary jn-deduction__submit" type="submit">تقديم الاستنتاج النهائي</button></form></div>`;
  const form=body.querySelector('[data-role=form]');
  form.addEventListener('change',()=>collect(form,config.questions||[],answers));
  form.addEventListener('submit',e=>{e.preventDefault();collect(form,config.questions||[],answers);const r=submitDeduction({config,stateManager,answers});const f=body.querySelector('[data-role=feedback]');f.hidden=false;if(!r.ok){f.className='jn-deduction__feedback is-warn';f.textContent=r.reason==='submit_locked'?(config.submitLockedMessage||'لا يمكن إرسال التقرير النهائي بعد.'):'أكمل جميع بنود التقرير قبل تقديمه.';}else if(!r.correct){f.className='jn-deduction__feedback is-warn';f.textContent=config.wrongMessage||'النظرية المقدمة لا تتوافق بالكامل مع معطيات الملف. راجع التحقيق وأعد المحاولة.';eventBus?.emit?.('deduction:failed',{});}else{eventBus?.emit?.('deduction:completed',{});renderCaseClosure(body,config,{caseData,stateManager,staticView:false});}});
}

function renderQuestion(q,i,cd,answer){
  if(q.type==='compound'){
    const a=answer&&typeof answer==='object'?answer:{};
    return `<fieldset class="jn-deduction__q jn-deduction__q--compound"><legend><b>${String(i+1).padStart(2,'0')}</b>${esc(q.prompt)}</legend><div class="jn-deduction-compound">${(q.fields||[]).map((f)=>renderField(q.id,f,cd,a[f.id])).join('')}</div></fieldset>`;
  }
  return `<fieldset class="jn-deduction__q"><legend><b>${String(i+1).padStart(2,'0')}</b>${esc(q.prompt)}</legend>${renderField(q.id,{...q,id:'value'},cd,answer,true)}</fieldset>`;
}
function renderField(qid,f,cd,value,top=false){
  const opts=options(f,cd); const multi=f.type==='multiple_choice'||f.type==='evidence_multiple'; const name=top?qid:`${qid}::${f.id}`;
  return `<section class="jn-deduction-field"><h3>${esc(f.prompt||'')}</h3>${f.help?`<p>${esc(f.help)}</p>`:''}<div class="jn-deduction__options">${opts.map(o=>`<label><input type="${multi?'checkbox':'radio'}" name="${escA(name)}" value="${escA(o.value)}" ${(multi?(Array.isArray(value)?value:[]).includes(o.value):value===o.value)?'checked':''}><span>${esc(o.label)}</span></label>`).join('')}</div></section>`;
}
function options(q,cd){if(q.type==='person_choice')return [...(cd.people||[]).filter(p=>p.role!=='victim').map(x=>({value:x.id,label:x.name||x.id})),...(q.includeUndetermined?[{value:'undetermined',label:'غير محسوم'}]:[])];if(q.type==='evidence_choice'||q.type==='evidence_multiple')return (cd.evidence||[]).filter(e=>!q.familyIds||q.familyIds.includes(e.familyId)).map(x=>({value:x.id,label:`${x.reference||x.id} · ${x.shortTitle||x.title||x.id}`}));return q.options||[]}
function collect(form,qs,a){for(const q of qs){if(q.type==='compound'){const obj={...(a[q.id]||{})};for(const f of q.fields||[]){obj[f.id]=readField(form,`${q.id}::${f.id}`,f.type)}a[q.id]=obj}else a[q.id]=readField(form,q.id,q.type)}}
function readField(form,name,type){const els=[...form.querySelectorAll(`[name="${cssEscape(name)}"]`)];return type==='multiple_choice'||type==='evidence_multiple'?els.filter(x=>x.checked).map(x=>x.value):(els.find(x=>x.checked)?.value||'')}
function cssEscape(v){return String(v).replace(/(["\\])/g,'\\$1')}

function renderCaseClosure(body,config,{caseData,stateManager,staticView=false}={}){
  const title=caseData?.meta?.title||caseData?.title||'ملف القضية'; const caseNo=caseData?.meta?.caseNumber||caseData?.meta?.id||caseData?.id||'CASE FILE';
  body.innerHTML=`<div class="jn-case-close ${staticView?'is-final':''}" aria-live="polite"><div class="jn-case-close__desk"><div class="jn-case-close__file"><div class="jn-case-close__paper"><span>FINAL REPORT</span><strong>تقرير الاستنتاج النهائي</strong><i></i><i></i><i></i></div><div class="jn-case-close__cover"><small>JINAYAT / CASE FILE</small><b>ملف القضية</b><div class="jn-case-close__identity"><span>${esc(caseNo)}</span><strong>${esc(title)}</strong></div><em>حالة الملف: مغلق</em></div><div class="jn-case-close__stamp">تم حل القضية</div></div><div class="jn-case-close__caption">تم إغلاق ملف القضية</div><div class="jn-case-close__final-mark" aria-hidden="true">CASE CLOSED</div><button class="jn-case-close__message-btn" type="button" data-role="open-investigator-message"><span>رسالة</span></button></div></div>`;
  body.querySelector('[data-role=open-investigator-message]')?.addEventListener('click',()=>renderInvestigatorMessage(body,{caseData,stateManager}));
}
function renderInvestigatorMessage(body,{caseData,stateManager}={}){const title=caseData?.meta?.title||'ملف القضية';const currentName=stateManager?.getState?.()?.deductionState?.investigatorName||'';body.innerHTML=`<section class="jn-investigator-letter"><button class="jn-investigator-letter__back" type="button" data-role="back-to-closed-case">← العودة إلى ملف القضية</button><div class="jn-investigator-letter__paper"><div class="jn-investigator-letter__mark">JINAYAT / PRIVATE MESSAGE</div><span class="jn-investigator-letter__kicker">إلى المحقق</span><h2>أحسنت إغلاق ملف «${esc(title)}»</h2><label class="jn-investigator-letter__name"><span>دوّن اسمك كمحقق هذه القضية</span><input type="text" maxlength="40" placeholder="اسم المحقق" value="${escA(currentName)}" data-role="investigator-name"></label><p class="jn-investigator-letter__copy" data-role="thanks-copy">${thanksCopy(currentName)}</p><p class="jn-investigator-letter__invite">لم تنتهِ ملفات «جنايات» هنا. نأمل أن نراك مجددًا في تحقيقات وقضايا قادمة.</p><div class="jn-investigator-letter__signature">— إدارة ملفات جنايات</div></div></section>`;const input=body.querySelector('[data-role=investigator-name]');const copy=body.querySelector('[data-role=thanks-copy]');input?.addEventListener('input',()=>{const name=input.value.trim().slice(0,40);if(copy)copy.textContent=thanksCopy(name);stateManager?.setState?.(state=>({...state,deductionState:{...(state.deductionState||{}),investigatorName:name}}))});body.querySelector('[data-role=back-to-closed-case]')?.addEventListener('click',()=>renderCaseClosure(body,caseData?.deduction||{},{caseData,stateManager,staticView:true}));}
function thanksCopy(name=''){return name?`شكرًا لك، ${name}، على إتمام التحقيق وإغلاق هذا الملف بنجاح.`:'شكرًا لك على إتمام التحقيق وإغلاق هذا الملف بنجاح.'}
function deepClone(v){try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v||{}))}}
function esc(v=''){const d=document.createElement('div');d.textContent=String(v);return d.innerHTML} function escA(v=''){return esc(v).replace(/"/g,'&quot;')}
