import test from 'node:test';
import assert from 'node:assert/strict';
import {createFocusTimer,formatTimer,filterRecords} from '../apps/personal-os-v1/experience.mjs';
test('timer pauses and resumes from elapsed real time, including hidden tabs',()=>{let now=0;const t=createFocusTimer({now:()=>now});t.start();now=65000;assert.equal(t.state().remaining,1435);t.pause();now=120000;assert.equal(t.state().remaining,1435);t.start();now+=10000;assert.equal(t.state().remaining,1425);t.reset();assert.deepEqual(t.state(),{remaining:1500,running:false});});
test('finishing a timer reports once, and a new start creates another session',()=>{let now=0;const t=createFocusTimer({duration:5,now:()=>now});t.start();now=6000;assert.equal(t.tick(),true);assert.equal(t.tick(),false);assert.deepEqual(t.state(),{remaining:0,running:false});t.start();assert.equal(t.state().remaining,5);});
test('timer formatting never displays negative time',()=>{assert.equal(formatTimer(1500),'25:00');assert.equal(formatTimer(-1),'00:00');assert.equal(formatTimer(65),'01:05');});
test('search respects Vietnamese case and bounds real records without fake results',()=>{const data=[{text:'Đã chạy bộ',pillar:'health'},{text:'Học tiếng Đức',pillar:'education'}];assert.deepEqual(filterRecords(data,'đức'),[data[1]]);assert.deepEqual(filterRecords(data,'  '),[]);assert.deepEqual(filterRecords(data,'không tồn tại'),[]);});
