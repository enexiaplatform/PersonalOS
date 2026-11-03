import test from 'node:test';
import assert from 'node:assert/strict';
import {filterRecords,canAutoRefresh} from '../apps/personal-os-v1/experience.mjs';
test('search respects Vietnamese case and bounds real records without fake results',()=>{const data=[{text:'Đã chạy bộ',pillar:'health'},{text:'Học tiếng Đức',pillar:'education'}];assert.deepEqual(filterRecords(data,'đức'),[data[1]]);assert.deepEqual(filterRecords(data,'  '),[]);assert.deepEqual(filterRecords(data,'không tồn tại'),[]);});
test('priority presentation splits source clauses without inventing a title',async()=>{const {statementParts}=await import('../apps/personal-os-v1/experience.mjs');assert.deepEqual(statementParts('Tìm tín hiệu thu nhập thực: phản hồi từ thị trường'),{title:'Tìm tín hiệu thu nhập thực',detail:'phản hồi từ thị trường'});assert.deepEqual(statementParts('Một ưu tiên ngắn'),{title:'Một ưu tiên ngắn',detail:''});});

test('Vietnamese search accepts accents, combining marks and unaccented input',()=>{
 const records=[{text:'Đánh giá tiến bộ và học tiếng Trung',context:'Sự nghiệp'}];
 for(const query of ['danh gia','tien bo','SU NGHIEP','tiến bộ'])assert.equal(filterRecords(records,query).length,1);
});

test('background refresh preserves writing, dialogs and inactive sessions',()=>{
 const passive={hasUser:true,workspace:'personal',view:'overview',hidden:false,loading:false,editing:false,modalOpen:false};
 assert.equal(canAutoRefresh(passive),true);
 for(const view of ['weekly','monthly','evidence','decision','settings','review'])assert.equal(canAutoRefresh({...passive,view}),false);
 for(const interrupted of [{editing:true},{modalOpen:true},{hidden:true},{loading:true},{hasUser:false},{workspace:'enexia'}])assert.equal(canAutoRefresh({...passive,...interrupted}),false);
});
