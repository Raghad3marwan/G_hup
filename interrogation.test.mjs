import assert from 'node:assert/strict';
import { getAvailableQuestions, askQuestion, confrontWithEvidence } from '../engine/domains/interrogation/InterrogationDomain.js';

const caseData = {
  evidence: [{ id:'e1', title:'دليل 1' }],
  interrogations: {
    p1: {
      questions: [
        { id:'q1', text:'س1', answer:'ج1' },
        { id:'q2', text:'س2', answer:'ج2', unlockWhen:{type:'personQuestionAnswered',personId:'p1',questionId:'q1'} }
      ],
      confrontations: [{ id:'c1', evidenceId:'e1', response:'رد', setFlag:'f1' }],
      wrongConfrontationResponse:'لا شيء'
    }
  }
};
let state = { evidenceState:{e1:{discovery:'discovered'}}, interrogationState:{}, flags:{} };
const stateManager = { getState:()=>state, setState:(fn)=>{state=fn(state);} };
const emitted=[]; const eventBus={emit:(...x)=>emitted.push(x)};
assert.deepEqual(getAvailableQuestions({personId:'p1',caseData,state}).map(x=>x.id),['q1']);
assert.equal(askQuestion({personId:'p1',questionId:'q1',caseData,stateManager,eventBus,now:1}),true);
assert.deepEqual(getAvailableQuestions({personId:'p1',caseData,state}).map(x=>x.id),['q2']);
const result=confrontWithEvidence({personId:'p1',evidenceId:'e1',caseData,stateManager,eventBus,now:2});
assert.equal(result.success,true);
assert.equal(state.flags.f1,true);
assert.equal(state.interrogationState.p1.transcript.length,2);
console.log('Interrogation Domain ✓ PASSED');
