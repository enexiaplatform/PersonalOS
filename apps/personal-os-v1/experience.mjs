export const ICON_PATHS={calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',bag:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18m-10 0v3h2v-3"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',review:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6m-6 5h6m-6 5h4"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 2-1 4 3 1 2 4 3-1 3 1 2-4 3-1-1-4 2-2-2-3-3-1-1-3-3 1Z"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',chevron:'<path d="m9 5 7 7-7 7"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',play:'<path d="m8 4 12 8-12 8Z"/>',pause:'<path d="M8 4v16M16 4v16"/>',note:'<path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9l7-7V5a2 2 0 0 0-2-2Z"/><path d="M14 21v-7h7M7 8h10M7 12h4"/>',logout:'<path d="M9 4H5v16h4m6-12 4 4-4 4M9 12h10"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5M5.5 7a8 8 0 0 1 13-2L20 7M4 17l1.5 2a8 8 0 0 0 13-2"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'};
export function icon(name,cls=''){return '<svg class="icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON_PATHS[name]||ICON_PATHS.note)+'</svg>';}
export function formatTimer(seconds){const n=Math.max(0,Math.ceil(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
export function createFocusTimer({duration=1500,now=()=>Date.now()}={}){
 let remaining=duration,endsAt=null;
 const state=()=>({remaining:endsAt===null?remaining:Math.max(0,Math.ceil((endsAt-now())/1000)),running:endsAt!==null});
 return {state,start(){if(endsAt!==null)return;if(remaining<=0)remaining=duration;endsAt=now()+remaining*1000;},pause(){remaining=state().remaining;endsAt=null;},reset(){remaining=duration;endsAt=null;},tick(){if(endsAt!==null&&state().remaining<=0){remaining=0;endsAt=null;return true;}return false;}};
}
export function filterRecords(records,query){const needle=query.trim().normalize('NFC').toLocaleLowerCase('vi');if(!needle)return [];return records.filter(i=>[i.text,i.context,i.pillar].join(' ').normalize('NFC').toLocaleLowerCase('vi').includes(needle)).slice(0,12);}

export function statementParts(text){
 const value=String(text||'').trim();
 const comma=value.indexOf(','),period=value.indexOf('. '),colon=value.indexOf(':');
 const at=comma>30&&comma<95?comma:period>30?period:colon>20?colon:-1;
 if(at<0)return {title:value,detail:''};
 return {title:value.slice(0,at).trim(),detail:value.slice(at+1).trim()};
}
