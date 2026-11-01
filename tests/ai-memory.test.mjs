import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleCore,packContext,projectWeek,projectModule,stableHash,memoryEngine} from '../apps/personal-os-v1/lib/ai-memory.mjs';
const now=Date.parse('2026-11-01T05:00:00Z');
const core={id:'c1',scope:'global',memory_key:'career.goal',value:'GM 2031',status:'active',sensitivity:'standard',external_allowed:true,version:1};
test('retrieval excludes cross-domain, private, expired, pending and conflicted memories',()=>{
 const rows=[core,{...core,id:'wrong',scope:'ventures'},{...core,id:'private',sensitivity:'restricted'},{...core,id:'off',external_allowed:false},{...core,id:'expired',valid_until:'2026-10-01'},{...core,id:'pending',status:'pending'},{...core,id:'conflict',status:'conflict'}];
 const p=packContext({core:rows,scope:'personal',now});assert.deepEqual(p.core.map(r=>r.id),['c1']);assert.ok(p.warnings.some(w=>w.includes('conflicting')));
 assert.equal(eligibleCore({...core,scope:'servicebio'},'servicebio',now),false);
});
test('source projection never upgrades reported activities to verified outcomes',()=>{
 const w=projectWeek({items:[{kind:'activity',status:'reported_done',pillar:'career',text:'Sent price quote 90000',key:'a'},{kind:'activity',status:'plan',pillar:'education',text:'HSK4 practice',key:'b'},{kind:'activity',status:'Done',pillar:'health',text:'Run',key:'c'}]});
 assert.equal(w.counts.reported_done,1);assert.equal(w.personal_items.length,2);assert.equal(w.personal_items[1].status,'unknown');assert.ok(!JSON.stringify(w.personal_items).includes('90000'));
});
test('sensitive commercial data never appears in provider context, even with detail opt-in',()=>{
 const secret='CUSTOMER_SECRET_PRICE_19999';const w=projectWeek({week_start:'2026-10-26',week_end:'2026-11-01',items:[{kind:'must_win',pillar:'career',text:secret,status:'plan'},{kind:'activity',pillar:'education',text:'Learn',status:'doing'}]});
 const working=[{id:'w',scope:'personal',summary:w,expires_at:'2026-11-01T17:00:00Z'}];
 for(const includeDetails of [true,false]){const p=packContext({core:[{...core,value:secret,external_allowed:false}],working,scope:'personal',now,includeDetails});assert.ok(!JSON.stringify(p).includes(secret));assert.equal(p.working[0].items?.length,includeDetails?1:undefined);}
 const servicebio=projectModule('servicebio',{payload:{data:{pipeline:{secret},summary:secret}}});assert.ok(!JSON.stringify(servicebio).includes(secret));
});
test('stale working data is flagged and details are withheld',()=>{
 const p=packContext({working:[{scope:'personal',id:'w',expires_at:'2026-10-01',summary:{type:'notion_snapshot',personal_items:[{text:'stale detail'}]}}],scope:'personal',includeDetails:true,now});assert.equal(p.working[0].stale,true);assert.equal(p.working[0].items,undefined);assert.ok(p.warnings.some(w=>w.includes('stale')));
});
test('previous analyses are limited to safely-created runs in the active domain and labeled as opinions',()=>{
 const run={id:'r',scope:'personal',status:'stopped',context_manifest:{external_safe:true},summary:{situation:'An opinion'}};
 const p=packContext({history:[run,{...run,id:'private',scope:'servicebio'},{...run,id:'legacy',context_manifest:{}}],scope:'personal',now});assert.equal(p.past_analysis.length,1);assert.equal(p.past_analysis[0].type,'past_ai_analysis_not_fact');
});
test('bounded context remains valid JSON, and deterministic hashes ignore object key order',()=>{
 const p=packContext({core:Array.from({length:30},(_,i)=>({...core,id:String(i),value:'x'.repeat(1800)})),now,maxChars:3000});assert.ok(JSON.stringify(p).length<=3000);assert.equal(stableHash({a:1,b:2}),stableHash({b:2,a:1}));
});
test('recording a saved review is never represented as approval of the plan',()=>{
 const p=packContext({decisions:[{event_type:'executed'},{event_type:'dismissed'}],now});assert.match(p.decisions[0].meaning,/not approval/);assert.match(p.decisions[1].meaning,/not a permanent preference/);
});
function mockDB(){
 const tables={personal_os_ai_memory_sources:[],personal_os_ai_working_memory:[],personal_os_ai_core_memory:[],personal_os_ai_memory_events:[],personal_os_ai_events:[],personal_os_notion_weeks:[{owner_id:'owner',page_id:'week',title:'Weekly',source_url:'https://notion.so/week',week_start:'2026-10-26',week_end:'2026-11-01',coverage:'complete',source_edited_at:'2026-10-30T05:00:00Z',synced_at:'2026-10-30T05:00:00Z',items:[{kind:'activity',status:'plan',pillar:'education',text:'Learn'}]}],personal_os_year_plans:[],personal_os_module_snapshots:[],personal_os_enexia_snapshots:[]};let writes=0,fullReads=0;
 async function db(u,t,{method='GET',query={},body}={}){
  if(t==='personal_os_ai_week_versions')t='personal_os_notion_weeks';if(t==='personal_os_ai_year_versions')t='personal_os_year_plans';
  const list=tables[t]||[];const match=r=>Object.entries(query).every(([k,v])=>!v?.startsWith?.('eq.')||String(r[k])===v.slice(3));
  if(method==='GET'){if(t==='personal_os_notion_weeks'&&query.select==='*')fullReads++;return structuredClone(list.filter(match));}
  writes++;
  if(method==='POST'){const keys=query.on_conflict?.split(','),old=keys&&list.find(r=>keys.every(k=>r[k]===body[k]));if(old)Object.assign(old,structuredClone(body));else list.push({...structuredClone(body),id:'id'+writes,version:1});return [structuredClone(old||list.at(-1))];}
  if(method==='PATCH'){const old=list.find(match);if(!old)return [];Object.assign(old,body,{version:old.version+1});return [structuredClone(old)];}
 }
 return {tables,db,get writes(){return writes;},get fullReads(){return fullReads;}};
}
test('refresh is incremental: unchanged sources avoid re-reading payload and all memory writes',async()=>{
 const m=mockDB(),e=memoryEngine(m.db,{id:'owner'});assert.equal((await e.refresh()).updated,1);const count=m.writes,reads=m.fullReads;assert.equal((await e.refresh()).updated,0);assert.equal(m.writes,count);assert.equal(m.fullReads,reads);
 m.tables.personal_os_notion_weeks[0].source_edited_at='2026-11-01T04:00:00Z';assert.equal((await e.refresh()).updated,1);assert.equal(m.fullReads,reads+1);
});
test('model proposals stay pending, duplicate extraction is idempotent, conflicts preserve confirmed values',async()=>{
 const m=mockDB(),e=memoryEngine(m.db,{id:'owner'});const a=await e.propose({scope:'personal',memory_key:'goal.test',value:'New goal',source_id:'s'});assert.equal(a.status,'pending');assert.equal(a.external_allowed,false);assert.equal(a.value,'');
 const writes=m.writes;await e.propose({scope:'personal',memory_key:'goal.test',value:'New goal',source_id:'s'});assert.equal(m.writes,writes);
 const row=m.tables.personal_os_ai_core_memory[0];Object.assign(row,{status:'active',value:'Old goal',proposed_value:null});const c=await e.propose({scope:'personal',memory_key:'goal.test',value:'Different goal',source_id:'s'});assert.equal(c.status,'conflict');assert.equal(c.value,'Old goal');
 await assert.rejects(e.propose({scope:'personal',memory_key:'goal.test',value:'Another candidate',source_id:'s'}),/chờ xử lý/);
});
