import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SourceTextModule} from 'node:vm';
const base=new URL('../apps/personal-os-v1/',import.meta.url);
const read=path=>readFileSync(new URL(path,base),'utf8');
const backend=read('api/ai-manager.js'),ui=read('ai-manager.mjs'),style=read('ai-manager.css'),sql=read('sql/ai-manager.sql');
test('AI Manager source files are valid ECMAScript modules',()=>{
 assert.ok(new SourceTextModule(backend));
 assert.ok(new SourceTextModule(ui));
});
test('Manus provider secret remains server-side and external writing disabled',()=>{
 assert.match(backend,/process\.env\.MANUS_API_KEY/);
 assert.match(backend,/clear_connectors:true/);
 assert.match(backend,/structured_output_schema:schema/);
 assert.doesNotMatch(ui,/MANUS_API_KEY|x-manus-api-key|sk-[A-Za-z0-9_-]{12,}/);
 assert.match(backend,/scope==='personal'&&req\.body\?\.includeDetails===true/);
});
test('Autonomous scan and approval workflow are evidence-driven',()=>{
 assert.match(backend,/scanActions\(source\)/);
 assert.match(backend,/status==='blocked'/);
 assert.match(backend,/saveNote\(user,action\)/);
 assert.match(backend,/if\(read\[0\]\?\.id!==saved\)/);
 assert.match(backend,/operation:'review_only'/);
});
test('AI queue is private and has explicit workflow statuses',()=>{
 for(const table of ['personal_os_ai_runs','personal_os_ai_actions','personal_os_ai_events'])assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security'));
 assert.match(sql,/status in \('proposed','approved','executed','dismissed','blocked'\)/);
 assert.match(sql,/owner_id=\(select auth\.uid\(\)\)/);
});
test('Full size UI contains operational controls, not the old tiny advisor popup',()=>{
 assert.match(ui,/Command Center|aom-shell|aom-rail/);
 assert.match(ui,/Action Queue/);
 assert.match(ui,/data-tab="actions"/);
 assert.match(ui,/Quyền & dữ liệu/);
 assert.doesNotMatch(ui,/ai-manager-panel|ai-manager-answer/);
 assert.match(style,/grid-template-columns:minmax\(0,1\.7fr\)/);
 assert.match(style,/@media\(max-width:600px\)/);
});
