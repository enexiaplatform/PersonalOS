import test from 'node:test';
import assert from 'node:assert/strict';
import {filterRecords} from '../apps/personal-os-v1/experience.mjs';
test('search respects Vietnamese case and bounds real records without fake results',()=>{const data=[{text:'Đã chạy bộ',pillar:'health'},{text:'Học tiếng Đức',pillar:'education'}];assert.deepEqual(filterRecords(data,'đức'),[data[1]]);assert.deepEqual(filterRecords(data,'  '),[]);assert.deepEqual(filterRecords(data,'không tồn tại'),[]);});
test('priority presentation splits source clauses without inventing a title',async()=>{const {statementParts}=await import('../apps/personal-os-v1/experience.mjs');assert.deepEqual(statementParts('Tìm tín hiệu thu nhập thực: phản hồi từ thị trường'),{title:'Tìm tín hiệu thu nhập thực',detail:'phản hồi từ thị trường'});assert.deepEqual(statementParts('Một ưu tiên ngắn'),{title:'Một ưu tiên ngắn',detail:''});});
