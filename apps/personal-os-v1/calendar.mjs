import {icon,searchText} from './experience.mjs';
export const GROUPS=['Servicebio','Medtec / Biomedia','Ventures','Enexia','Language','Health','Finance','Learning','Personal','Other'];
const groupTones=['servicebio','fulltime','ventures','enexia','language','positive','attention','info','language','neutral'];
const groupColor=group=>'var(--sys-series-'+(groupTones[GROUPS.indexOf(group)]||'neutral')+')';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const add=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);const fmt=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'Chưa phân ngày';
export function monday(now=new Date()){const d=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'}));return add(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),-(d.getDay()+6)%7)}
export function groupOf(i){if(GROUPS.includes(i.group))return i.group;const s=(i.context+' '+i.text).toLowerCase();if(/servicebio|slide.scanner/.test(s))return 'Servicebio';if(/biomedia|medtec|terumo|samil|cuu long|cửu long|rohto|pymepharco|qiagen/.test(s))return 'Medtec / Biomedia';if(/hsk|tiếng trung|tiếng đức|tiếng hàn|chinese|german|korean/.test(s))return 'Language';if(/memoire|helm|forge|sentinel|enexia/.test(s))return 'Enexia';return ({business:'Ventures',entrepreneurship:'Ventures',finance:'Finance',health:'Health',education:'Learning',learning:'Learning',growth:'Personal',relationships:'Personal'})[i.pillar]||'Other'}
export function fallbackTasks(w){const seen=new Set();return (w?.items||[]).filter(i=>['activity','outcome','task'].includes(i.kind)&&!seen.has(i.source_id||i.key)&&seen.add(i.source_id||i.key)).map(i=>({id:i.source_id||i.key,title:i.text,group:groupOf(i),status:i.status||'unknown',date:[i.planned_on,i.scheduled_on,i.occurred_on].find(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&d>=w.week_start&&d<=w.week_end)||null,url:i.source_url||w.source_url,readonly:true}));}
export function visibleTasks(tasks,group='all',query=''){return tasks.filter(t=>(group==='all'||t.group===group)&&searchText(t.title).includes(searchText(query)));}
export const LANES=[
{id:'fulltime',label:'Full-time · Medtec',groups:['Medtec / Biomedia'],color:'var(--sys-series-fulltime)'},
{id:'servicebio',label:'Servicebio',groups:['Servicebio'],color:'var(--sys-series-servicebio)'},
{id:'ventures',label:'Ventures',groups:['Ventures'],color:'var(--sys-series-ventures)'},
{id:'enexia',label:'Enexia',groups:['Enexia'],color:'var(--sys-series-enexia)'},
{id:'personal',label:'Personal / Language',groups:['Language','Health','Finance','Learning','Personal'],color:'var(--sys-series-language)'},
{id:'other',label:'Chưa phân nhóm',groups:['Other'],color:'var(--sys-series-neutral)'}];
export function calendarLanes(tasks){return LANES.map(lane=>({...lane,tasks:tasks.filter(t=>lane.id==='other'?!LANES.slice(0,-1).some(l=>l.groups.includes(t.group)):lane.groups.includes(t.group))}));}
export function createCalendar({db,getUser,getWeeks,container}){let selected=monday(),group='all',query='',rows=[],requests=[],generation=0,loadError='',loading=false,display='agenda',day='all',active=false;
const sourceLink=u=>/^https:\/\/(app\.notion\.com|www\.notion\.so)\//.test(u||'')?esc(u):'#';
function tasks(){const exact=rows.find(r=>r.week_start===selected);if(exact)return exact.tasks;const w=getWeeks().find(w=>w.week_start===selected&&w.coverage!=='conflict');return fallbackTasks(w)}
function request(t){return requests.find(r=>r.week_start===selected&&r.task_id===t.id)}
const statusLabels={plan:'Kế hoạch',doing:'Đang làm',blocked:'Đang vướng',reported_done:'Tự báo đã làm',verified_done:'Đã xác minh',unknown:'Chưa rõ'};
const requestLabels={pending:'Chờ ghi Notion',applied:'Đã đồng bộ',conflict:'Xung đột nguồn',failed:'Đồng bộ lỗi'};
const weekdays=['T2','T3','T4','T5','T6','T7','CN'];
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());

function card(t){
 const pending=request(t);
 const status=Object.hasOwn(statusLabels,t.status)?t.status:'unknown';
 return `<button type="button" class="ctask" data-cal-task="${esc(t.id)}" style="--task-color:${groupColor(t.group)}">
   <strong>${esc(t.title)}</strong>
   <span class="status status-${status}">${statusLabels[status]}</span>
   ${pending?`<em>${esc(requestLabels[pending.status]||pending.status)}</em>`:''}
 </button>`;
}

function agenda(list,lanes,dates,currentDate){
 const choices=[
  {id:'all',label:'Cả tuần',count:list.length},
  ...dates.map((date,n)=>({id:String(n),label:weekdays[n],date,count:list.filter(t=>t.date===date).length})),
  {id:'undated',label:'Chưa phân ngày',count:list.filter(t=>!t.date).length}
 ];
 const rows=lanes.map(lane=>({...lane,tasks:lane.tasks.filter(t=>day==='all'||(day==='undated'?!t.date:t.date===dates[Number(day)]))})).filter(lane=>lane.tasks.length);
 return `<div class="cal-day-rail" role="group" aria-label="Chọn ngày">
   ${choices.map(({id,label,date,count})=>`<button type="button" data-cal-focus="${id}" aria-pressed="${day===id}" ${date===currentDate?'aria-current="date"':''}>
     <span>${label}${date?' · '+fmt(date):''}</span><b>${count}</b>
   </button>`).join('')}
 </div>
 <div class="cal-agenda" role="region" aria-label="Danh sách công việc theo nhóm">
   ${rows.length?rows.map(lane=>`<section class="agenda-lane" style="--lane-color:${lane.color}">
    <header><i></i><h2>${esc(lane.label)}</h2><span>${lane.tasks.length} việc</span></header>
    <div class="agenda-tasks">${lane.tasks.map(t=>`<div class="agenda-item"><span class="agenda-date">${fmt(t.date)}</span>${card(t)}</div>`).join('')}</div>
   </section>`).join(''):`<div class="cal-empty-state">${icon('calendar')}<strong>${loading?'Đang tải công việc…':query.trim()||group!=='all'?'Không tìm thấy công việc phù hợp':day==='all'?'Chưa có công việc trong tuần này':'Chưa có công việc trong ngày đã chọn'}</strong>
     ${loading?'':query.trim()||group!=='all'?'<button type="button" class="ui-button ui-button--tertiary" data-cal-clear>Xóa bộ lọc</button>':day!=='all'?'<button type="button" class="ui-button ui-button--tertiary" data-cal-focus="all">Xem cả tuần</button>':''}
   </div>`}
 </div>`;
}

function board(lanes,dates,currentDate){
 return `<div class="cal-scroll" role="region" aria-label="Lịch tuần theo nhóm công việc" tabindex="0"><div class="cal-board">
  <div class="cal-grid cal-board-head"><div class="cal-corner">Nhóm công việc</div>
    ${dates.map((date,n)=>`<div class="cal-date" ${date===currentDate?'aria-current="date"':''}><b>${weekdays[n]}</b><span>${fmt(date)}</span></div>`).join('')}
    <div class="cal-date"><b>Chưa phân ngày</b><span>Trong tuần</span></div>
  </div>
  ${lanes.filter(lane=>lane.id!=='other'||lane.tasks.length).filter(lane=>group==='all'||lane.groups.includes(group)||lane.tasks.length).map(lane=>`
    <section class="cal-grid cal-lane" data-cal-lane="${lane.id}" style="--lane-color:${lane.color}" aria-label="${esc(lane.label)}">
      <header class="cal-lane-label"><b>${esc(lane.label)}</b><span>${lane.tasks.length} việc</span></header>
      ${[...dates,null].map((date,n)=>{
       const tasks=lane.tasks.filter(t=>date?t.date===date:!t.date);
       const label=esc(lane.label)+' · '+fmt(date);
       return `<div class="cal-cell" aria-label="${label}">${tasks.slice(0,2).map(card).join('')}${tasks.length>2
        ?`<button type="button" class="cal-more" data-cal-more="${lane.id}" data-cal-day="${n}" aria-label="Xem thêm ${tasks.length-2} việc · ${label}">+ ${tasks.length-2} việc khác</button>`
        :tasks.length?'':'<span class="cal-empty" aria-label="Không có công việc">—</span>'}</div>`;
      }).join('')}
    </section>`).join('')}
 </div></div>
 ${lanes.some(lane=>lane.tasks.length)?`<section class="cal-groups"><h2>Công việc theo nhóm</h2>
   ${lanes.filter(lane=>lane.tasks.length).map(lane=>`<details>
      <summary><i style="background:${lane.color}"></i>${esc(lane.label)}<small>${lane.tasks.length} việc</small></summary>
      ${lane.tasks.map(t=>`<button type="button" data-cal-task="${esc(t.id)}"><span>${esc(t.title)}</span><small>${fmt(t.date)}</small><em>${esc(Object.hasOwn(statusLabels,t.status)?statusLabels[t.status]:statusLabels.unknown)}</em>${request(t)?`<small>${esc(requestLabels[request(t).status]||request(t).status)}</small>`:''}</button>`).join('')}
    </details>`).join('')}
 </section>`:''}`;
}

function render(resultsOnly=false){
 if(!active||!getUser()||!container.isConnected)return;
 const list=visibleTasks(tasks(),group,query);
 const lanes=calendarLanes(list);
 const dates=Array.from({length:7},(_,n)=>add(selected,n));
 const row=rows.find(w=>w.week_start===selected);
 const currentDate=today();
 const undated=list.filter(t=>!t.date).length;
 const source=loading?'Đang đọc dữ liệu lịch…':loadError?esc(loadError):row
  ? 'Snapshot Notion · '+esc(new Date(row.synced_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}))
  : 'Nguồn: Weekly Planner';
 const results=`<div class="cal-status">
   <span role="status">${list.length} công việc${undated?' · '+undated+' chưa phân ngày':''}</span>
   <p class="cal-source" role="status">${source}</p>
  </div>
  ${display==='agenda'?agenda(list,lanes,dates,currentDate):board(lanes,dates,currentDate)}`;
 const region=container.querySelector('.cal-results');
 if(resultsOnly&&region){
  const railScroll=region.querySelector('.cal-day-rail')?.scrollLeft||0;
  region.innerHTML=results;
  const rail=region.querySelector('.cal-day-rail');
  if(rail)rail.scrollLeft=railScroll;
  return;
 }
 const weeks=[...new Set([selected,...getWeeks().map(w=>w.week_start),...rows.map(w=>w.week_start)])].sort().reverse();
 const previous=container.ownerDocument?.activeElement;
 const focusAttr=['data-cal-display','data-cal-nav','data-cal-focus','data-cal-refresh','data-cal-group','data-cal-week','data-cal-query'].find(attr=>previous?.hasAttribute(attr));
 const focusValue=focusAttr?previous.getAttribute(focusAttr):null;
 const selection=focusAttr==='data-cal-query'?[previous.selectionStart,previous.selectionEnd]:null;
 const dayRailScroll=container.querySelector('.cal-day-rail')?.scrollLeft||0;
 const boardScroll=container.querySelector('.cal-scroll')?.scrollLeft||0;
 container.innerHTML=`<section class="calendar-os">
  <header class="cal-heading">
   <div><h1>Lịch công việc</h1><p>${fmt(selected)} – ${fmt(dates.at(-1))} · ${selected.slice(0,4)}</p></div>
   <div class="cal-mode" role="group" aria-label="Kiểu hiển thị">
    <button type="button" data-cal-display="agenda" aria-pressed="${display==='agenda'}">${icon('review')} Danh sách</button>
    <button type="button" data-cal-display="board" aria-pressed="${display==='board'}">${icon('calendar')} Lịch tuần</button>
   </div>
  </header>
  <div class="cal-tools">
   <div class="cal-controls">
    <div class="cal-week-step" role="group" aria-label="Chuyển tuần">
     <button type="button" data-cal-nav="-7" aria-label="Tuần trước">${icon('back')}</button>
     <button type="button" data-cal-nav="today">Tuần này</button>
     <button type="button" data-cal-nav="7" aria-label="Tuần sau">${icon('arrow')}</button>
    </div>
    <select data-cal-week aria-label="Tuần lịch">${weeks.map(w=>`<option value="${w}" ${w===selected?'selected':''}>${fmt(w)} – ${fmt(add(w,6))} / ${w.slice(0,4)}</option>`).join('')}</select>
    <button type="button" data-cal-refresh aria-label="Tải lại lịch" aria-busy="${loading}">${icon('refresh')}</button>
   </div>
   <div class="cal-filter">
    <label>Tìm công việc<input data-cal-query value="${esc(query)}" placeholder="Tên công việc…"></label>
    <label>Nhóm<select data-cal-group><option value="all">Tất cả nhóm</option>${GROUPS.map(g=>`<option ${g===group?'selected':''}>${esc(g)}</option>`).join('')}</select></label>
   </div>
  </div>
  <div class="cal-results">${results}</div>
  <p class="cal-note">Notion là nguồn chính. Chỉnh sửa được gửi vào hàng đợi và xử lý trong lượt Daily Check-in 22:00 hoặc đồng bộ thứ Hai 08:00 (giờ Việt Nam), tùy quyền kết nối. Chỉ xác nhận sau khi đọc lại nguồn.</p>
  <dialog class="cal-dialog" aria-labelledby="cal-task-title"><div data-cal-detail></div></dialog>
  <dialog class="cal-dialog cal-overflow" aria-labelledby="cal-overflow-title"><div data-cal-overflow></div></dialog>
 </section>`;
 const rail=container.querySelector('.cal-day-rail');
 if(rail)rail.scrollLeft=dayRailScroll;
 const timeline=container.querySelector('.cal-scroll');
 if(timeline)timeline.scrollLeft=boardScroll;
 if(focusAttr){
  const next=[...container.querySelectorAll('['+focusAttr+']')].find(el=>el.getAttribute(focusAttr)===focusValue);
  next?.focus({preventScroll:true});
  if(selection)next?.setSelectionRange(...selection);
 }
 bind();
}

