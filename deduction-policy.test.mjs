import assert from 'node:assert/strict';
import { validateMultipleAnswer, isQuestionCorrect } from '../engine/domains/DeductionDomain.js';

assert.equal(validateMultipleAnswer(['D1','D2'],['D2','D1']),true,'default exact unordered should remain backward compatible');
assert.equal(validateMultipleAnswer(['D1','D2','D3'],['D1','D2']),false,'default exact must reject extras');
const policy={requiredAll:['D1','D2'],anyOf:[['D3','D4']],allowedSupporting:['D5'],rejectDisallowed:true};
assert.equal(validateMultipleAnswer(['D1','D2','D3'],[],policy),true,'required + OR option accepted');
assert.equal(validateMultipleAnswer(['D1','D2','D4','D5'],[],policy),true,'allowed supporting accepted');
assert.equal(validateMultipleAnswer(['D1','D2','D3','RANDOM'],[],policy),false,'random extra rejected');
assert.equal(validateMultipleAnswer(['D1','D2'],[],policy),false,'missing OR group rejected');
const compound={type:'compound',fields:[{id:'who',type:'single_choice'},{id:'proof',type:'evidence_multiple',validation:policy}],correctAnswer:{who:'A',proof:[]}};
assert.equal(isQuestionCorrect(compound,{who:'A',proof:['D1','D2','D3','D5']}),true);
assert.equal(isQuestionCorrect(compound,{who:'A',proof:['D1','D2','D3','X']}),false);
console.log('Deduction validation policy ✓ PASSED');
