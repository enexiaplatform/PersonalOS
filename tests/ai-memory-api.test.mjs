import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import handler from '../apps/personal-os-v1/api/ai-manager.js';
const owner='5b87bd58-aa3e-4167-bf62-82531597bf8a';
const response=()=>({code:0,data:null,status(c){this.code=c;return this;},setHeader(){return this;},json(d){this.data=d;return this;}});
test('unauthenticated and non-owner requests are rejected before memory access',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({id:randomUUID()});});
 let res=response();await handler({method:'GET',query:{op:'memory'},headers:{}},res);assert.equal(res.code,403);assert.equal(calls,0);
 res=response();await handler({method:'GET',query:{op:'memory'},headers:{authorization:'Bearer stub'}},res);assert.equal(res.code,403);assert.equal(calls,1);
});
test('API create → structured completion → pending memory → subsequent context uses safe history',async t=>{
 const oldKey=process.env.MANUS_API_KEY;process.env.MANUS_API_KEY='stub-test-only';t.after(()=>{if(oldKey===undefined)delete process.env.MANUS_API_KEY;else process.env.MANUS_API_KEY=oldKey;});
 const sourceId=randomUUID();const tables={
  personal_os_ai_memory_sources:[{id:sourceId,owner_id:owner,source_key:'confirmed',scope:'global',kind:'user',title:'Confirmed user context',content_hash:'v1'}],
  personal_os_ai_core_memory:[{id:randomUUID(),owner_id:owner,scope:'global',memory_key:'career.goal',value:'GM 2031',status:'active',sensitivity:'standard',external_allowed:true,source_id:sourceId,version:1},{id:randomUUID(),owner_id:owner,scope:'global',memory_key:'private.data',value:'SECRET_NEVER_SEND',status:'active',sensitivity:'restricted',external_allowed:false,source_id:sourceId}],
  personal_os_ai_week_versions:[],personal_os_ai_year_versions:[],personal_os_notion_weeks:[],personal_os_year_plans:[],personal_os_module_snapshots:[],personal_os_enexia_snapshots:[],personal_os_ai_working_memory:[],personal_os_ai_memory_events:[],personal_os_ai_events:[],personal_os_ai_actions:[],personal_os_ai_runs:[]
 };const messages=[];let providerCalls=0,delayStructure=true;
 t.mock.method(globalThis,'fetch',async(url,init={})=>{
  const u=new URL(url);if(u.pathname==='/auth/v1/user')return Response.json({id:owner});
  if(u.hostname==='api.manus.ai'){
   providerCalls++;if(u.pathname.endsWith('task.create')){const b=JSON.parse(init.body);
    const checkSchema=s=>{for(const key of ['maxItems','minItems','maxLength','minLength','pattern','format'])assert.equal(s[key],undefined,'Unsupported provider schema keyword '+key);if(s.type==='object'){assert.equal(s.additionalProperties,false);assert.deepEqual([...s.required].sort(),Object.keys(s.properties).sort());Object.values(s.properties).forEach(checkSchema);}if(s.items)checkSchema(s.items);};checkSchema(b.structured_output_schema);
    messages.push(b);return Response.json({task_id:randomUUID()});}
   if(u.pathname.endsWith('task.detail'))return Response.json({task:{status:'stopped'}});
   if(delayStructure)return Response.json({messages:[]});
   return Response.json({messages:[{structured_output_result:{success:true,value:{situation:'User seeks GM 2031',priorities:[],risks:[],recommendations:[],unknowns:'No weekly source',memory_candidates:[{key:'learning.practice',value:'Practice Chinese daily'},{key:'INVALID KEY',value:'discard'}]}}}]});
  }
  const name=u.pathname.split('/').pop(),rows=tables[name]||=[];
  const matches=r=>[...u.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(r[k])===v.slice(3));
  if(!init.method||init.method==='GET')return Response.json(rows.filter(matches));
  const body=JSON.parse(init.body);
  if(init.method==='POST'){const keys=u.searchParams.get('on_conflict')?.split(','),old=keys&&rows.find(r=>keys.every(k=>r[k]===body[k]));if(!old)rows.push({...body,id:randomUUID(),version:1,created_at:new Date().toISOString()});else Object.assign(old,body);return Response.json([old||rows.at(-1)]);}
  if(init.method==='PATCH'){const r=rows.find(matches);if(r)Object.assign(r,body);return Response.json(r?[r]:[]);}
  throw Error('Unexpected fetch');
 });
 const request=async(method,op,fields={})=>{const res=response();await handler({method,query:{op,...fields},body:{op,...fields},headers:{authorization:'Bearer stub'}},res);assert.equal(res.code,200,JSON.stringify(res.data));return res.data;};
 const first=await request('POST','create',{question:'Tôi nên ưu tiên gì cho career?',scope:'personal'});assert.equal(first.memory_used.core_ids.length,1);assert.ok(messages[0].message.content.includes('GM 2031'));assert.ok(!JSON.stringify(messages[0]).includes('SECRET_NEVER_SEND'));assert.equal(messages[0].clear_connectors,true);
 const waiting=await request('GET','poll',{run_id:first.run.id});assert.equal(waiting.done,false);assert.equal(waiting.run.status,'running');delayStructure=false;
 await request('GET','poll',{run_id:first.run.id});const pending=tables.personal_os_ai_core_memory.find(m=>m.memory_key==='learning.practice');assert.equal(pending.status,'pending');assert.equal(pending.value,'');assert.equal(pending.external_allowed,false);
 const calls=providerCalls;await request('GET','poll',{run_id:first.run.id});assert.equal(providerCalls,calls);
 const next=await request('POST','create',{question:'Tiếp tục review mục tiêu career',scope:'personal'});assert.equal(next.memory_used.history_ids.length,1);assert.ok(messages[1].message.content.includes('past_ai_analysis_not_fact'));assert.ok(!messages[1].message.content.includes('Practice Chinese daily'));
});