function bind(){
 container.onclick=e=>{
  const mode=e.target.closest('[data-cal-display]');
  if(mode){display=mode.dataset.calDisplay;render();return;}
  const focus=e.target.closest('[data-cal-focus]');
  if(focus){day=focus.dataset.calFocus;render();container.querySelector(`.cal-day-rail [data-cal-focus="${day}"]`)?.focus({preventScroll:true});return;}
  if(e.target.closest('[data-cal-clear]')){group='all';query='';render();container.querySelector('[data-cal-query]').focus();return;}
  const task=e.target.closest('[data-cal-task]');
  if(task){
   const overflow=container.querySelector('.cal-overflow');
   if(overflow.open)overflow.close();
   detail(task.dataset.calTask);
   return;
  }
  const more=e.target.closest('[data-cal-more]');
  if(more){showMore(more.dataset.calMore,Number(more.dataset.calDay));return;}
  if(e.target.closest('[data-cal-overflow-close]')){container.querySelector('.cal-overflow').close();return;}
  const nav=e.target.closest('[data-cal-nav]');
  if(nav){day='all';selected=nav.dataset.calNav==='today'?monday():add(selected,Number(nav.dataset.calNav));render();return;}
  if(e.target.closest('[data-cal-refresh]')&&!loading)void mount();
 };
 container.onchange=e=>{
  if(e.target.matches('[data-cal-week]')){selected=e.target.value;day='all';render();}
  else if(e.target.matches('[data-cal-group]')){group=e.target.value;render(true);}
 };
 container.oninput=e=>{if(e.target.matches('[data-cal-query]')){query=e.target.value;render(true);}};
}

