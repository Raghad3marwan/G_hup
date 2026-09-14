import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { StateManager } from '../engine/core/state/StateManager.js';
import { createInitialGameState } from '../engine/core/state/createInitialGameState.js';
import { synchronizeCaseProgress } from '../engine/core/progression/ProgressionEngine.js';
import { examineEvidence, requestEvidenceAnalysis, readEvidenceResult } from '../engine/domains/evidence/EvidenceDomain.js';
import { startLabJob, completeLabJob } from '../engine/domains/lab/LabDomain.js';
import { isDeductionUnlocked, submitDeduction } from '../engine/domains/DeductionDomain.js';
import { askQuestion, getAvailableConfrontations, confrontWithEvidence } from '../engine/domains/interrogation/InterrogationDomain.js';

const code=fs.readFileSync(new URL('../cases/case-natural-death/case.data.js',import.meta.url),'utf8');
const sandbox={window:{}}; vm.runInNewContext(code,sandbox); const caseData=sandbox.window.CASE_DATA;
assert.equal(caseData.meta.title,'الموت الذي بدا طبيعيًا');
assert.equal(caseData.evidenceFamilies.length,11,'must expose exactly 11 evidence families');
assert.equal(caseData.evidence.length,11,'must not turn A01/A02 into standalone evidence cards');
assert.equal(caseData.crimeScenes[0].hotspots.some(h=>/كاميرا.*باب|باب.*كاميرا/.test(h.description||'')),true,'scene must explicitly preserve no-camera-at-door constraint');

const initial=createInitialGameState({caseId:caseData.meta.id,schemaVersion:1,manifest:{defaultSection:'caseFile'}});
const sm=new StateManager(initial);
const bus={emit(){}};
const sync=()=>synchronizeCaseProgress({caseData,stateManager:sm,now:1000});
const exam=(id)=>{assert.ok(examineEvidence({evidenceId:id,caseData,stateManager:sm,eventBus:bus}),`examine ${id}`);sync();};
const lab=(id)=>{assert.equal(requestEvidenceAnalysis({evidenceId:id,caseData,stateManager:sm,eventBus:bus}),true,`queue ${id}`);const t=10000;assert.equal(startLabJob({evidenceId:id,caseData,stateManager:sm,eventBus:bus,now:t}),true,`start ${id}`);assert.equal(completeLabJob({evidenceId:id,caseData,stateManager:sm,eventBus:bus,now:t+100000}),true,`complete ${id}`);assert.equal(readEvidenceResult({evidenceId:id,caseData,stateManager:sm,eventBus:bus,now:t+100001}),true,`read result ${id}`);sync();};

sync(); assert.equal(sm.getState().evidenceState.E01.discovery,'discovered');
exam('E01'); assert.equal(sm.getState().evidenceState.E02.discovery,'discovered'); assert.equal(sm.getState().evidenceState.E05.discovery,'discovered');
exam('E02'); assert.equal(sm.getState().evidenceState.E04.discovery,'discovered'); lab('E02'); assert.equal(sm.getState().evidenceState.E03.discovery,'discovered');
exam('E03'); assert.equal(sm.getState().flags.M01,true); assert.equal(sm.getState().flags.M02,true);
exam('E04'); assert.equal(sm.getState().flags.M03,true);
exam('E05'); assert.equal(sm.getState().flags.M04,true); assert.equal(sm.getState().evidenceState.E06.discovery,'discovered'); assert.equal(sm.getState().evidenceState.E07.discovery,'discovered'); assert.equal(sm.getState().evidenceState.E09.discovery,'discovered');
exam('E06'); assert.equal(sm.getState().flags.M05,true);
exam('E07'); assert.equal(sm.getState().flags.M06,true);
exam('E09'); assert.equal(sm.getState().flags.M08,true); lab('E09'); assert.equal(sm.getState().evidenceState.E10.discovery,'discovered');
exam('E10'); assert.equal(sm.getState().flags.M09,true); assert.equal(isDeductionUnlocked(caseData.deduction,sm.getState()),true,'G01 must unlock from CORE without interrogations');
assert.equal(sm.getState().flags.M07,undefined,'E08/motive must remain optional');
assert.equal(sm.getState().flags.M10,undefined,'E11/Adam must remain optional');

const answers={
 F01:{answer:'not_natural_alone',proof:['E03','E09']},
 F02:{person:'elias',proof:['E05','E06','E09','E10']},
 F03:{answer:'mira_coverup',proof:['E04','E03']}
};
const solved=submitDeduction({config:caseData.deduction,stateManager:sm,answers});
assert.deepEqual(solved,{ok:true,correct:true},'full source-grounded deduction must solve');

// Supporting interrogation paths remain available and do not create CORE facts.
const sm2=new StateManager(structuredClone(sm.getState()));
sm2.setState(s=>({...s,deductionState:{answers:{},attempts:0,completed:false}}));
assert.equal(askQuestion({personId:'elias',questionId:'Q-E01',caseData,stateManager:sm2,eventBus:bus,now:1}),true);
const avail=getAvailableConfrontations({personId:'elias',caseData,state:sm2.getState()});
assert.ok(avail.some(c=>c.id==='C02'),'C02 should open after Q-E01 + E06');
assert.equal(confrontWithEvidence({personId:'elias',evidenceId:'E06',confrontationId:'C02',caseData,stateManager:sm2,eventBus:bus,now:2}).success,true);

// Lina and Adam side paths reveal E08/E11 without affecting G01 dependency.
assert.equal(askQuestion({personId:'lina',questionId:'Q-L01',caseData,stateManager:sm2,eventBus:bus,now:3}),true); synchronizeCaseProgress({caseData,stateManager:sm2,now:4});
assert.equal(sm2.getState().evidenceState.E08.discovery,'discovered');
assert.equal(askQuestion({personId:'adam',questionId:'Q-A01',caseData,stateManager:sm2,eventBus:bus,now:5}),true); synchronizeCaseProgress({caseData,stateManager:sm2,now:6});
assert.equal(sm2.getState().evidenceState.E11.discovery,'discovered');

// Submission is specifically blocked without M03 while G01 itself can still open.
const s3=structuredClone(sm.getState()); delete s3.flags.M03; s3.deductionState={answers:{},attempts:0,completed:false}; const sm3=new StateManager(s3);
assert.equal(isDeductionUnlocked(caseData.deduction,sm3.getState()),true,'G01 must still be open without M03');
assert.deepEqual(submitDeduction({config:caseData.deduction,stateManager:sm3,answers}),{ok:false,reason:'submit_locked'});

console.log('Natural Death full case route ✓ PASSED');
