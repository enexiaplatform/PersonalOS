import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalWeeks, uniqueItems, dailyEvidence} from '../apps/personal-os-v1/model.mjs';
import {fallbackTasks, calendarLanes} from '../apps/personal-os-v1/calendar.mjs';
import {parseWorkspaceHash} from '../apps/personal-os-v1/workspaces.mjs';

const W='2026-11-16', E='2026-11-22';
const page=(id, items=[], extra={})=>({
  owner_id:'synthetic-owner',page_id:id,week_start:W,week_end:E,
  synced_at:'2026-11-19T02:00:00Z',coverage:'complete',
  source_url:'https://app.notion.com/p/synthetic',items,...extra
});

test('P0.1: revisions of one page win; distinct active pages for one week remain unresolved',()=>{
  const old=page('planner-a',[{key:'stable',kind:'activity',text:'Old',status:'plan'}],{synced_at:'2026-11-18T02:00:00Z'});
  const fresh=page('planner-a',[{key:'stable',kind:'activity',text:'New',status:'reported_done'}]);
  assert.deepEqual(canonicalWeeks([old,fresh]).map(w=>w.page_id),['planner-a']);
  assert.equal(uniqueItems([old,fresh])[0].text,'New');
  assert.equal(canonicalWeeks([fresh,page('planner-b')]).length,0);
  assert.equal(canonicalWeeks([page('planner-c',[],{coverage:'conflict'})]).length,0);
});

test('P0.1: same work identity on different days remains two observations',()=>{
  const w=page('canonical',[
    {key:'repeat',kind:'activity',text:'Learning',status:'reported_done',occurred_on:'2026-11-17'},
    {key:'repeat',kind:'activity',text:'Learning',status:'reported_done',occurred_on:'2026-11-18'}
  ]);
  assert.equal(uniqueItems([w]).length,2);
  assert.equal(dailyEvidence([w],'2026-11-17').length,1);
  assert.equal(dailyEvidence([w],'2026-11-18').length,1);
});

test('P0.1: plans, undated notes, and weekly context never become daily evidence',()=>{
  const w=page('canonical',[
    {key:'m',kind:'must_win',scope:'weekly',status:'plan',text:'Priority',occurred_on:'2026-11-19'},
    {key:'p',kind:'activity',status:'plan',text:'Scheduled',occurred_on:'2026-11-19'},
    {key:'u',kind:'activity',status:'reported_done',text:'Undated'},
    {key:'r',kind:'activity',status:'reported_done',text:'Called',occurred_on:'2026-11-19'},
    {key:'s',kind:'summary',status:'reported_done',text:'Week summary',occurred_on:'2026-11-19'}
  ]);
  assert.deepEqual(dailyEvidence([w],'2026-11-19').map(x=>x.key),['r']);
});

test('P0.1: divergent Calendar and Notion cache statuses stay independent',()=>{
  const notion=page('canonical',[
    {key:'same-activity',kind:'activity',text:'Sent a quote',status:'reported_done',occurred_on:'2026-11-19'}
  ]);
  const calendarCache=[{id:'same-activity',title:'Sent a quote',status:'plan',date:'2026-11-19',group:'Medtec / Biomedia'}];
  assert.equal(uniqueItems([notion])[0].status,'reported_done');
  assert.equal(calendarCache[0].status,'plan');
  assert.notEqual(uniqueItems([notion])[0].status,calendarCache[0].status);
});

test('P0.1: legacy fallback stays readonly, preserves no-date and excludes summaries',()=>{
  const tasks=fallbackTasks(page('canonical',[
    {key:'undated',kind:'activity',text:'Discuss next step',status:'plan'},
    {key:'dated',kind:'activity',text:'Follow up',status:'reported_done',occurred_on:'2026-11-20'},
    {key:'summary',kind:'summary',text:'Week recap',status:'reported_done'}
  ]));
  assert.equal(tasks.length,2);
  assert.equal(tasks[0].date,null);
  assert.equal(tasks[0].readonly,true);
  assert.equal(tasks[1].date,'2026-11-20');
  assert.equal(tasks[1].status,'reported_done');
  assert.equal(calendarLanes(tasks).flatMap(l=>l.tasks).length,2);
});

test('P0.1: legacy personal and independent workspace hashes remain accessible',()=>{
  for(const v of ['calendar','overview','gantt','progress','life','business','blueprint','review','notion','weekly','monthly','evidence','decision','settings']){
    assert.deepEqual(parseWorkspaceHash('#personal/'+v),{module:'personal',view:v});
  }
  for(const v of ['servicebio','ventures','enexia']){
    assert.equal(parseWorkspaceHash('#'+v).module,v);
  }
  assert.equal(parseWorkspaceHash('#unknown').module,'home');
});
