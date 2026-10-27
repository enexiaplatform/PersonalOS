// One Notion snapshot per page; daily evidence and weekly summaries share this model.
export const STATUSES={plan:'Kế hoạch',doing:'Đang làm',blocked:'Đang vướng',reported_done:'Bạn đã báo làm',verified_done:'Đã xác minh',unknown:'Chưa rõ'};
export function todayVN(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function weekRange(date=todayVN()){
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
 const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);return {start,end:d.toISOString().slice(0,10)};
}
export function canonicalWeeks(weeks){
 const pages=new Map();
 for(const w of weeks){const k=w.owner_id+'|'+w.page_id;const old=pages.get(k);if(!old||String(w.source_edited_at||w.synced_at)>String(old.source_edited_at||old.synced_at))pages.set(k,w);}
 const byPeriod=new Map();for(const w of pages.values()){const k=w.owner_id+'|'+w.week_start;byPeriod.set(k,[...(byPeriod.get(k)||[]),w]);}
 return [...byPeriod.values()].flatMap(group=>group.length===1&&group[0].coverage!=='conflict'?group:[]).sort((a,b)=>b.week_start.localeCompare(a.week_start));
}
export function uniqueItems(weeks){
 const found=new Map();
 for(const w of canonicalWeeks(weeks))for(const raw of Array.isArray(w.items)?w.items:[]){
 if(!raw||typeof raw.text!=='string'||!raw.text.trim()||raw.kind==='summary'||raw.is_summary)continue;
 const i={...raw,page_id:w.page_id,week_start:w.week_start,source_url:raw.source_url||w.source_url};
 // Explicit source identity wins; legacy items dedupe only exact text within a week.
 const id=i.source_id||i.task_id||i.key;
 const k=[w.owner_id,w.week_start,id||[i.pillar,i.text.trim().normalize('NFC').toLowerCase()].join('|'),i.occurred_on||''].join('|');
 const old=found.get(k);if(!old||String(i.updated_at||'')>=String(old.updated_at||''))found.set(k,i);
 }
 return [...found.values()];
}
export function currentSnapshot(weeks,date=todayVN()) {return canonicalWeeks(weeks).find(w=>w.week_start<=date&&w.week_end>=date)||null;}
export function periodItems(weeks,year){return uniqueItems(weeks).filter(i=>i.week_start.startsWith(String(year)));}
export function explicitDate(i){return /^\d{4}-\d{2}-\d{2}$/.test(i.occurred_on||'')?i.occurred_on:null;}
export function dailyEvidence(weeks,date){return uniqueItems(weeks).filter(i=>explicitDate(i)===date&&!['summary','must_win','stop','risk'].includes(i.kind)&&i.scope!=='weekly'&&i.status!=='plan');}
