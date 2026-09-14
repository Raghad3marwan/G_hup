import { getPuzzle, getPuzzleState, submitPuzzle } from '../engine/domains/PuzzleDomain.js';

export function openPuzzleModal({ puzzleId, caseData, stateManager, eventBus }) {
  const puzzle = getPuzzle(caseData, puzzleId);
  if (!puzzle) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'jn-puzzle-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', puzzle.title || 'لغز');
  document.body.appendChild(backdrop);

  let sequence = [];
  let keypadValue = '';
  let dialValues = Array.isArray(puzzle.initialValues) ? [...puzzle.initialValues] : Array((puzzle.solution || []).length || 3).fill(0);

  const close = () => {
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
  };
  const onKeydown = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKeydown);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  function render() {
    const state = getPuzzleState(stateManager.getState(), puzzleId);
    backdrop.innerHTML = `
      <section class="jn-puzzle-shell ${state.solved ? 'is-solved' : ''}">
        <header class="jn-puzzle-shell__header">
          <div><span class="jn-mono">SECURED OBJECT / ${esc(puzzle.reference || puzzle.id)}</span><h2>${esc(puzzle.title || 'عنصر مقفل')}</h2></div>
          <button type="button" class="jn-puzzle-close" data-role="close" aria-label="إغلاق">×</button>
        </header>
        <div class="jn-puzzle-shell__body">
          <div class="jn-puzzle-brief">
            <span class="jn-puzzle-brief__label">ملاحظة الفحص</span>
            <p>${esc(puzzle.prompt || 'افحص العنصر وأدخل الحل المناسب لفتحه.')}</p>
            ${puzzle.clue ? `<div class="jn-puzzle-clue"><span>قرينة متاحة</span><strong>${esc(puzzle.clue)}</strong></div>` : ''}
          </div>
          <div class="jn-puzzle-device" data-role="device"></div>
          <div class="jn-puzzle-feedback" data-role="feedback" aria-live="polite"></div>
        </div>
        <footer class="jn-puzzle-shell__footer"><span>المحاولات: <b>${state.attempts || 0}</b></span><span>${state.solved ? 'الحالة: مفتوح' : 'الحالة: مقفل'}</span></footer>
      </section>`;
    backdrop.querySelector('[data-role="close"]').addEventListener('click', close);
    renderDevice(backdrop.querySelector('[data-role="device"]'), state);
    if (state.solved) showFeedback(true, puzzle.successMessage || 'تم فتح العنصر بنجاح.');
  }

  function renderDevice(host, state) {
    if (state.solved) {
      host.innerHTML = `<div class="jn-puzzle-solved"><div class="jn-puzzle-solved__seal">✓</div><h3>تم فك القفل</h3><p>${esc(puzzle.openedDescription || 'أصبح محتوى هذا العنصر متاحًا ضمن التحقيق.')}</p><button class="jn-btn jn-btn--primary" data-role="done">متابعة التحقيق</button></div>`;
      host.querySelector('[data-role="done"]').addEventListener('click', close);
      return;
    }

    if (puzzle.type === 'keypad') {
      host.innerHTML = `<div class="jn-keypad"><div class="jn-keypad__screen jn-mono" data-role="keypad-screen">${keypadValue ? '•'.repeat(keypadValue.length) : '— — — —'}</div><div class="jn-keypad__grid">${[1,2,3,4,5,6,7,8,9,'مسح',0,'إدخال'].map(k=>`<button type="button" data-key="${k}" class="${k==='إدخال'?'is-enter':''}">${k}</button>`).join('')}</div></div>`;
      host.querySelectorAll('[data-key]').forEach(btn => btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (k === 'مسح') keypadValue = '';
        else if (k === 'إدخال') return attempt(keypadValue);
        else if (keypadValue.length < (puzzle.maxLength || 8)) keypadValue += k;
        host.querySelector('[data-role="keypad-screen"]').textContent = keypadValue ? '•'.repeat(keypadValue.length) : '— — — —';
      }));
    } else if (puzzle.type === 'text_password') {
      host.innerHTML = `<div class="jn-password"><label>أدخل كلمة المرور</label><input type="password" data-role="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${escAttr(puzzle.placeholder || 'اكتب الإجابة هنا')}"><button class="jn-btn jn-btn--primary" data-role="submit">فتح</button></div>`;
      const input = host.querySelector('[data-role="password"]');
      host.querySelector('[data-role="submit"]').addEventListener('click',()=>attempt(input.value));
      input.addEventListener('keydown',(e)=>{if(e.key==='Enter') attempt(input.value);});
    } else if (puzzle.type === 'combinationDial') {
      host.innerHTML = `<div class="jn-dials">${dialValues.map((v,i)=>`<div class="jn-dial"><button data-dial="${i}" data-dir="up">▲</button><strong class="jn-mono" data-dial-value="${i}">${v}</strong><button data-dial="${i}" data-dir="down">▼</button></div>`).join('')}</div><button class="jn-btn jn-btn--primary jn-puzzle-submit" data-role="submit">تجربة الرمز</button>`;
      host.querySelectorAll('[data-dial]').forEach(btn=>btn.addEventListener('click',()=>{
        const i=Number(btn.dataset.dial); const max=Number(puzzle.dialMax ?? 9);
        dialValues[i]=btn.dataset.dir==='up' ? (dialValues[i]+1)%(max+1) : (dialValues[i]-1+max+1)%(max+1);
        host.querySelector(`[data-dial-value="${i}"]`).textContent=dialValues[i];
      }));
      host.querySelector('[data-role="submit"]').addEventListener('click',()=>attempt([...dialValues]));
    } else if (puzzle.type === 'sequenceClick') {
      const choices = puzzle.choices || [];
      host.innerHTML = `<div class="jn-sequence"><div class="jn-sequence__progress" data-role="seq-progress">${sequence.length ? sequence.map(x=>esc(labelFor(x))).join(' ← ') : 'لم يتم اختيار تسلسل بعد'}</div><div class="jn-sequence__choices">${choices.map(c=>`<button type="button" data-seq="${escAttr(c.value)}">${esc(c.label)}</button>`).join('')}</div><div class="jn-sequence__actions"><button class="jn-btn jn-btn--ghost" data-role="reset">إعادة</button><button class="jn-btn jn-btn--primary" data-role="submit">اعتماد التسلسل</button></div></div>`;
      host.querySelectorAll('[data-seq]').forEach(btn=>btn.addEventListener('click',()=>{
        if(sequence.length < (puzzle.solution || []).length) sequence.push(btn.dataset.seq);
        host.querySelector('[data-role="seq-progress"]').textContent=sequence.map(x=>labelFor(x)).join(' ← ');
      }));
      host.querySelector('[data-role="reset"]').addEventListener('click',()=>{sequence=[];renderDevice(host,getPuzzleState(stateManager.getState(),puzzleId));});
      host.querySelector('[data-role="submit"]').addEventListener('click',()=>attempt([...sequence]));
    } else {
      host.innerHTML = `<p>نوع اللغز غير مدعوم.</p>`;
    }
  }

  function labelFor(value) { return (puzzle.choices || []).find(c=>String(c.value)===String(value))?.label || value; }

  function attempt(answer) {
    const result = submitPuzzle({ puzzleId, answer, caseData, stateManager, eventBus });
    if (result.correct) {
      render();
    } else {
      showFeedback(false, puzzle.wrongMessage || 'لم يفتح القفل. راجع القرائن وحاول مرة أخرى.');
      const shell=backdrop.querySelector('.jn-puzzle-shell'); shell.classList.remove('is-wrong'); void shell.offsetWidth; shell.classList.add('is-wrong');
    }
  }

  function showFeedback(success, text) {
    const el=backdrop.querySelector('[data-role="feedback"]'); if(!el)return;
    el.className=`jn-puzzle-feedback ${success?'is-success':'is-error'}`; el.textContent=text;
  }

  render();
}

function esc(v=''){const d=document.createElement('div');d.textContent=String(v);return d.innerHTML;}
function escAttr(v=''){return esc(v).replace(/"/g,'&quot;');}
