import assert from 'node:assert/strict';
import { validateAnswer, submitPuzzle } from '../engine/domains/PuzzleDomain.js';

assert.equal(validateAnswer({type:'keypad',solution:'4317'}, '4317'), true);
assert.equal(validateAnswer({type:'keypad',solution:'4317'}, '4318'), false);
assert.equal(validateAnswer({type:'text_password',solution:'ARCHIVE',caseSensitive:false}, 'archive'), true);
assert.equal(validateAnswer({type:'combinationDial',solution:[2,7,4]}, [2,7,4]), true);
assert.equal(validateAnswer({type:'sequenceClick',solution:['a','b']}, ['b','a']), false);

let state={puzzleState:{},evidenceState:{},notifications:[],flags:{}};
const stateManager={getState:()=>state,setState:(updater)=>{state=typeof updater==='function'?updater(state):updater;}};
const emitted=[]; const eventBus={emit:(name,payload)=>emitted.push([name,payload])};
const caseData={evidence:[{id:'ev1',analysis:{required:false}}],puzzles:[{id:'p1',type:'keypad',solution:'12',successEffects:[{type:'revealEvidence',evidenceId:'ev1'},{type:'setFlag',key:'opened',value:true}]}]};
let r=submitPuzzle({puzzleId:'p1',answer:'11',caseData,stateManager,eventBus,now:100});
assert.equal(r.correct,false); assert.equal(state.puzzleState.p1.attempts,1); assert.equal(state.flags.opened,undefined);
r=submitPuzzle({puzzleId:'p1',answer:'12',caseData,stateManager,eventBus,now:200});
assert.equal(r.correct,true); assert.equal(state.puzzleState.p1.solved,true); assert.equal(state.flags.opened,true); assert.equal(state.evidenceState.ev1.discovery,'discovered');
assert.ok(emitted.some(([name])=>name==='puzzle:solved'));
console.log('Puzzle Domain tests passed.');
