import assert from 'node:assert/strict';
import { discoverEvidence, examineEvidence, requestEvidenceAnalysis } from '../engine/domains/evidence/EvidenceDomain.js';
class SM { constructor(){this.s={evidenceState:{}}} getState(){return this.s} setState(fn){this.s=fn(this.s)} }
const caseData={evidence:[{id:'e1',analysis:{required:true,type:'digital'}},{id:'e2',analysis:{required:false}}]};
const sm=new SM(); const events=[]; const bus={emit:(n,p)=>events.push([n,p])};
assert.equal(discoverEvidence({evidenceId:'missing',caseData,stateManager:sm,eventBus:bus}),null);
discoverEvidence({evidenceId:'e1',source:{sceneId:'s1'},caseData,stateManager:sm,eventBus:bus});
assert.equal(sm.s.evidenceState.e1.discovery,'discovered'); assert.equal(sm.s.evidenceState.e1.examination,'unexamined');
examineEvidence({evidenceId:'e1',caseData,stateManager:sm,eventBus:bus}); assert.equal(sm.s.evidenceState.e1.examination,'examined'); assert.equal(sm.s.evidenceState.e1.analysis,'needs_analysis');
assert.equal(requestEvidenceAnalysis({evidenceId:'e1',caseData,stateManager:sm,eventBus:bus}),true); assert.equal(sm.s.evidenceState.e1.analysis,'queued');
discoverEvidence({evidenceId:'e2',caseData,stateManager:sm,eventBus:bus}); examineEvidence({evidenceId:'e2',caseData,stateManager:sm,eventBus:bus}); assert.equal(requestEvidenceAnalysis({evidenceId:'e2',caseData,stateManager:sm,eventBus:bus}),false);
assert.ok(events.some(([n])=>n==='evidence:discovered')); assert.ok(events.some(([n])=>n==='evidence:examined')); assert.ok(events.some(([n])=>n==='evidence:analysisRequested'));
console.log('Evidence Domain tests passed ✓');
