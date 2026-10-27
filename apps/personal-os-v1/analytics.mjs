import {canonicalWeeks,uniqueItems,explicitDate} from './model.mjs';
export const STATUS_ORDER=['reported_done','verified_done','doing','blocked','plan','unknown'];
export const STATUS_META={reported_done:{label:'Tự báo đã làm',short:'Tự báo',color:'#27b7ad'},verified_done:{label:'Đã xác minh',short:'Xác minh',color:'#176e7a'},doing:{label:'Đang làm',short:'Đang làm',color:'#6399df'},blocked:{label:'Đang vướng',short:'Vướng',color:'#f39851'},plan:{label:'Kế hoạch',short:'Kế hoạch',color:'#a18ae8'},unknown:{label:'Chưa rõ',short:'Chưa rõ',color:'#a6acbb'}};
const CONTEXT=new Set(['must_win','risk','stop','summary','reflection']);
export function executionRecords(weeks){return uniqueItems(weeks).filter(i=>!CONTEXT.has(i.kind)&&i.scope!=='summary'&&!i.is_summary);}
export function countsByStatus(records){const counts=Object.fromEntries(STATUS_ORDER.map(k=>[k,0]));for(const i of records)counts[Object.hasOwn(counts,i.status)?i.status:'unknown']++;return counts;}
export function normalizeAxis(id,year){return year===2026&&id==='entrepreneurship'?'business':year===2027&&id==='business'?'entrepreneurship':id;}
export function shiftDate(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function monthMetricRecords(metrics,month){return metrics.filter(m=>String(m.month_start||'').slice(0,7)===month);}
export function buildWeekAnalytics({week,weeks=[],axes=[],metrics=[],year=2026}){
 const records=week?executionRecords([week]):[];
 const allAxes=axes.map(a=>({id:a[0]||a.id,name:a[1]||a.name}));
 const known=new Set(allAxes.map(a=>a.id));
 if(records.some(i=>!known.has(normalizeAxis(i.pillar,year))))allAxes.push({id:'unassigned',name:'Chưa phân trục'});
 const metricMonth=String(week?.week_start||year+'-01-01').slice(0,7),monthMetrics=monthMetricRecords(metrics,metricMonth);
 const axisRows=allAxes.map(axis=>{const rows=records.filter(i=>axis.id==='unassigned'?!known.has(normalizeAxis(i.pillar,year)):normalizeAxis(i.pillar,year)===axis.id);const counts=countsByStatus(rows);return {...axis,records:rows,counts,total:rows.length,hasEvidence:counts.reported_done+counts.verified_done>0,metricCount:monthMetrics.filter(m=>normalizeAxis(m.pillar,year)===axis.id).length};});
 const days=week?Array.from({length:7},(_,n)=>{const date=shiftDate(week.week_start,n),rows=records.filter(i=>explicitDate(i)===date);return {date,records:rows,counts:countsByStatus(rows),total:rows.length,observed:rows.length>0};}):[];
 const history=week?Array.from({length:8},(_,n)=>{const start=shiftDate(week.week_start,-7*(7-n));const raw=weeks.filter(w=>w.week_start===start);const selected=canonicalWeeks(raw);const state=!raw.length?'missing':!selected.length?'conflict':selected[0].coverage==='complete'?'complete':'partial';return {start,state,pages:raw.length,records:state==='missing'||state==='conflict'?null:executionRecords(selected).length};}):[];
 const sourceItems=week?uniqueItems([week]):[];
 const priorities=sourceItems.filter(i=>i.kind==='must_win'||i.must_win===true).slice(0,3),risks=sourceItems.filter(i=>i.kind==='risk'),stops=sourceItems.filter(i=>i.kind==='stop');
 const evidenceAxes=axisRows.filter(a=>a.hasEvidence).length;
 return {records,counts:countsByStatus(records),total:records.length,axisRows,axisMax:Math.max(1,...axisRows.map(a=>a.total)),days,dayMax:Math.max(1,...days.map(a=>a.total)),undated:records.filter(i=>!explicitDate(i)).length,history,priorities,risks,stops,evidenceAxes,axisCount:axisRows.length,missingEvidenceAxes:axisRows.filter(a=>!a.hasEvidence),metricMonth,monthMetrics,unreportedPriorities:priorities.filter(i=>!['reported_done','verified_done'].includes(i.status))};
}
export function filterAnalysisRecords(model,{axis,status,date}={},year=2026){return model.records.filter(i=>(!axis||axis==='all'||(axis==='unassigned'?model.axisRows.find(a=>a.id==='unassigned')?.records.includes(i):normalizeAxis(i.pillar,year)===axis))&&(!status||status==='all'||(STATUS_ORDER.includes(i.status)?i.status:'unknown')===status)&&(!date||explicitDate(i)===date));}
export function percentOf(value,total){return total>0?100*value/total:0;}
