import assert from 'node:assert/strict';
import { StateManager } from '../engine/core/state/StateManager.js';
import { confrontWithEvidence } from '../engine/domains/interrogation/InterrogationDomain.js';
const caseData={
 evidence:[{id:'A',title:'A'},{id:'B',title:'B'},{id:'S',title:'S'},{id:'X',title:'X'}],
 interrogations:{p:{wrongConfrontationResponse:'generic',questions:[],confrontations:[{id:'C1',requiredEvidenceIds:['A','B'],allowedSupportingIds:['S'],unlockWhen:null,response:'matched',setFlag:'T1'}]}}
};
function state(){return {evidenceState:{A:{discovery:'discovered'},B:{discovery:'discovered'},S:{discovery:'discovered'},X:{discovery:'discovered'}},interrogationState:{},flags:{}}}
let sm=new StateManager(state());
let r=confrontWithEvidence({personId:'p',confrontationId:'C1',evidenceIds:['A','B','S'],caseData,stateManager:sm});
assert.equal(r.success,true);assert.equal(sm.getState().flags.T1,true);assert.deepEqual(sm.getState().interrogationState.p.successfulConfrontationIds,['C1']);
sm=new StateManager(state());
r=confrontWithEvidence({personId:'p',confrontationId:'C1',evidenceIds:['A'],caseData,stateManager:sm});
assert.equal(r.success,false);assert.equal(sm.getState().flags.T1,undefined);assert.equal(sm.getState().interrogationState.p.transcript.at(-1).response,'generic');
sm=new StateManager(state());
r=confrontWithEvidence({personId:'p',confrontationId:'C1',evidenceIds:['A','B','X'],caseData,stateManager:sm});
assert.equal(r.success,false,'disallowed random extra rejected');
console.log('Multi-evidence confrontation policy ✓ PASSED');