function showMore(laneId,day){const lane=calendarLanes(visibleTasks(tasks(),group,query)).find(l=>l.id===laneId);if(!lane||!Number.isInteger(day)||day<0||day>7)return;const dayLabel=day===7?'Chưa phân ngày':fmt(add(selected,day));const list=lane.tasks.filter(t=>day===7?!t.date:t.date===add(selected,day));const dlg=container.querySelector('.cal-overflow');dlg.querySelector('[data-cal-overflow]').innerHTML='<div class="cal-dialog-head"><h2 id="cal-overflow-title">'+esc(lane.label)+' · '+esc(dayLabel)+'</h2><button data-cal-overflow-close aria-label="Đóng">×</button></div><p>'+list.length+' task · chọn task để xem hoặc chỉnh sửa</p><div class="cal-overflow-list">'+list.map(card).join('')+'</div>';dlg.showModal()}
function detail(id){const t=tasks().find(t=>t.id===id);if(!t)return;const dlg=container.querySelector('dialog'),r=request(t),can=!t.readonly&&!requests.some(r=>r.week_start===selected&&r.task_id===id&&r.status==='pending');dlg.querySelector('[data-cal-detail]').innerHTML='<div class="cal-dialog-head"><h2 id="cal-task-title">Chi tiết công việc</h2><button data-cal-close aria-label="Đóng">×</button></div><form><label>Tên công việc<input name="title" maxlength="500" required value="'+esc(t.title)+'"></label><label>Nhóm<select name="group">'+GROUPS.map(g=>'<option '+(t.group===g?'selected':'')+'>'+g+'</option>').join('')+'</select></label><label>Ngày (để trống nếu chưa chốt)<input type="date" name="date" min="'+selected+'" max="'+add(selected,6)+'" value="'+(t.date||'')+'"></label><label>Trạng thái<select name="status">'+['plan','doing','blocked','reported_done'].map(s=>'<option value="'+s+'" '+(t.status===s?'selected':'')+'>'+statusLabels[s]+'</option>').join('')+'</select></label><p>“Tự báo đã làm” là trạng thái do bạn ghi nhận. Việc xác minh dựa trên nguồn.</p><a target="_blank" rel="noopener" href="'+sourceLink(t.url)+'">Mở nguồn Notion ↗</a><p data-cal-save-message role="status">'+esc(r?.message||'')+'</p><button class="cal-save" '+(can?'':'disabled')+' type="submit">'+(t.readonly?'Nguồn cũ · chỉnh tại Notion':can?'Lưu & yêu cầu cập nhật Notion':'Đang chờ ghi Notion')+'</button></form>';dlg.querySelector('[data-cal-close]').onclick=()=>dlg.close();dlg.querySelector('form').onsubmit=async e=>{e.preventDefault();const owner=getUser()?.id;if(!owner||!can)return;const form=e.target,fd=new FormData(form),changes=Object.fromEntries(fd);changes.date=changes.date||null;const btn=form.querySelector('button[type=submit]'),msg=form.querySelector('[data-cal-save-message]');btn.disabled=true;msg.textContent='Đang lưu yêu cầu…';const {data,error}=await db.rpc('request_calendar_edit',{p_week:selected,p_task:t.id,p_base:t,p_changes:changes});if(getUser()?.id!==owner){dlg.close();return}if(error){msg.textContent='Chưa lưu: '+error.message;btn.disabled=false;return}msg.textContent='Đã lưu yêu cầu. Chưa ghi vào Notion; chờ lượt đồng bộ.';btn.textContent='Chờ ghi Notion';requests.unshift({id:data,task_id:id,week_start:selected,status:'pending',changes});};dlg.addEventListener('close',()=>{if(request(t)!==r){render();[...container.querySelectorAll('[data-cal-task]')].find(el=>el.dataset.calTask===id)?.focus({preventScroll:true});}},{once:true});dlg.showModal()}
async function mount(){const owner=getUser()?.id;if(!owner)return;active=true;const stamp=++generation;loading=true;render();const results=await Promise.allSettled([db.from('personal_os_calendar_weeks').select('*').eq('owner_id',owner).order('week_start',{ascending:false}).limit(150),db.from('personal_os_calendar_edits').select('*').eq('owner_id',owner).order('created_at',{ascending:false}).limit(300)]).then(results=>results.map(r=>r.status==='fulfilled'?r.value:{error:r.reason}));if(stamp!==generation||getUser()?.id!==owner||!active)return;loading=false;loadError=results.filter(r=>r.error).map(r=>'Nguồn calendar: '+r.error.message).join(' · ');if(!results[0].error)rows=results[0].data||[];if(!results[1].error)requests=results[1].data||[];render()}
function suspend(){active=false;generation++;container.onclick=null;container.onchange=null;container.oninput=null}
function clear(){suspend();rows=[];requests=[];selected=monday();group='all';query='';day='all';container.replaceChildren()}
return {mount,clear,suspend,async inspect(id,start){if(/^\d{4}-\d{2}-\d{2}$/.test(start||''))selected=start;group='all';query='';day='all';await mount();if(active&&getUser()&&container.isConnected)detail(id);}};}


