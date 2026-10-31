import {createCalendar} from './calendar.mjs';
import {MODULES,parseWorkspaceHash,renderWorkspaceHome,createWorkspaceGateway} from './workspaces.mjs';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { STATUSES, todayVN, weekRange, canonicalWeeks, uniqueItems, currentSnapshot, periodItems, explicitDate, dailyEvidence } from "./model.mjs";
import { buildWeekAnalytics, filterAnalysisRecords, STATUS_META } from "./analytics.mjs";
import { renderAnalyticsSummary, renderAnalyticsPanels, axisLabel } from "./analytics-view.mjs";
import { icon, filterRecords, statementParts } from "./experience.mjs";
import { SOURCE, BLUEPRINT, CAPACITY } from "./goals.js";
import { PROJECT_URL, PUBLISHABLE_KEY } from "./config.js";
import {buildGanttModel,filterGanttTasks,ganttCsv,quarterRange} from './gantt.mjs';
import {renderGanttSurface,renderGanttTimeline,renderGanttAgenda} from './gantt-view.mjs';
import {buildProgressModel,validLevel as validProgressLevel,LEVELS as PROGRESS_LEVELS,checkpointLabel,progressDelta} from './progress.mjs';
import {renderProgress,renderRadarCard,facetDimensions} from './progress-view.mjs';
const db=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const PILLARS=[
["career","Sự nghiệp & lãnh đạo","◈","#dcebf8"],
["education","Học tập & năng lực","✦","#ebe4f9"],
["entrepreneurship","Business cá nhân","◇","#fff0dc"],
["finance","Tài chính cá nhân","▤","#e2f3e7"],
["health","Sức khỏe & năng lượng","♥","#ffe9e6"],
["relationships","Quan hệ & gia đình","♧","#f5e5f1"],
["growth","Phát triển & sáng tạo","✳","#fff2d7"]];
const viewNames={calendar:"Lịch công việc",progress:"Bản đồ tiến bộ",gantt:"Gantt Pro",life:"Nhịp sống",business:"Business cá nhân",review:"Review & bằng chứng",notion:"Dữ liệu từ Notion",blueprint:"Mục tiêu năm",overview:"Tuần của tôi",weekly:"Review tuần",monthly:"Review tháng",evidence:"Bằng chứng",decision:"Nhật ký quyết định",settings:"Nguồn & cài đặt"};
let selectedYear=Number(localStorage.getItem("henry-os-year"))===2027?2027:2026;
let progressSnapshots=[],progressError='';
let yearPlan=null,loadingData=false,loadError="",refreshSequence=0;
let notionWeeks=[];
let user=null,entries=[],metrics=[],settings=null,currentView="overview",busy=false;
const $=s=>document.querySelector(s);
const calendarController=createCalendar({db,getUser:()=>user,getWeeks:()=>canonicalWeeks(notionWeeks),container:document.querySelector('#view-content')});
const detailRegistry=new Map();
let workspace=parseWorkspaceHash(location.hash).module,moduleMetadata={};
let lastWorkspace=localStorage.getItem('henry-last-workspace')||'personal';
const gateway=createWorkspaceGateway({db,getUser:()=>user,container:document.querySelector('#module-deck'),onMetadata:data=>{moduleMetadata=data;if(workspace==='home')render();}});
function navigateWorkspace(module,view){for(const id of ['detail-dialog','command-dialog']){const dialog=document.getElementById(id);if(dialog?.open)dialog.close();}workspace=module;document.body.dataset.workspace=module;if(module==='personal'){currentView=view||currentView||'overview';}if(Object.hasOwn(MODULES,module)){lastWorkspace=module;localStorage.setItem('henry-last-workspace',module);}const hash=module==='personal'?'personal/'+currentView:module;history.replaceState(null,'','#'+hash);render();if(module==='home')void gateway.refreshMetadata();window.scrollTo(0,0);}
document.addEventListener('click',e=>{const target=e.target.closest('[data-workspace]');if(target?.tagName==='BUTTON')navigateWorkspace(target.dataset.workspace);});
window.addEventListener('hashchange',()=>{const route=parseWorkspaceHash(location.hash);navigateWorkspace(route.module,route.view);});

let chartRevision="";
const safe=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const dateNow=()=>todayVN();
const monthNow=()=>selectedYear+dateNow().slice(4,7);
const reviewDate=()=>selectedYear+dateNow().slice(4);
const pName=id=>yearPillars().find(p=>p[0]===normalizePillar(id))?.[1]||"General";
const opt=()=>yearPillars().map(p=>'<option value="'+p[0]+'">'+safe(p[1])+'</option>').join("");
const dtext=x=>x?new Date(x+"T00:00:00").toLocaleDateString("vi-VN"):"—";
function toast(message){const t=$("#toast");t.textContent=message;t.classList.remove("hidden");clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.add("hidden"),4800);}
function notifyError(error){toast("Có lỗi: "+(error?.message||String(error)));console.error(error);}
function stateLogin(on){$("#auth").classList.toggle("hidden",on);$("#shell").classList.toggle("hidden",!on);if(on)$("#identity").textContent=user?.email||"";}
async function refresh(silent=false){
 if(!user)return;
 const loadOwner=user.id,loadYear=selectedYear,sequence=++refreshSequence;
 loadingData=true;loadError="";if(!silent)render();
 try{
 const results=await Promise.allSettled([
 db.from("personal_os_entries").select("*").order("period_start",{ascending:false}).limit(250),
 db.from("personal_os_metrics").select("*").order("month_start",{ascending:false}).limit(200),
 db.from("personal_os_settings").select("*").eq("owner_id",loadOwner).eq("year",loadYear).maybeSingle(),
 db.from("personal_os_notion_weeks").select("*").eq("owner_id",loadOwner).order("week_start",{ascending:false}).limit(1000),
 db.from("personal_os_year_plans").select("*").eq("owner_id",loadOwner).eq("year",loadYear).maybeSingle(),
 db.from("personal_os_progress_snapshots").select("*").eq("owner_id",loadOwner).order("as_of",{ascending:false}).order("created_at",{ascending:false}).limit(500)
 ]);
 if(user?.id!==loadOwner||selectedYear!==loadYear||sequence!==refreshSequence)return;
 const data=results.map(r=>r.status==='fulfilled'?r.value:{error:r.reason});
 if(!data[0].error)entries=data[0].data||[];
 if(!data[1].error)metrics=data[1].data||[];
 if(!data[2].error)settings=data[2].data||null;
 if(!data[3].error)notionWeeks=data[3].data||[];
 if(!data[4].error)yearPlan=data[4].data||null;
 if(!data[5].error){progressSnapshots=data[5].data||[];progressError='';}else progressError=data[5].error.message||'Chưa tải được checkpoint tiến bộ.';
 const failures=data.filter(r=>r.error);
 if(failures.length){loadError=failures.map(r=>r.error.message||'Không tải được dữ liệu').join(' · ');notifyError(failures[0].error);}
 }catch(error){if(sequence===refreshSequence){loadError=error.message||'Không tải được dữ liệu';notifyError(error);}}
 finally{if(sequence===refreshSequence&&user?.id===loadOwner){loadingData=false;render();}}
}
async function saveEntry(type,date,pillar,title,content){
 if(busy)return;
 if(!String(date).startsWith(String(selectedYear)))throw Error("Ngày bản ghi phải thuộc năm đang chọn.");
 busy=true;
 try{
 const {data,error}=await db.from("personal_os_entries").insert({owner_id:user.id,entry_type:type,period_start:date,pillar:pillar||null,title:title||"",content}).select('id').single();
 if(error)throw error;
 const readback=await db.from('personal_os_entries').select('id').eq('id',data.id).eq('owner_id',user.id).single();
 if(readback.error||readback.data?.id!==data.id)throw Error('Đã gửi bản ghi nhưng chưa xác minh được. Tải lại trước khi thử lưu lại.');
 await refresh();toast("Đã lưu và đọc lại bản ghi.");
 }finally{busy=false;}
}
const items=type=>entries.filter(x=>x.entry_type===type&&x.period_start.startsWith(String(selectedYear)));
function entrySummary(x){
 const c=x.content||{};
 if(x.entry_type==="weekly")return [["Wins",c.wins],["Blocker",c.blocker],["Next",c.next],["Energy",c.energy?c.energy+"/5":null]];
 if(x.entry_type==="monthly")return [["Progress",c.progress],["Bài học",c.lessons],["Next month",c.next],["Capacity",c.capacity]];
 if(x.entry_type==="decision")return [["Context",c.context],["Decision",c.choice],["Follow-up",c.followup]];
 return [["Evidence",c.description],["Link",c.link]];
}
function entryCard(x){
 const lines=entrySummary(x).filter(([,v])=>v).map(([k,v])=>{
 if(k==="Link"&&/^https?:\/\//i.test(v))return '<p><b>Link:</b> <a class="inline-link" href="'+safe(v)+'" target="_blank" rel="noopener noreferrer">Mở bằng chứng ↗</a></p>';
 return "<p><b>"+safe(({Wins:"Tiến triển",Blocker:"Điểm nghẽn",Next:"Tiếp theo",Energy:"Năng lượng",Progress:"Kết quả",Lessons:"Bài học",Context:"Bối cảnh",Decision:"Quyết định",Evidence:"Bằng chứng"})[k]||k)+":</b> "+safe(v)+"</p>";}).join("");
 return '<article class="entry"><div class="entry-top"><time>'+dtext(x.period_start)+' · '+safe(pName(x.pillar))+'</time><button class="btn-sm" data-delete="'+safe(x.id)+'" type="button">Xóa</button></div><h4>'+safe(x.title||"Ghi nhận")+'</h4>'+lines+'</article>';
}
function historyHtml(type,limit=10){const list=items(type).slice(0,limit);return list.length?'<div class="history">'+list.map(entryCard).join("")+'</div>':'<div class="empty">Chưa có bản cập nhật. Bắt đầu khi bạn sẵn sàng.</div>';}
function heading(text,subtitle=""){return '<div class="section-header"><h3>'+text+'</h3><span class="muted">'+subtitle+'</span></div>';}

function renderBlueprint(){
 if(selectedYear===2026)return renderYearPlan();
 const year=selectedYear;
 if(!Number.isInteger(window._blueprintQuarter)) window._blueprintQuarter=new Date().getFullYear()===2027?Math.floor(new Date().getMonth()/3):0;
 const quarterSelect=['Q1','Q2','Q3','Q4'].map((q,i)=>'<button class="quarter-tab'+(window._blueprintQuarter===i?' selected':'')+'" data-quarter="'+i+'">'+q+'</button>').join('');
 const q=Number.isInteger(window._blueprintQuarter)?window._blueprintQuarter:0;
 const recent=items("evidence");
 const pillars=BLUEPRINT.map(b=>{
   const evidence=recent.filter(x=>x.pillar===b.id).length;
   return '<details class="goal-card" style="--pillar:'+['#477e86','#8d78a3','#b39255','#65875c','#b57564','#aa7d91','#9d905b'][BLUEPRINT.indexOf(b)]+';--tint:'+PILLARS.find(p=>p[0]===b.id)?.[3]+'" '+(b.id==="career"||b.id==="education"?'open':'')+'><summary><span class="goal-icon" aria-hidden="true">'+(PILLARS.find(p=>p[0]===b.id)?.[2]||'◇')+'</span><span><strong>'+safe(b.name)+'</strong><small>'+safe(b.priority)+'</small></span><span class="goal-count">'+evidence+' evidence</span></summary>'+
   '<div class="goal-detail"><div class="goal-north">'+safe(b.north)+'</div><p>'+safe(b.objective)+'</p><div class="goal-mini-title">KEY RESULTS · MỤC TIÊU THAM CHIẾU</div><ul>'+b.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul><div class="goal-mini-title">CAM KẾT TRONG QUÝ</div><div class="quarter-detail">'+safe(b.q[q])+'</div><div class="goal-mini-title">CHỈ SỐ THEO DÕI</div><div class="metric-chips">'+b.metrics.map(m=>'<span title="'+safe(m[2])+'">'+safe(m[0])+'</span>').join('')+'</div><button class="btn soft small" data-view="evidence">Ghi nhận bằng chứng ↗</button></div></details>';
 }).join('');
 return '<div class="hero"><div><div class="eyebrow">HENRY · 2027 → GM 2031</div><h3>Một năm có hướng.<br/>Một cuộc sống vững vàng.</h3><p>Servicebio, MBA và một cuộc sống vững vàng. Mỗi mục tiêu đều cần một hành động tiếp theo, một bằng chứng thực tế.</p></div><div class="hero-stamp"><b>07</b><small>Life pillars</small></div></div>'+
 '<div class="source-banner"><div><b>2027 Objectives · Canonical Source</b><p>Snapshot được đối chiếu '+safe(SOURCE.reviewed)+'. Không tự động đồng bộ; nếu OneNote thay đổi, mục tiêu trên đây cần được cập nhật có kiểm chứng.</p></div><a href="'+safe(SOURCE.url)+'" target="_blank" rel="noopener noreferrer" class="btn soft">Mở OneNote ↗</a></div>'+
 heading("Định hướng năm 2027","Ba ưu tiên lớn nhất")+
 '<div class="cards"><div class="card"><span class="kicker">01 / PRIMARY GAME</span><b class="value">Servicebio</b><p>National Sales Manager → country P&L, channel, people, operations và HQ influence. Quyền điều hành toàn phần là giả định kế hoạch.</p></div>'+
 '<div class="card"><span class="kicker">02 / STRATEGIC INVESTMENT</span><b class="value">MBA · Apr–May</b><p>Business Chinese + 2 applied management cases; admission và chi phí vẫn cần xác nhận.</p></div>'+
 '<div class="card"><span class="kicker">03 / LONG-TERM FOUNDATION</span><b class="value">25% → 35%</b><p>Base / stretch savings rate, quỹ MBA, sáu tháng liquidity, sức khỏe và các quan hệ được bảo vệ.</p></div></div>'+
 heading("Cam kết theo quý","Chọn quý để xem hành động và giới hạn tải")+
 '<div class="quarter-tabs">'+quarterSelect+'</div>'+
 '<div class="capacity-banner"><b>'+CAPACITY[q].quarter+' · '+CAPACITY[q].level+' capacity</b><span>'+safe(CAPACITY[q].rule)+'</span></div>'+
 heading("7 trục · Mục tiêu cấp năm","Số bằng chứng không phải % hoàn thành")+
 '<div class="goal-list">'+pillars+'</div>'+
 '<div class="closing-note"><b>GM 2031 GAP</b><p>2027: country economics + delegated people/operations leadership. 2028–2030: managing managers, working capital, governance, succession & capital allocation. 2031: GM scope over title.</p><div class="journey"><span><b>2027 / BUILD</b>Country economics · MBA · people</span><span><b>2028–2030 / EXPAND</b>Managing managers · capital allocation</span><span><b>2031 / LEAD</b>GM / Country Manager scope</span></div></div>';
}

function reviewRhythm(latest){
 const age=latest?Math.floor((new Date(dateNow()+'T00:00:00')-new Date(latest.period_start+'T00:00:00'))/86400000):null;
 const title=age===null?'Bắt đầu nhịp review của bạn':age<0?'Có bản review cho ngày sắp tới':age<=7?'Bạn đang giữ nhịp tốt':'Đến lúc dành 10 phút cho bản thân';
 const note=latest?'Weekly Pulse gần nhất: '+dtext(latest.period_start)+'. Một chút nhìn lại giúp tuần tới rõ hướng hơn.':'3 kết quả, 1 trở ngại, 3 ưu tiên. Chỉ ghi những trục có thay đổi.';
 return '<div class="review-rail"><div><strong>'+title+'</strong><p>'+note+'</p></div><button class="btn soft" data-view="weekly">Weekly Pulse · 10 phút ↗</button></div>';
}
function notionPeriodWeeks(){
 const mode=window._notionMode||'month', period=window._notionPeriod||monthNow();
 const y=Number(period.slice(0,4)),m=Number(period.slice(5,7));
 return notionWeeks.filter(w=>{const wy=Number(w.week_start.slice(0,4)),wm=Number(w.week_start.slice(5,7));return wy===y&&(mode==='year'||(mode==='quarter'?Math.ceil(wm/3)===Math.ceil(m/3):wm===m));});
}
function renderNotion(){
 const selected=notionPeriodWeeks(),all=uniqueItems(selected).filter(i=>!['must_win','risk','stop'].includes(i.kind)).map(i=>({...i,week:i.week_start}));
 const statusNames=STATUSES;
 const mode=window._notionMode||'month';
 const counts=Object.keys(statusNames).map(k=>'<div class="card"><span class="kicker">'+statusNames[k]+'</span><b class="value">'+all.filter(i=>i.status===k).length+'</b><p>Số ghi nhận trong các nguồn đã nhập.</p></div>').join('');
 const pillars=yearPillars().map(p=>{const list=all.filter(i=>normalizePillar(i.pillar)===p[0]);const goal=selectedYear===2026?yearPlan?.plan?.axes.find(a=>a.id===p[0]):BLUEPRINT.find(b=>b.id===p[0]);const targetYear=(window._notionPeriod||monthNow()).slice(0,4);const ref=goal&&targetYear===String(selectedYear)?'<div class="quarter-detail"><b>Mục tiêu '+selectedYear+'</b><p>'+safe(goal.objective)+'</p><small>Ghi nhận chưa tự xác nhận hoàn thành các KR bên dưới.</small><ul>'+goal.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul></div>':'';return '<details class="goal-card"><summary><span class="goal-icon">'+p[2]+'</span><span><strong>'+safe(p[1])+'</strong><small>'+list.length+' ghi nhận từ Notion</small></span></summary><div class="goal-detail">'+ref+(list.length?list.map(i=>'<div class="entry"><span class="small-pill">'+safe(statusNames[i.status]||'Cần làm rõ')+'</span><p>'+safe(i.text)+'</p><small>'+safe(i.context||'Chưa xác định')+' · Tuần '+dtext(i.week)+'</small> · <a class="inline-link" href="'+safe(notionUrl(i.source_url))+'" target="_blank" rel="noopener noreferrer">Nguồn ↗</a></div>').join(''):'Chưa có dữ liệu cho trục này trong phạm vi đã nhập.')+'</div></details>';}).join('');
 const sources=selected.map(w=>'<article class="entry"><div class="row"><h4>'+safe(w.title)+'</h4><span class="small-pill">'+safe({complete:'Đủ nguồn',partial:'Đọc một phần',page_only:'Phần chữ của page',conflict:'Trùng / cần xác nhận'}[w.coverage]||w.coverage)+'</span></div><p>'+safe(w.summary)+'</p><p class="info">'+(w.warnings||[]).map(safe).join(' · ')+'</p><time>Kiểm tra gần nhất: '+safe(new Date(w.synced_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}))+'</time> · <a class="inline-link" href="'+safe(notionUrl(w.source_url))+'" target="_blank" rel="noopener noreferrer">Mở trang tuần ↗</a></article>').join('');
 return '<div class="hero"><div><div class="eyebrow">NOTION → PERSONAL OS</div><h3>Nhìn lại từng tuần.<br/>Chọn hướng đi rõ hơn.</h3><p>Tiếp tục viết trên Notion. Xem kế hoạch, kết quả tự ghi nhận và trở ngại theo các trục của năm đang chọn.</p></div><div class="hero-stamp"><b>'+selected.length+'</b><small>Trang tuần trong kỳ</small></div></div>'+
 '<div class="source-banner"><div><b>Snapshot Notion · Daily + Weekly</b><p>Daily và Weekly cập nhật cùng snapshot tuần. Nút tải lại chỉ đọc database; thời gian ghi nguồn và độ đầy đủ ở bên dưới.</p></div><button class="btn soft" id="reload-notion">Tải lại dữ liệu</button></div>'+
 '<div class="section-header"><h3>Review theo kỳ</h3><div class="toolbar"><label>Kỳ<select id="notion-mode">'+[['month','Tháng'],['quarter','Quý'],['year','Năm']].map(([v,n])=>'<option value="'+v+'" '+(mode===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Mốc tham chiếu<input id="notion-period" type="month" value="'+safe(window._notionPeriod||monthNow())+'"></label></div></div>'+
 '<p class="info">Tuần được xếp theo ngày bắt đầu tuần. '+(mode==='quarter'?'Đang xem Q'+Math.ceil(Number((window._notionPeriod||monthNow()).slice(5,7))/3)+'. ':'')+'Không cộng dồn doanh thu, thói quen hoặc cùng một kết quả được nhắc lại. Số ghi nhận không phải % hoàn thành KR. Dữ liệu 2026 tách khỏi mục tiêu 2027.</p>'+
 '<div class="cards notion-counts">'+counts+'</div>'+heading(yearPillars().length+' trục · Kết quả và khoảng trống','Ghi nhận từ nguồn, chưa xác minh độc lập')+'<div class="goal-list">'+pillars+'</div>'+heading('Nguồn và độ đầy đủ',selected.length+' trang tuần')+'<div class="history">'+(sources||'<div class="empty">Chưa có trang tuần được nhập cho kỳ này. Không có dữ liệu không có nghĩa là không tiến triển.</div>')+'</div>';
}
function notionUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['app.notion.com','www.notion.so','notion.so'].includes(u.hostname)?u.href:'#';}catch{return '#';}}

const YEAR_AXES=[['career','Sự nghiệp'],['business','Business cá nhân'],['freelance','Freelance'],['education','Học tập'],['health','Sức khỏe & thể thao'],['finance','Tài chính'],['growth','Đời sống & sáng tạo'],['relationships','Quan hệ & gia đình']];
const yearPillars=()=>selectedYear===2026?YEAR_AXES.map(([id,name],i)=>[id,name,['◈','◇','↗','✦','♥','▤','✳','♧'][i],['#dcebf8','#fff0dc','#ffe8d6','#ebe4f9','#ffe9e6','#e2f3e7','#fff2d7','#f5e5f1'][i]]):PILLARS;
const sourceForYear=()=>selectedYear===2026?yearPlan?.source_url||'':SOURCE.url;
const normalizePillar=id=>selectedYear===2026&&id==='entrepreneurship'?'business':id;
function annualEvidence(axis,quarter){
 return periodItems(notionWeeks,selectedYear).filter(i=>Math.floor((Number(i.week_start.slice(5,7))-1)/3)===quarter&&normalizePillar(i.pillar)===axis&&['reported_done','verified_done'].includes(i.status)&&!['must_win','risk','stop'].includes(i.kind)).map(i=>({...i,week:i.week_start}));
}
function renderYearPlan(){
 if(!yearPlan)return '<div class="empty" role="status">'+(loadingData?'Đang tải Objectives '+selectedYear+'…':loadError?'Không tải được dữ liệu: '+safe(loadError):'Chưa tìm thấy Objectives '+selectedYear+' cho tài khoản này.')+(loadingData?'':'<br/><button class="btn soft" id="retry-year">Tải lại Objectives</button>')+'</div>';
 const p=yearPlan.plan,q=Number.isInteger(window._annualQuarter)?window._annualQuarter:Math.floor(new Date().getMonth()/3);
 const cards=p.axes.map(a=>{const evidence=annualEvidence(a.id,q);return '<details class="goal-card" '+(a.id==='career'?'open':'')+'><summary><span><strong>'+safe(a.name)+'</strong><small>'+evidence.length+' task/ghi nhận thực hiện trong Q'+(q+1)+'</small></span></summary><div class="goal-detail"><div class="goal-north">'+safe(a.objective)+'</div><div class="goal-mini-title">KEY RESULTS · SOURCE OF TRUTH</div><ul>'+a.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul><div class="goal-mini-title">Q'+(q+1)+' · NỘI DUNG NGUYÊN BẢN</div><div class="quarter-detail preserve-lines">'+safe(a.quarters[q])+'</div><div class="goal-mini-title">ĐỐI CHIẾU · CHƯA PHẢI KẾT LUẬN ĐẠT KR</div><p>'+safe(a.assessment)+'</p><div class="goal-mini-title">GHI NHẬN THỰC HIỆN TỪ NOTION</div>'+(evidence.length?evidence.slice(0,10).map(i=>'<p>• '+safe(i.text)+' <a class="inline-link" target="_blank" rel="noopener noreferrer" href="'+safe(notionUrl(i.source_url))+'">Nguồn ↗</a></p>').join('')+(evidence.length>10?'<p class="info">Xem các ghi nhận còn lại trong Notion Review.</p>':''):'<p>Chưa có bằng chứng được nhập cho quý này. Không mặc định là chưa làm.</p>')+'</div></details>';}).join('');
 return '<div class="hero"><div><div class="eyebrow">2026 / LIVE DATA PILOT</div><h3>Mục tiêu thật.<br/>Đối chiếu rõ ràng.</h3><p>Giữ nguyên 8 trục năm 2026 từ OneNote. Đối chiếu với Notion và ghi rõ khoảng trống dữ liệu.</p></div><div class="hero-stamp"><b>2026</b><small>8 trục nguyên bản</small></div></div><div class="source-banner"><div><b>'+safe(yearPlan.source_title)+'</b><p>Đã đọc bảng OneNote; màu highlight và hình ảnh chưa được dùng để xác định hoàn thành.</p></div><a class="btn soft" href="'+safe(yearPlan.source_url)+'" target="_blank" rel="noopener noreferrer">Mở OneNote ↗</a></div>'+heading('Cam kết và lịch sử theo quý','Q1–Q3 được bảo toàn')+'<div class="quarter-tabs">'+[0,1,2,3].map(n=>'<button class="quarter-tab '+(q===n?'selected':'')+'" data-annual-quarter="'+n+'">Q'+(n+1)+'</button>').join('')+'</div><div class="goal-list" style="margin-top:20px">'+cards+'</div><div class="closing-note"><b>CẦN ĐỐI CHIẾU</b>'+p.warnings.map(w=>'<p>'+safe(w)+'</p>').join('')+'</div>';
}
function selectedWeek(){
 const range=weekRange();
 if(window._weekStart)return canonicalWeeks(notionWeeks).find(w=>w.week_start===window._weekStart&&w.week_start.startsWith(String(selectedYear)))||null;
 return selectedYear===Number(dateNow().slice(0,4))?currentSnapshot(notionWeeks):canonicalWeeks(notionWeeks).find(w=>w.week_start.startsWith(String(selectedYear)))||null;
}
function sourceLink(w,label="Mở Notion"){return w?'<a class="btn ghost" href="'+safe(notionUrl(w.source_url))+'" target="_blank" rel="noopener noreferrer">'+label+'</a>':'';}
function statusPill(i){return '<span class="status status-'+safe(STATUSES[i.status]?i.status:'unknown')+'">'+safe(STATUSES[i.status]||'Chưa rõ')+(i.kind==='activity'?' · hoạt động':'')+'</span>';}
function detailKey(i){const k=[i.page_id||i.week_start,i.key||i.text,i.occurred_on||''].join('|');detailRegistry.set(k,i);return k;}
function itemRow(i){return '<article class="record-row"><div>'+statusPill(i)+'<p>'+safe(i.text)+'</p><small>'+safe(pName(i.pillar))+(explicitDate(i)?' · '+dtext(i.occurred_on):' · Chưa có ngày thực hiện')+'</small></div><button class="icon-button record-detail" data-detail="'+safe(detailKey(i))+'" aria-label="Mở chi tiết ghi nhận">'+icon('chevron')+'</button></article>';}
function weekItems(w){return w?uniqueItems([w]):[];}
function weekPicker(){const weeks=canonicalWeeks(notionWeeks).filter(w=>w.week_start.startsWith(String(selectedYear)));return '<label class="week-picker"><span>Tuần đang xem</span><select id="week-select" aria-label="Tuần đang xem"><option value="">'+(selectedYear===Number(dateNow().slice(0,4))?'Tuần hiện tại':'Tuần gần nhất có nguồn')+'</option>'+weeks.map(w=>'<option value="'+safe(w.week_start)+'" '+(window._weekStart===w.week_start?'selected':'')+'>'+dtext(w.week_start)+' – '+dtext(w.week_end)+'</option>').join('')+'</select></label>';}
function dataBanner(w){
 if(loadingData&&!w)return '<div class="sync-line" role="status"><span class="sync-dot pending"></span>Đang tải dữ liệu…</div>';
 if(loadError)return '<div class="data-banner warning" role="alert">'+icon('note')+'<span>Không tải đủ nguồn. Dữ liệu đang giữ có thể cũ. '+safe(loadError)+'</span><button class="btn small" id="retry-year">Thử lại</button></div>';
 if(!w)return '<div class="sync-line"><span class="sync-dot pending"></span>Chưa có bản cập nhật cho tuần đang xem <button class="text-button" data-view="notion">Xem nguồn '+icon('arrow')+'</button></div>';
 return '<div class="sync-line"><span class="sync-dot '+(w.coverage==='complete'?'':'pending')+'"></span><span>'+safe({complete:'Đã đọc nguồn',partial:'Dữ liệu một phần',page_only:'Đã đọc nội dung trang'}[w.coverage]||'Cần đối chiếu')+' · Cập nhật '+safe(new Date(w.synced_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}))+'</span><button class="text-button sync-details" data-view="notion">Chi tiết nguồn '+icon('arrow')+'</button></div>';
}
function currentAnalytics(){return buildWeekAnalytics({week:selectedWeek(),weeks:notionWeeks,axes:yearPillars(),metrics,year:selectedYear});}
function renderOverview(){
 if(loadingData&&!notionWeeks.length)return '<section class="page-intro"><h1>Tuần của tôi</h1><p>Đang đọc dữ liệu để dựng bản đồ tuần.</p></section><section class="panel loading-state" role="status">'+icon('refresh','loading-spin')+'<span>Đang đọc dữ liệu…</span></section>';
 const w=selectedWeek();
 if(!w)return '<section class="page-intro"><h1>Tuần của tôi</h1><p>Năm '+selectedYear+'</p></section>'+dataBanner(null)+'<section class="panel year-empty">'+icon('calendar')+'<h3>Chưa có dữ liệu tuần cho năm '+selectedYear+'</h3><p class="info">Chưa thể dựng biểu đồ khi chưa có nguồn tuần tương ứng.</p><button class="btn primary" data-view="blueprint">Xem mục tiêu '+selectedYear+'</button></section>';
 const m=currentAnalytics(),day=window._selectedDay&&window._selectedDay>=w.week_start&&window._selectedDay<=w.week_end?window._selectedDay:dateNow()>=w.week_start&&dateNow()<=w.week_end?dateNow():w.week_start;
 const revision=[w.page_id,w.synced_at,selectedYear].join('|');
 const animated=chartRevision!==revision;chartRevision=revision;
 const rail='<div class="day-tabs week-rail" role="group" aria-label="Chọn ngày">'+m.days.map((d,n)=>'<button class="day-tab '+(day===d.date?'selected':'')+'" data-day="'+d.date+'" aria-label="'+['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'][n]+' '+d.date.slice(8)+'/'+d.date.slice(5,7)+'" aria-pressed="'+(day===d.date)+'"><span>'+['T2','T3','T4','T5','T6','T7','CN'][n]+'</span><b>'+d.date.slice(8)+'/'+d.date.slice(5,7)+'</b></button>').join('')+'</div>';
 const priorities=m.priorities.map((i,n)=>{const parts=statementParts(i.text);return '<button class="priority-row" data-detail="'+safe(detailKey(i))+'"><span class="priority-number">0'+(n+1)+'</span><span class="priority-copy"><strong>'+safe(parts.title)+'</strong><small>'+safe(parts.detail||pName(i.pillar))+'</small></span>'+statusPill(i)+icon('chevron')+'</button>';}).join('');
 return '<div class="analytics-workspace" data-chart-motion="'+(animated?'on':'off')+'"><section class="week-heading"><div><h1>Tuần của tôi</h1><p>'+dtext(w.week_start)+' — '+dtext(w.week_end)+'</p></div><div class="heading-actions">'+weekPicker()+'<a class="btn primary" href="'+safe(notionUrl(w.source_url))+'" target="_blank" rel="noopener noreferrer">Mở Notion '+icon('arrow')+'</a></div></section>'+dataBanner(w)+renderAnalyticsSummary(m,rail)+renderAnalyticsPanels(m,dateNow())+'<details class="source-planner-details"><summary><span>'+icon('calendar')+'Kế hoạch & quyết định từ nguồn</span><small>'+m.priorities.length+' ưu tiên · '+m.stops.length+' mục để sau</small>'+icon('chevron')+'</summary><div class="planner-detail-grid"><section class="panel"><div class="panel-heading"><h3>Ưu tiên trong tuần</h3><button class="text-button" data-analysis="priorities">Xem toàn bộ</button></div>'+priorities+'</section><section class="panel"><div class="panel-heading"><h3>Để sau tuần này</h3></div>'+m.stops.map(i=>'<button class="parked-row" data-detail="'+safe(detailKey(i))+'">'+icon('note')+'<span>'+safe(i.text)+'</span>'+icon('chevron')+'</button>').join('')+'</section></div></details></div>';
}
function renderLife(){
 const fallback=selectedWeek(),recentDay=weekItems(fallback).map(explicitDate).filter(d=>d&&d<=dateNow()&&d.startsWith(String(selectedYear))).sort().at(-1),day=window._lifeDay||recentDay||(selectedYear===Number(dateNow().slice(0,4))?dateNow():fallback?.week_end||selectedYear+'-01-01');
 const w=currentSnapshot(notionWeeks,day),list=weekItems(w);
 const evidence=dailyEvidence(w?[w]:[],day);
 const axes=[['education','Học tập & ngoại ngữ','HSK4 · tiếng Đức · Coursera'],['health','Sức khỏe & năng lượng','Vận động · nghỉ ngơi'],['finance','Tài chính cá nhân','Chi tiêu · tích lũy'],['relationships','Quan hệ & gia đình','Thời gian cho người quan trọng']];
 const otherEvidence=evidence.filter(i=>!axes.some(a=>a[0]===i.pillar));
 return '<section class="page-intro"><h1>Nhịp sống</h1><p>Học tập, sức khỏe và những điều cần giữ nhịp mỗi ngày.</p></section>'+dataBanner(w)+'<div class="section-header"><h3>Daily Check-in</h3><label>Ngày<input id="life-date" type="date" value="'+safe(day)+'"></label></div><div class="life-grid">'+axes.map(([id,name,note])=>{const rows=evidence.filter(i=>i.pillar===id);return '<section class="panel"><h3>'+name+'</h3><p class="section-note">'+note+'</p>'+(rows.length?rows.map(itemRow).join(''):'<p class="quiet">Chưa có ghi nhận trong ngày này.</p>')+'</section>';}).join('')+'</div><section class="panel daily-detail"><h3>Ghi nhận khác · '+dtext(day)+'</h3>'+(otherEvidence.length?otherEvidence.map(itemRow).join(''):'<p class="quiet">'+(evidence.length?'Các ghi nhận ngày này đã hiển thị ở các trục phía trên.':'Chưa có Daily Log được đồng bộ cho ngày này. Các ghi nhận tuần thiếu ngày vẫn ở phần dữ liệu nguồn.')+'</p>')+'</section><section class="rhythm-band"><div><h3>Check-in cùng Lumi</h3><p>Trả lời trong ChatGPT; log được ghi Notion rồi cập nhật cùng snapshot tuần.</p></div><button class="btn" id="copy-checkin">Sao chép câu hỏi check-in</button></section><p class="info">Một activity có cùng nguồn, khóa và ngày chỉ hiển thị một lần. Weekly summary không tạo thêm thành tích hoặc số buổi.</p>';
}
function renderBusiness(){
 const w=selectedWeek(),list=weekItems(w).filter(i=>['business','entrepreneurship','freelance'].includes(i.pillar));
 const active=list.filter(i=>i.kind!=='stop'),park=list.filter(i=>i.kind==='stop');
 return '<section class="page-intro"><h1>Business cá nhân</h1><p>Business cá nhân và nguồn thu bổ sung · nhìn vào bằng chứng thị trường.</p></section>'+dataBanner(w)+'<div class="two-col"><section class="panel"><h3>Đang khám phá & kiểm chứng</h3><p class="section-note">Hoạt động nghiên cứu chưa phải doanh thu hay khách hàng trả tiền.</p>'+(active.length?active.map(itemRow).join(''):'<p class="quiet">Chưa có cập nhật business từ Planner đang chọn.</p>')+'</section><section class="panel"><h3>Ý tưởng để sau</h3>'+(park.length?park.map(itemRow).join(''):'<p class="quiet">Chưa có ý tưởng được nguồn đánh dấu tạm dừng.</p>')+'<div class="principle"><b>Giữ thử nghiệm có giới hạn</b><p>Giới hạn vốn và thời gian theo kế hoạch được duyệt. Không tự mở dự án hoặc cam kết mua hàng.</p></div></section></div>';
}
function renderReviewHub(){return '<section class="page-intro"><h1>Review & bằng chứng</h1><p>Review là phản biện và lựa chọn. Số bản ghi không phải mức độ thành công.</p></section><div class="review-options">'+[['notion','Đối chiếu Notion','Xem ghi nhận theo tháng, quý, năm và nguồn gốc.'],['weekly','Review tuần','Ghi phản tư riêng; không tính thêm vào Daily outcomes.'],['monthly','Review tháng','Học tập, sức khỏe, dòng tiền và các quyết định.'],['evidence','Bằng chứng','Lưu kết quả cụ thể cùng nguồn kiểm chứng.'],['decision','Nhật ký quyết định','Lý do, lựa chọn và điều kiện xem lại.']].map(([v,t,n])=>'<button class="review-option" data-view="'+v+'"><span><b>'+t+'</b><small>'+n+'</small></span><span aria-hidden="true">↗</span></button>').join('')+'</div><section class="panel"><h3>Chuẩn bị Weekly Executive Review</h3><p class="info">Tối đa 3 Must-Win, 3 điểm nghẽn, danh sách dừng / để sau và kế hoạch có buffer. Khi review chưa xong, không coi dữ liệu là đầy đủ.</p><button class="btn primary" id="copy-brief">Sao chép brief cho Lumi</button></section>';}

function renderWeekly(){
 return '<div class="two-col"><div class="form-card"><h3>Review tuần · 10 phút</h3><p class="tagline">'+(selectedYear===2026?'Ví dụ: Biomedia Q4, Servicebio onboarding, HSK4, tài chính hoặc recovery.':'Ví dụ: Servicebio market map, HQ budget, MBA admission, Chinese, tiết kiệm hoặc recovery.')+' Không cần điền mọi trục.</p><form id="weekly-form">'+
 '<div class="form-grid"><label>Ngày review<input required name="date" type="date" value="'+reviewDate()+'"></label><label>Trục chính<select name="pillar">'+opt()+'</select></label></div>'+
 '<label>Tiến triển & bằng chứng<textarea required name="wins" placeholder="Điều gì đã tiến triển? Kết quả/bằng chứng?"></textarea></label>'+
 '<label>Điểm nghẽn lớn nhất<textarea name="blocker" placeholder="Một trở ngại đáng xử lý"></textarea></label>'+
 '<label>Tối đa 3 ưu tiên tiếp theo<textarea required name="next" placeholder="3 việc quan trọng nhất tuần tới"></textarea></label>'+
 '<label>Năng lượng 1–5<select name="energy"><option value="">Không đánh giá</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu phản tư tuần</button></div></form></div>'+
 '<div><div class="section-header"><h3>Lịch sử review tuần</h3></div>'+historyHtml("weekly",15)+'</div></div>';
}
function renderMonthly(){
 const now=monthNow();
 const monthMetrics=metrics.filter(x=>x.month_start.slice(0,7)===now).map(x=>'<div class="metric-row"><span>'+safe(x.metric_key)+'</span><strong>'+safe(x.metric_value)+' '+safe(x.unit)+'</strong></div>').join("");
 return '<div class="two-col"><div class="form-card"><h3>Review tháng · 30 phút</h3><p class="tagline">'+(selectedYear===2026?'Review 2026: Biomedia, business, freelance, learning, health, finance, creative và family.':'Review 2027: business economics, MBA, Chinese, cash reserve, training, relationships và capacity.')+'</p><form id="monthly-form">'+
 '<label>Tháng review<input type="month" name="month" value="'+now+'" required></label>'+
 '<label>Trục ưu tiên<select name="pillar">'+opt()+'</select></label>'+
 '<label>Kết quả & bằng chứng<textarea name="progress" required placeholder="Các kết quả quan trọng, bằng chứng và điểm lệch kế hoạch"></textarea></label>'+
 '<label>Bài học<textarea name="lessons" placeholder="Điều gì thực sự hiệu quả / không hiệu quả?"></textarea></label>'+
 '<label>Quyết định tháng tới<textarea name="next" placeholder="Continue / Accelerate / Pause"></textarea></label>'+
 '<label>Capacity & sustainability<textarea name="capacity" placeholder="Workload, MBA, health, relationships"></textarea></label>'+
 '<div class="section-header"><h3>Optional measured metrics</h3></div>'+
 '<div class="form-grid"><label>'+(selectedYear===2026?'Giờ học thực tế':'Giờ học MBA')+'<input type="number" min="0" max="300" step=".5" name="study" placeholder="Giờ thực học trong tháng"></label><label>Tỷ lệ tiết kiệm (%)<input type="number" min="-100" max="100" step=".1" name="saving" placeholder="Tỷ lệ thực tế trong tháng"></label><label>Quỹ dự phòng (tháng chi tiêu)<input type="number" min="0" step=".1" name="reserve" placeholder="Số tháng chi tiêu được bảo đảm"></label><label>Số buổi vận động<input type="number" min="0" max="100" step="1" name="workouts" placeholder="Số buổi thực tế"></label><label>Năng lượng (1–5)<input type="number" min="1" max="5" step="1" name="energy" placeholder="Tùy chọn"></label></div>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu review tháng</button></div></form></div>'+
 '<div><div class="section-header"><h3>Số liệu tháng · '+now+'</h3></div><div class="card">'+(monthMetrics||'<p class="info">Chưa có số liệu tháng này</p>')+'</div>'+heading("Lịch sử review tháng")+historyHtml("monthly",15)+'</div></div>';
}
function renderEvidence(){
 return '<div class="two-col"><div class="form-card"><h3>Ghi nhận bằng chứng</h3><p class="tagline">Tập trung vào thành tích, kỹ năng, quyết định đã được phép ghi nhận. Không tải tài liệu mật.</p><form id="evidence-form">'+
 '<div class="form-grid"><label>Ngày<input name="date" type="date" value="'+reviewDate()+'" required></label><label>Trục<select name="pillar">'+opt()+'</select></label></div>'+
 '<label>Tên bằng chứng<input name="title" placeholder="Ví dụ: Hoàn thành FY28 operating plan" required></label>'+
 '<label>Kết quả thực tế<textarea name="description" placeholder="Kết quả cụ thể và vai trò của bạn" required></textarea></label>'+
 '<label>Liên kết bằng chứng được phép lưu<input name="link" type="url" placeholder="https://... (tùy chọn)"></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu bằng chứng</button></div></form></div>'+
 '<div>'+heading("Lịch sử bằng chứng")+historyHtml("evidence",30)+'</div></div>';
}
function renderDecision(){
 return '<div class="two-col"><div class="form-card"><h3>Nhật ký quyết định</h3><p class="tagline">Ghi lại vì sao bạn quyết định và khi nào cần kiểm tra kết quả.</p><form id="decision-form">'+
 '<div class="form-grid"><label>Ngày<input name="date" type="date" value="'+reviewDate()+'" required></label><label>Trục<select name="pillar">'+opt()+'</select></label></div>'+
 '<label>Tên quyết định<input name="title" placeholder="Vấn đề / quyết định" required></label>'+
 '<label>Context<textarea name="context" required placeholder="Lý do, dữ liệu, lựa chọn và rủi ro"></textarea></label>'+
 '<label>Lựa chọn cuối cùng<textarea name="choice" required placeholder="Quyết định cuối cùng"></textarea></label>'+
 '<label>Khi nào cần xem lại<textarea name="followup" placeholder="Điều kiện hoặc thời điểm review lại"></textarea></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu quyết định</button></div></form></div>'+
 '<div>'+heading("Lịch sử quyết định")+historyHtml("decision",30)+'</div></div>';
}
function sourceHealth(){
 const all=notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))),w=selectedWeek();
 const duplicatePeriods=new Map();all.forEach(x=>duplicatePeriods.set(x.week_start,(duplicatePeriods.get(x.week_start)||0)+1));
 const duplicateCount=[...duplicatePeriods.values()].filter(n=>n>1).length;
 return '<section class="page-intro"><h1>Nguồn & cài đặt</h1><p>Hiển thị nguồn, mốc đồng bộ và khoảng trống. Không mặc định lịch chạy đồng nghĩa đồng bộ thành công.</p></section>'+dataBanner(w)+'<div class="panel source-health"><h3>Luồng dữ liệu hiện tại</h3><div class="source-step"><b>01 · OneNote</b><span>Mục tiêu năm · chỉ đối chiếu đúng năm '+selectedYear+'</span></div><div class="source-step"><b>02 · Notion Weekly Planner</b><span>Kế hoạch tuần + Daily Activity Log · nguồn chính</span></div><div class="source-step"><b>03 · Personal OS</b><span>Snapshot dùng chung cho Daily và Weekly · tải lại mỗi 60 giây khi đang mở</span></div><p class="info">'+all.length+' trang đã nhập · '+duplicateCount+' khoảng tuần có nhiều trang. Những tuần chưa xác định bản chính được loại khỏi rollup.</p><details><summary>Quy tắc đồng bộ và giới hạn</summary><p class="info">Daily Check-in 22:00, Weekly Sync thứ Hai 08:00 theo cấu hình hiện có. App chỉ đọc snapshot và không xác minh được lần chạy kế tiếp. Nút Tải lại không kéo trực tiếp Notion. Bản ghi thiếu ngày không được gán vào Daily. Các nguồn tuần trùng cần đối chiếu trước khi cộng kết quả.</p></details><button class="btn soft" data-view="notion">Xem toàn bộ dữ liệu nguồn</button></div>';
}
function renderSettings(){
 return sourceHealth()+'<div class="two-col"><div class="form-card"><h3>Định hướng & nguồn dữ liệu</h3><p class="tagline">OneNote giữ mục tiêu cấp năm. Notion giữ kế hoạch tuần. App hiển thị snapshot đã đồng bộ, không tự đổi cam kết của bạn.</p><form id="settings-form">'+
 '<label>Liên kết mục tiêu OneNote<input name="onenote_url" type="url" placeholder="https://..." value="'+safe(settings?.onenote_url||sourceForYear())+'"></label>'+
 '<label>Định hướng dài hạn<input name="north_star" type="text" value="'+safe(settings?.north_star||"GM / Country Manager 2031")+'"></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu cài đặt</button></div></form></div>'+
 '<div class="stack"><div class="card"><h3>Sao lưu dữ liệu cá nhân</h3><p>Xuất dữ liệu thành JSON để tự lưu bản sao lưu. File này chứa nội dung riêng tư, hãy bảo quản cẩn thận.</p><button class="btn soft" id="export-data">Tải bản sao dữ liệu</button></div><div class="card danger-zone"><h3>Quyền riêng tư</h3><p>Dữ liệu cá nhân chỉ hiển thị sau khi đăng nhập. Bạn có thể tải bản sao dữ liệu để lưu trữ riêng.</p><p>ChatGPT xử lý cập nhật qua các automation đã thiết lập. App không tự thay đổi kế hoạch trên Notion.</p></div></div></div>';
}
const ganttState={quarter:null,query:'',axis:'all',status:'all',kind:'execution',zoom:'quarter',layout:'auto',collapsed:[],expanded:[]};
function ganttModel(){return buildGanttModel({year:selectedYear,quarter:ganttState.quarter??Math.floor((Number(dateNow().slice(5,7))-1)/3),weeks:notionWeeks,axes:yearPillars(),yearPlan,blueprint:BLUEPRINT,metrics,today:dateNow()});}
function renderGantt(){if(loadingData&&!notionWeeks.length)return '<div class="loading-state">Đang tải timeline và kế hoạch quý…</div>';return (loadError?'<div class="data-banner" role="status">'+safe(loadError)+'</div>':'')+renderGanttSurface(ganttModel(),ganttState);}
function ganttDialog(title,body){const d=$('#detail-dialog');$('#detail-content').innerHTML='<div class="gp-inspector"><h2 id="detail-title">'+safe(title)+'</h2>'+body+'</div>';if(!d.open)d.showModal();}
function ganttTaskDetail(t){if(!t)return;ganttDialog(t.name,'<div class="gp-inspector-status">'+statusPill(t.source)+'</div><dl class="detail-metadata"><div><dt>Phạm vi ngày</dt><dd>'+safe(dtext(t.start)+' — '+dtext(t.end))+'</dd></div><div><dt>Độ chính xác</dt><dd>'+safe(t.dateMeaning)+'</dd></div><div><dt>Thuộc Planner</dt><dd>'+safe(dtext(t.weekStart)+' — '+dtext(t.weekEnd))+'</dd></div><div><dt>Trục gốc → hiển thị</dt><dd>'+safe(t.provenance.axis+' → '+pName(t.axis))+'</dd></div><div><dt>Nguồn trạng thái</dt><dd>Snapshot Notion · '+safe(t.provenance.coverage)+'</dd></div></dl><div class="detail-context"><b>Bối cảnh từ nguồn</b><p>'+safe(t.context||'Chưa có thêm bối cảnh.')+'</p></div>'+t.diagnostics.map(x=>'<p class="gp-inspector-warning">'+safe(x)+'</p>').join('')+'<p class="info">Ngày ghi nhận không tự xác định thời điểm bắt đầu, hoàn thành hoặc deadline. Ghi nhận ở tuần cũ chưa chắc phản ánh trạng thái hiện tại.</p><button class="btn soft" data-gantt-action="axis" data-gantt-id="'+safe(t.axis)+'">Đối chiếu kế hoạch quý '+icon('target')+'</button> '+(notionUrl(t.url)?'<a class="btn primary" href="'+safe(notionUrl(t.url))+'" target="_blank" rel="noopener noreferrer">Mở nguồn Notion '+icon('arrow')+'</a>':''));}
function ganttAxisDetail(g,m){if(!g)return;const review=g.review&&m.reviewFresh?'<section class="gp-inspector-review"><h3>Review hỗ trợ · '+safe(m.review.reviewed_at.slice(0,10))+'</h3><b>'+safe(g.review.headline)+'</b><p>'+safe(g.review.gap)+'</p><p><strong>Bước đề xuất:</strong> '+safe(g.review.next_action)+'</p><small>Diễn giải từ nguồn; không thay đổi cam kết hoặc xác nhận hoàn thành KR.</small></section>':'';ganttDialog(g.name+' · Q'+(m.range.q+1)+' '+m.range.year,'<div class="gp-inspector-stats"><span><b>'+g.counts.reported_done+'</b>Tự báo đã làm</span><span><b>'+g.counts.blocked+'</b>Ghi nhận vướng</span><span><b>'+g.metrics.length+'</b>Số đo quý</span></div>'+review+'<section><h3>Kế hoạch gốc của quý</h3><p class="preserve-lines">'+safe(g.planText||'Chưa có cam kết quý được nhập.')+'</p></section><details class="gp-inspector-krs"><summary>Mục tiêu năm & '+g.krs.length+' KR tham chiếu</summary><p>'+safe(g.objective)+'</p><ul>'+g.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul></details><section><h3>Điều chỉnh / để sau trong Planner hiện hành</h3>'+(g.stops.length?g.stops.map(t=>'<button class="gp-inspector-task" data-gantt-action="task" data-gantt-id="'+safe(t.id)+'">'+safe(t.name)+'</button>').join(''):'<p>Chưa có mục để sau trong nguồn tuần mới nhất đã nhập.</p>')+'</section><section><h3>Ghi nhận liên quan theo trục</h3><p class="info">Liên quan cùng trục, chưa phải bằng chứng nghiệm thu từng KR.</p>'+g.observations.slice().sort((a,b)=>b.start.localeCompare(a.start)).map(t=>'<button class="gp-inspector-task" data-gantt-action="task" data-gantt-id="'+safe(t.id)+'"><small>'+safe(dtext(t.start))+' · '+safe(STATUS_META[t.status].label)+' · '+(t.precision==='week'?'cấp tuần':'có ngày')+'</small><span>'+safe(t.name)+'</span>'+icon('chevron')+'</button>').join('')+(!g.observations.length?'<p>Chưa có bằng chứng được nhập cho quý này; không mặc định là chưa thực hiện.</p>':'')+'</section><section><h3>Khoảng cách định lượng</h3>'+(g.metrics.length?g.metrics.map(x=>'<div class="metric-row"><span>'+safe(x.metric_key)+'</span><strong>'+safe(x.metric_value)+' '+safe(x.unit)+'</strong></div>').join('')+'<p class="info">Cần target và actual cùng đơn vị, kỳ đo và KR. Không tính % từ số activity.</p>':'<p>Chưa có số đo quý trong hệ thống. Cần giá trị thực, mục tiêu và kỳ đo cùng định nghĩa.</p>')+'</section>');}
function handleGanttAction(action,id){const m=ganttModel();
 if(action==='quarter'){ganttState.quarter=Number(id);ganttState.collapsed=[];ganttState.expanded=[];render();return;}
 if(action==='zoom'){ganttState.zoom=id;const y=$('#gantt-scroll')?.scrollTop||0;render();if($('#gantt-scroll'))$('#gantt-scroll').scrollTop=y;return;}
 if(action==='layout'){ganttState.layout=id;render();return;}
 if(action==='group'){ganttState.collapsed=ganttState.collapsed.includes(id)?ganttState.collapsed.filter(x=>x!==id):[...ganttState.collapsed,id];const x=$('#gantt-scroll')?.scrollLeft||0,y=$('#gantt-scroll')?.scrollTop||0;render();if($('#gantt-scroll')){$('#gantt-scroll').scrollLeft=x;$('#gantt-scroll').scrollTop=y;}return;}
 if(action==='more'){ganttState.expanded=[...new Set([...ganttState.expanded,id])];const x=$('#gantt-scroll')?.scrollLeft||0,y=$('#gantt-scroll')?.scrollTop||0;render();if($('#gantt-scroll')){$('#gantt-scroll').scrollLeft=x;$('#gantt-scroll').scrollTop=y;}return;}
 if(action==='expand'){ganttState.collapsed=[];ganttState.expanded=m.groups.map(g=>g.id);render();return;}
 if(action==='collapse'){ganttState.collapsed=m.groups.map(g=>g.id);render();return;}
 if(action==='today'){if(selectedYear!==Number(dateNow().slice(0,4))){toast('Chọn năm hiện tại ở thanh trên để trở về hôm nay.');return;}ganttState.quarter=Math.floor((Number(dateNow().slice(5,7))-1)/3);ganttState.layout='timeline';render();const next=ganttModel(),sc=$('#gantt-scroll');if(sc){const day=Math.max(0,Math.min(next.range.days-1,next.range.days-next.remaining-1)),track=sc.querySelector('.gp-calendar-time'),label=sc.querySelector('.gp-calendar-head .gp-frozen');const dayWidth=(track?.getBoundingClientRect().width||0)/next.range.days;sc.scrollLeft=Math.max(0,(day+.5)*dayWidth-(sc.clientWidth-(label?.getBoundingClientRect().width||0))/2);}return;}
 if(action==='milestone'){const v=m.milestones.find(x=>x.id===id);if(v)ganttDialog(v.name,'<div class="gp-inspector-review"><b>'+safe(dtext(v.date))+' · '+safe(v.label)+'</b><p>'+safe(v.note)+'</p><small>Mốc được trích rõ từ nguồn trong review '+safe(m.review.reviewed_at)+'. Không cộng vào số ghi nhận thực thi và không coi là hoàn thành.</small></div><p class="info">Planner nguồn: tuần '+safe(dtext(v.source_week))+'. Source ID: '+safe(v.source_id)+'</p><a class="btn primary" href="'+safe(notionUrl(v.source_url))+'" target="_blank" rel="noopener noreferrer">Mở nguồn Notion '+icon('arrow')+'</a>');return;}
 if(action==='task'){ganttTaskDetail(m.tasks.find(t=>t.id===id));return;}
 if(action==='axis'){ganttAxisDetail(m.groups.find(g=>g.id===id),m);return;}
 if(action==='filter-blocked'){ganttState.axis='all';ganttState.query='';ganttState.status='blocked';ganttState.kind='execution';ganttState.expanded=m.groups.map(g=>g.id);ganttState.collapsed=[];render();$('#gantt-results')?.scrollIntoView({block:'start'});return;}
 if(action==='boundary'){ganttDialog('Ghi nhận chưa phân bổ được vào quý','<p class="info">'+m.boundaryUncertain.length+' ghi nhận thuộc tuần vắt qua hai quý và chưa có ngày cụ thể. Vẫn hiển thị trên timeline để giữ lịch sử, nhưng không cộng vào tổng bằng chứng Q'+(m.range.q+1)+'.</p>'+m.boundaryUncertain.map(t=>'<button class="gp-inspector-task" data-gantt-action="task" data-gantt-id="'+safe(t.id)+'"><small>'+safe(dtext(t.start)+' — '+dtext(t.end))+'</small><span>'+safe(t.name)+'</span></button>').join(''));return;}
 if(action==='filter-week'){const tasks=m.execution.filter(t=>t.precision==='week');ganttDialog('Ghi nhận chỉ biết phạm vi tuần','<p class="info">'+tasks.length+' ghi nhận thực thi trong toàn quý. Không biến phạm vi tuần thành thời lượng công việc.</p>'+tasks.map(t=>'<button class="gp-inspector-task" data-gantt-action="task" data-gantt-id="'+safe(t.id)+'"><small>'+safe(dtext(t.start)+' — '+dtext(t.end))+'</small><span>'+safe(t.name)+'</span></button>').join(''));return;}
 if(action==='context'){ganttState.kind='context';ganttState.status='all';ganttState.collapsed=[];ganttState.expanded=m.groups.map(g=>g.id);render();$('#gantt-results')?.scrollIntoView({block:'start'});return;}
 if(action==='measures'){ganttDialog('Số đo quý & điều kiện tính gap','<p>'+m.quarterMetrics.length+' số đo được nhập cho Q'+(m.range.q+1)+'.</p>'+m.groups.map(g=>'<button class="gp-inspector-task" data-gantt-action="axis" data-gantt-id="'+safe(g.id)+'"><span>'+safe(g.name)+'</span><b>'+g.metrics.length+' số đo</b></button>').join('')+'<p class="info">Chỉ tính gap khi actual, target, đơn vị và kỳ đo đã khớp. Số task hoặc thời gian quý trôi qua không thay thế mức đạt KR.</p>');return;}
 if(action==='plan-source'){const url=selectedYear===2026?m.planSource.url:SOURCE.url;ganttDialog('Nguồn kế hoạch quý','<p>'+safe(m.planSource.title)+'</p><p>Snapshot kế hoạch được đọc '+safe(m.planSource.checkedAt.slice(0,10))+'. Q1–Q3 có cả kế hoạch và lịch sử; không tự coi mọi dòng là thành tích.</p>'+(url?'<a class="btn primary" href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">Mở OneNote '+icon('arrow')+'</a>':'<p>Chưa có kế hoạch năm được nhập.</p>')+m.warnings.map(w=>'<p class="info">'+safe(w)+'</p>').join(''));return;}
 if(action==='sources'||action==='source'){const slots=action==='source'?m.slots.filter(s=>s.start===id):m.slots;ganttDialog('Độ phủ nguồn · Q'+(m.range.q+1),'<p class="info">Đủ nguồn nghĩa là đã đọc đầy đủ phạm vi Planner, không phải hoàn thành công việc. Nguồn tuần tương lai vẫn là kế hoạch.</p>'+slots.map(s=>'<section class="gp-inspector-source"><b>Tuần '+safe(dtext(s.start))+'</b><span>'+safe({missing:'Chưa có nguồn',conflict:'Có xung đột · đã loại khỏi tổng',complete:'Nguồn đầy đủ',partial:'Nguồn một phần'}[s.state])+'</span>'+notionWeeks.filter(w=>w.week_start===s.start).map(w=>'<a class="inline-link" href="'+safe(notionUrl(w.source_url))+'" target="_blank" rel="noopener noreferrer">'+safe(w.title)+' ↗</a><small>Đồng bộ '+safe(w.synced_at?.slice(0,16).replace('T',' '))+' UTC</small>').join('')+'</section>').join(''));return;}
 if(action==='export'){const tasks=filterGanttTasks(m,ganttState),blob=new Blob([ganttCsv(m,tasks)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PersonalOS-Gantt-'+selectedYear+'-Q'+(m.range.q+1)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất '+tasks.length+' ghi nhận theo bộ lọc, gồm nguồn và độ chính xác ngày.');return;}
 if(action==='help'){ganttDialog('Cách đọc Gantt Pro','<div class="gp-help-list"><section><h3>1. Kế hoạch quý</h3><p>Đường chấm là cửa sổ quý từ OneNote, không phải một task kéo dài cả quý. Q1–Q3 có thể chứa lịch sử và kế hoạch trộn lẫn.</p></section><section><h3>2. Mốc ngày & phạm vi tuần</h3><p>Hình thoi = ngày ghi nhận chính xác. Thanh viền = chỉ biết thuộc tuần; không suy ra bắt đầu/kết thúc hoặc trễ hạn. Ngày trong nội dung câu chữ chưa tự biến thành mốc.</p></section><section><h3>3. Trạng thái có phạm vi nguồn</h3><p>Tự báo / xác minh / vướng / kế hoạch được giữ theo từng snapshot. Các ghi nhận tuần cũ không mặc nhiên là trạng thái hiện tại. Summary và Daily không cộng thêm lần nữa.</p></section><section><h3>4. Gap quý</h3><p>So cam kết gốc, hoạt động cùng trục, thay đổi ưu tiên và số đo. Review hỗ trợ ẩn khi nguồn đổi. Chỉ xác nhận đạt KR khi có bằng chứng gắn đúng KR.</p></section><section><h3>5. Không tự lập lịch</h3><p>Không kéo thanh để sửa nguồn, không tự tạo dependency hay critical path. Dùng Notion để thay đổi lịch và đồng bộ lại. Tab, Enter và Space mở chi tiết; cuộn ngang bằng bàn phím trong vùng timeline.</p></section></div>');}
}
let ganttSearchTimer;
document.addEventListener('input',e=>{if(e.target.id!=='gantt-query')return;ganttState.query=e.target.value;clearTimeout(ganttSearchTimer);ganttSearchTimer=setTimeout(()=>{if(currentView!=='gantt')return;const m=ganttModel(),sc=$('#gantt-scroll'),left=sc?.scrollLeft||0,top=sc?.scrollTop||0;$('#gantt-results').innerHTML=renderGanttTimeline(m,ganttState)+renderGanttAgenda(m,ganttState);$('#gantt-match-count').textContent=filterGanttTasks(m,ganttState).length+' ghi nhận phù hợp · bộ lọc đang áp dụng';if($('#gantt-scroll')){$('#gantt-scroll').scrollLeft=left;$('#gantt-scroll').scrollTop=top;}},120);});

const progressState={mode:'overview',checkpointId:null,compareId:null};
function progressModel(){return buildProgressModel({rows:progressSnapshots,year:selectedYear,today:dateNow(),axes:yearPillars(),yearPlan,blueprint:BLUEPRINT,weeks:notionWeeks,checkpointId:progressState.checkpointId,compareId:progressState.compareId,mode:progressState.mode});}
function renderProgressTab(){if(loadingData&&!progressSnapshots.length)return '<div class="loading-state">Đang tải các mốc đánh giá…</div>';return (progressError?'<div class="data-banner" role="status">'+safe(progressError)+'</div>':'')+renderProgress(progressModel(),progressState);}
function progressDialog(title,body){const d=$('#detail-dialog');$('#detail-content').innerHTML='<div class="pr-detail"><h2 id="detail-title">'+safe(title)+'</h2>'+body+'</div>';if(!d.open)d.showModal();}
function progressScore(level,known,total,date){return '<div class="pr-detail-score"><b>'+(validProgressLevel(level)?level+'/4':'—')+'</b><div><span>'+(validProgressLevel(level)?PROGRESS_LEVELS[level].label:'Chưa đủ bằng chứng để tổng hợp')+'</span><small>'+known+'/'+total+' chiều được đánh giá · '+safe(date)+'</small></div></div>';}
function progressAxisDetail(id){const m=progressModel(),g=m.groups.find(g=>g.id===id);if(!g)return;progressDialog(g.shortName+' · '+m.year,progressScore(g.summary.level,g.summary.known,g.summary.total,checkpointLabel(m.selected))+'<p>Điểm tổng hợp dùng trung vị dưới, cần ít nhất '+g.summary.required+'/'+g.summary.total+' chiều có bằng chứng. Không dùng dữ liệu thiếu như điểm 0.</p>'+renderRadarCard({id:'progress-detail-'+id,title:g.shortName,subtitle:'Bấm vào từng chiều để xem bằng chứng',dimensions:facetDimensions(g.facets),scope:'axis',group:id,date:checkpointLabel(m.selected),previousDate:m.comparison?checkpointLabel(m.comparison):''})+'<h3>Các chiều đánh giá</h3>'+g.facets.map(f=>'<button class="pr-facet-row" data-progress-action="dimension" data-scope="axis" data-group="'+safe(id)+'" data-dimension="'+safe(f.id)+'"><span>'+safe(f.label)+'</span><b>'+(validProgressLevel(f.value.level)?f.value.level+'/4':'Chưa rõ')+'</b>'+icon('chevron')+'</button>').join('')+'<h3>Mục tiêu năm được đối chiếu</h3><p class="preserve-lines">'+safe(g.objective||'Chưa có mục tiêu của năm được nhập.')+'</p><ul>'+g.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul>');}
function progressDimensionDetail(scope,group,id){const m=progressModel();if(scope==='annual'){progressAxisDetail(id);return;}const g=scope==='horizon'?m.horizon:m.groups.find(g=>g.id===group),f=g?.facets.find(f=>f.id===id);if(!f)return;const s=scope==='horizon'?m.horizon.selected:m.selected,old=scope==='horizon'?m.horizon.comparison:m.comparison,delta=progressDelta(f.value.level,f.previous.level);progressDialog(f.label,progressScore(f.value.level,validProgressLevel(f.value.level)?1:0,1,checkpointLabel(s))+'<p>'+safe(f.value.rationale||'Chưa đủ dữ liệu đúng tiêu chí trong nguồn đã đọc. Chưa có bằng chứng không đồng nghĩa là không tiến bộ.')+'</p>'+(old&&delta!==null?'<p><b>So với '+safe(checkpointLabel(old))+':</b> '+(delta>0?'Tăng '+delta+' bậc':delta<0?'Giảm '+Math.abs(delta)+' bậc':'Giữ nguyên mức đánh giá')+'. Đây là thay đổi đánh giá định tính theo cùng rubric.</p>':'<p>Chưa có hai mức đánh giá đủ điều kiện để so sánh chiều này.</p>')+'<h3>Bằng chứng đã dùng</h3>'+(f.value.sources.length?f.value.sources.map(src=>'<div class="pr-proof"><b>'+safe(src.title||src.type||'Nguồn')+'</b><p>'+safe(src.excerpt||'Tham chiếu nguồn gốc')+'</p><small>'+(src.observed_on?'Ngày ghi nhận: '+safe(src.observed_on):src.week_start?'Chỉ biết tuần: '+safe(src.week_start):'Nguồn tham chiếu năm; ngày thực hiện chưa xác định')+'</small><small>Độ phủ: '+safe(src.coverage||'chưa xác định')+' · Mức bằng chứng: '+safe(f.value.confidence==='verified'?'có xác minh trong phạm vi ghi nhận':'nguồn tự báo / tham chiếu')+'</small><a href="'+safe(/^https:\/\//.test(src.url)?src.url:'')+'" target="_blank" rel="noopener noreferrer">Mở nguồn '+icon('arrow')+'</a></div>').join(''):'<p>Chưa có bằng chứng đủ điều kiện cho chiều này.</p>')+'<h3>Bằng chứng tiếp theo cần có</h3><p class="pr-next-evidence">'+safe(f.value.next_evidence||f.target)+'</p><h3>Chuẩn đích của chiều này</h3><p>'+safe(f.target)+'</p><p class="info">Mức 4 là chuẩn của rubric, không phải percentile, % hoàn thành KR hoặc % sẵn sàng làm GM. Điểm được đánh giá lại khi có bằng chứng mới; không tự tăng theo số task.</p>');}
function progressDownload(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function handleProgressAction(action,data={}){
 if(action==='mode'){progressState.mode=['overview','axes','horizon'].includes(data.mode)?data.mode:'overview';progressState.checkpointId=null;progressState.compareId=null;render();return;}
 if(action==='checkpoint'){progressState.checkpointId=data.checkpoint;progressState.compareId=null;render();return;}
 if(action==='axis'){progressAxisDetail(data.group);return;}
 if(action==='dimension'){progressDimensionDetail(data.scope,data.group,data.dimension);return;}
 if(action==='export-json'){const s=progressModel().selected;if(!s){toast('Chưa có checkpoint trong phạm vi đang xem.');return;}progressDownload(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),'PersonalOS-Progress-'+s.as_of+'.json');return;}
 if(action==='svg'){const host=document.getElementById(data.chart+'-desktop')||document.getElementById(data.chart+'-mini')||document.getElementById(data.chart+'-mobile');if(!host)return;const clone=host.cloneNode(true);clone.setAttribute('width',host.viewBox.baseVal.width);clone.setAttribute('height',host.viewBox.baseVal.height);const title=document.createElementNS('http://www.w3.org/2000/svg','text');title.setAttribute('x','15');title.setAttribute('y','18');title.setAttribute('font-family','Segoe UI,Arial,sans-serif');title.setAttribute('font-size','11');title.setAttribute('fill','#596b83');title.textContent=(host.querySelector('title')?.textContent||'Bản đồ tiến bộ')+' · '+(host.dataset.checkpointDate||checkpointLabel(progressModel().selected));clone.appendChild(title);clone.querySelectorAll('[tabindex]').forEach(n=>n.removeAttribute('tabindex'));progressDownload(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}),'PersonalOS-'+data.chart+'.svg');return;}
 if(action==='checkpoint-request'){void navigator.clipboard.writeText('Lumi, hãy tạo checkpoint Bản đồ tiến bộ mới cho Personal OS từ dữ liệu đã xác nhận mới nhất. Đọc rubric evidence-v1 tại enexiaplatform/PersonalOS/apps/personal-os-v1/progress-rubric.mjs và hướng dẫn progress-checkpoints.md. Đối chiếu mục tiêu OneNote đúng năm và Notion snapshot canonical; không suy điểm từ tick/task count. Đọc checkpoint trước, chấm từng facet có rationale, next_evidence và nguồn; thiếu dữ liệu = null. Lưu append-only vào personal_os_progress_snapshots, không ghi đè lịch sử; xác minh đọc lại. Không tự đổi kế hoạch hoặc cam kết.').then(()=>toast('Đã sao chép yêu cầu. Dán vào ChatGPT để thực hiện review và lưu mốc mới.')).catch(()=>toast('Không sao chép được. Yêu cầu ChatGPT tạo checkpoint tiến bộ từ bằng chứng mới nhất.'));return;}
 if(action==='method'){progressDialog('Cách đọc bản đồ tiến bộ','<p>Đây là đánh giá định tính theo bằng chứng của riêng bạn, không xếp hạng so với người khác.</p>'+PROGRESS_LEVELS.map(l=>'<section class="pr-method-level"><b>'+l.value+' · '+safe(l.label)+'</b><p>'+safe(l.definition)+'</p></section>').join('')+'<h3>Điểm tổng hợp của một trục</h3><p>Mỗi trục có 5 chiều. Cần ít nhất 3/5 chiều có bằng chứng; sắp các mức tăng dần và lấy trung vị dưới. Ví dụ 1, 2, 2, 3 → 2. Thiếu dữ liệu không được tính là 0 và không được nối kín radar.</p><h3>So sánh qua thời gian</h3><p>Chỉ chồng các mốc dùng cùng rubric. Mục tiêu năm phải cùng năm và cùng phiên bản mục tiêu. Các mốc cũ được giữ riêng; thay đổi nguồn không tự thay đổi điểm cũ. Đánh giá 2031 theo chuẩn scope GM, không dùng % thăng chức.</p><h3>Cách cập nhật</h3><p>Daily / Weekly giữ dữ liệu thực tế trong Notion. Sau buổi review tuần đã đủ thông tin, workflow đánh giá sẽ lưu checkpoint mới. Không cộng Daily thêm lần nữa vào Weekly và không biến số buổi học / số task thành năng lực.</p><p>Chất lượng nghỉ ngơi, quan hệ và mức phục hồi cần tự xác nhận; không suy từ checklist. Mỗi facet có thể bấm để xem lý do, nguồn và bằng chứng tiếp theo cần có.</p>');}
}
document.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key)||e.target.tagName?.toLowerCase()!=='g')return;const target=e.target.closest('[data-progress-action]');if(target){e.preventDefault();handleProgressAction(target.dataset.progressAction,target.dataset);}});

function render(){
 if(!user)return;
 document.body.dataset.workspace=workspace;
 document.querySelectorAll('.workspace-bar [data-workspace]').forEach(b=>{const active=b.dataset.workspace===workspace;b.classList.toggle('selected',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 void gateway.open(workspace);
 if(workspace!=='personal'){$('#view-content').innerHTML=workspace==='home'?renderWorkspaceHome({escape:safe,metadata:moduleMetadata,weekCount:loadingData?null:notionWeeks.length,last:lastWorkspace}):'';$('#page-title').textContent=MODULES[workspace]?.name||'Không gian';return;}
 history.replaceState(null,'','#personal/'+currentView);

 const previousGanttKey=$('.gantt-pro')?.dataset?.ganttKey,previousGanttScroll=$('#gantt-scroll'),ganttScrollState=previousGanttScroll?{x:previousGanttScroll.scrollLeft,y:previousGanttScroll.scrollTop}:null;
 $("#page-title").textContent=currentView==='overview'?"Tổng quan":currentView==='blueprint'?"Mục tiêu "+selectedYear:viewNames[currentView]||"Personal OS";
 $('#os-year').value=String(selectedYear);
 if($('.year-picker'))$('.year-picker').style.display=currentView==='calendar'?'none':'';
 if($('#mobile-view'))$('#mobile-view').value=['notion','weekly','monthly','evidence','decision'].includes(currentView)?'review':currentView;
 $('#blueprint-label').textContent='Mục tiêu '+selectedYear;
 document.querySelectorAll("#nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView||b.dataset.view==='review'&&['notion','weekly','monthly','evidence','decision'].includes(currentView)));
 const fn={calendar:()=>'',progress:renderProgressTab,gantt:renderGantt,life:renderLife,business:renderBusiness,review:renderReviewHub,notion:renderNotion,blueprint:renderBlueprint,overview:()=>'<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn" data-view="calendar">▦ Mở lịch công việc tuần →</button></div>'+renderOverview(),weekly:renderWeekly,monthly:renderMonthly,evidence:renderEvidence,decision:renderDecision,settings:renderSettings}[currentView]||renderOverview;
 detailRegistry.clear();
 $("#view-content").innerHTML=fn();
 if(currentView==='calendar')void calendarController.mount();
 if(currentView==='gantt'&&ganttScrollState&&previousGanttKey===$('.gantt-pro')?.dataset?.ganttKey&&$('#gantt-scroll')){$('#gantt-scroll').scrollLeft=ganttScrollState.x;$('#gantt-scroll').scrollTop=ganttScrollState.y;}

}
async function signIn(mode){
 const email=$("#email").value.trim(),password=$("#password").value;
 if(!email){$("#auth-message").textContent="Nhập email để tiếp tục";return;}
 $("#auth-message").textContent="Đang xử lý...";
 try{
 let r;
 if(mode==="signup"){r=await db.auth.signUp({email,password});}
 else if(mode==="reset"){r=await db.auth.resetPasswordForEmail(email);}
 else{r=await db.auth.signInWithPassword({email,password});}
 if(r.error)throw r.error;
 $("#auth-message").textContent=mode==="signup"?"Kiểm tra email để xác thực tài khoản (nếu được yêu cầu).":mode==="reset"?"Đã gửi email khôi phục (nếu tài khoản tồn tại).":"Đăng nhập thành công.";
 }catch(e){$("#auth-message").textContent=e.message||"Đăng nhập thất bại";}
}
async function addMetrics(month,form){
 const values=[
 ["Revenue attainment",form.get("revenue"),"%","career"],
 ["Qualified pipeline coverage",form.get("pipeline"),"x","career"],
 ["Forecast error",form.get("forecast"),"%","career"],
 ["Productive distributors",form.get("partners"),"partners","career"],
 ["Emergency reserve coverage",form.get("reserve"),"months","finance"],
 ["Saving rate",form.get("saving"),"%","finance"],
 ["Training sessions",form.get("workouts"),"sessions","health"],
 [selectedYear===2026?"Giờ học thực tế":"Giờ học MBA",form.get("study"),"hours","education"],
 ["Energy",form.get("energy"),"/5","health"]];
 const rows=values.filter(v=>v[1]!==null&&String(v[1]).trim()!=="").map(v=>({owner_id:user.id,month_start:month+"-01",pillar:v[3],metric_key:v[0],metric_value:Number(v[1]),unit:v[2]}));
 if(!rows.length)return;
 const {error}=await db.from("personal_os_metrics").upsert(rows,{onConflict:"owner_id,month_start,pillar,metric_key"});
 if(error)throw error;
}
function reviewBrief(){
 const lastW=items("weekly").slice(0,4),lastM=items("monthly").slice(0,2),lastE=items("evidence").slice(0,7),lastD=items("decision").slice(0,7);
 const sections=[["Weekly",lastW],["Monthly",lastM],["Evidence",lastE],["Decisions",lastD]].map(([name,data])=>name+"\n"+data.map(x=>"- "+x.period_start+" ["+pName(x.pillar)+"] "+x.title+" "+JSON.stringify(x.content)).join("\n")).join("\n\n");
 return "Notion imports (nguồn tự ghi nhận; không suy đoán hoàn thành KR):\n"+JSON.stringify(notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))))+"\n\n"+"Bạn là Lumi, trợ lý và mentor. Đây là dữ liệu Personal OS do tôi tự lựa chọn chia sẻ. Hãy phân tích tiến độ, rủi ro, các quyết định, lệch kế hoạch và 3 ưu tiên tiếp theo. Không suy đoán số liệu còn thiếu. OneNote là nguồn mục tiêu năm, Notion là nguồn thực thi tuần. Mục tiêu năm "+selectedYear+" là Source of Truth. Chỉ đối chiếu dữ liệu cùng năm; không suy đoán hoàn thành KR từ task. Weekly phản tư không cộng thêm vào Daily. Đưa ra tối đa 3 Must-Win, 3 rủi ro, stop/defer và kế hoạch ngày có buffer; xin duyệt thay đổi cam kết quan trọng. Các trục: "+yearPillars().map(p=>p[1]).join(", ")+". Bản mục tiêu: "+JSON.stringify(selectedYear===2026?yearPlan?.plan:BLUEPRINT)+".\n\n"+sections;
}
function showAnalysis(title,subtitle,rows,extra=''){
 const d=$('#detail-dialog');$('#detail-content').innerHTML='<div class="analysis-detail-header"><span class="small-pill">PHÂN TÍCH TỪ NGUỒN</span><h2 id="detail-title">'+safe(title)+'</h2><p class="info">'+safe(subtitle)+'</p></div>'+extra+'<div class="analysis-records">'+(rows.length?rows.map(itemRow).join(''):extra?'':'<div class="empty-state"><p>Chưa có ghi nhận phù hợp trong nguồn đã đọc.</p></div>')+'</div><p class="detail-footnote">Dữ liệu một phần có thể chưa phản ánh toàn bộ thực tế. Ghi nhận hoạt động không xác nhận đạt KR.</p>';if(!d.open)d.showModal();}
function annualAxis(axis){return selectedYear===2026?yearPlan?.plan?.axes?.find(a=>a.id===axis):BLUEPRINT.find(a=>a.id===axis);}
function openAnalysis(type,filter={}){
 const m=currentAnalytics(),w=selectedWeek();
 if(type==='method'){showAnalysis('Cách đọc bản đồ tuần','Các biểu đồ dùng số ghi nhận, không dùng % hoàn thành mục tiêu.',[], '<ul class="method-list"><li><b>Tự báo đã làm:</b> người dùng hoặc nguồn đã ghi nhận hoạt động.</li><li><b>Đã xác minh:</b> chỉ các ghi nhận mang trạng thái verified_done; vẫn chưa tự xác nhận đạt KR.</li><li><b>Không có log:</b> chưa có bằng chứng được đồng bộ cho ngày đó.</li><li><b>Gap số đo:</b> chưa có số đo tháng để so sánh với mục tiêu.</li><li>Must-Win, rủi ro, stop/defer và summary là ngữ cảnh, không cộng thêm vào số ghi nhận thực thi.</li></ul>');return;}
 if(type==='priorities'){showAnalysis('Ưu tiên chưa có báo cáo kết quả','Trạng thái kế hoạch từ Weekly Planner; không suy hoàn thành từ các activity khác.',m.unreportedPriorities);return;}
 if(type==='risks'){showAnalysis('Điểm chờ từ Planner','Đây là rủi ro hoặc phụ thuộc cấp tuần, tách khỏi số ghi nhận bị chặn.',m.risks);return;}
 if(type==='coverage'){showAnalysis('Khoảng trống bằng chứng tuần',m.evidenceAxes+'/'+m.axisCount+' trục có hoạt động tự báo hoặc đã xác minh.',[], '<div class="coverage-axis-list">'+m.axisRows.map(a=>'<button data-analysis="axis" data-axis="'+safe(a.id)+'"><span>'+safe(axisLabel(a))+'</span><b>'+(a.hasEvidence?'Có bằng chứng hoạt động':'Chưa có báo làm')+'</b>'+icon('chevron')+'</button>').join('')+'</div>');return;}
 if(type==='measures'){
 const rows=filter.axis?m.monthMetrics.filter(x=>normalizePillar(x.pillar)===normalizePillar(filter.axis)):m.monthMetrics;
 const axes=filter.axis?m.axisRows.filter(a=>a.id===filter.axis):m.axisRows;
 const goal=axes.map(a=>{const ref=annualAxis(a.id);return '<details class="measurement-axis"><summary>'+safe(axisLabel(a))+'<span>'+a.metricCount+' số đo tháng</span></summary><p>'+safe(ref?.objective||'Chưa có mục tiêu năm được đọc cho trục này.')+'</p>'+(ref?.assessment?'<p class="info">'+safe(ref.assessment)+'</p>':'')+'</details>';}).join('');
 showAnalysis('Số đo mục tiêu · '+m.metricMonth,rows.length?'Số liệu đã nhập trong tháng, không cộng dồn giữa các tuần.':'Chưa có số đo tháng được nhập. Chưa tính được khoảng cách định lượng tới mục tiêu.',[],(rows.length?'<div class="metric-values">'+rows.map(x=>'<div><span>'+safe(x.metric_key)+'</span><b>'+safe(x.metric_value)+' '+safe(x.unit)+'</b></div>').join('')+'</div>':'')+'<div class="measurement-axes">'+goal+'</div>');return;
 }
 if(type==='undated'){showAnalysis('Ghi nhận chưa có ngày','Giữ ở cấp tuần; không gán vào một ngày theo suy đoán.',m.records.filter(i=>!explicitDate(i)));return;}
 const rows=filterAnalysisRecords(m,filter,selectedYear);
 if(type==='day'){showAnalysis('Ghi nhận ngày '+dtext(filter.date),'Chỉ hiển thị ghi nhận có ngày thực tế từ nguồn. Ngày thiếu log không có nghĩa là chưa làm.',rows);return;}
 const axis=m.axisRows.find(a=>a.id===filter.axis);const ref=axis?annualAxis(axis.id):null;
 const title=axis?axisLabel(axis):filter.status&&filter.status!=='all'?STATUS_META[filter.status]?.label||'Ghi nhận':'Tất cả ghi nhận thực thi';
 const extra=axis?'<div class="axis-detail-summary"><b>'+axis.total+' ghi nhận · '+axis.metricCount+' số đo tháng</b><p>'+safe(ref?.assessment||ref?.objective||'Chưa có đánh giá mục tiêu năm cho trục này.')+'</p></div>':'';
 showAnalysis(title,(w?'Tuần '+dtext(w.week_start)+' · ':'')+rows.length+' ghi nhận phù hợp. Must-Win và summary không cộng vào số này.',rows,extra);
}
function inspectSourceWeek(start){
 const raw=notionWeeks.filter(w=>w.week_start===start),canonical=canonicalWeeks(raw);
 if(canonical.length){window._weekStart=start;window._selectedDay=null;render();window.scrollTo(0,0);return;}
 showAnalysis('Nguồn tuần '+dtext(start),raw.length?'Có nhiều bản hoặc nguồn xung đột. Tạm loại khỏi các biểu đồ.':'Chưa có nguồn được đồng bộ cho tuần này.',[],raw.map(w=>'<div class="source-inspector"><b>'+safe(w.title)+'</b><p>'+safe((w.warnings||[]).join(' · '))+'</p>'+sourceLink(w)+'</div>').join(''));
}
function openDetail(key){const i=detailRegistry.get(key);if(!i){toast('Nguồn đã thay đổi. Hãy mở lại ghi nhận.');return;}
 $('#detail-content').innerHTML='<div class="detail-kind">'+statusPill(i)+'</div><h2 id="detail-title">'+safe({must_win:'Ưu tiên trong tuần',risk:'Điểm cần gỡ',stop:'Để sau tuần này',activity:'Ghi nhận hoạt động',outcome:'Kết quả ghi nhận'}[i.kind]||'Chi tiết ghi nhận')+'</h2><p class="detail-body">'+safe(i.text)+'</p><dl class="detail-metadata"><div><dt>Trục</dt><dd>'+safe(pName(i.pillar))+'</dd></div><div><dt>Ngày thực hiện</dt><dd>'+safe(explicitDate(i)?dtext(i.occurred_on):'Chưa có ngày cụ thể từ nguồn')+'</dd></div><div><dt>Tuần</dt><dd>'+safe(dtext(i.week_start))+'</dd></div></dl><div class="detail-context"><b>Bối cảnh từ nguồn</b><p>'+safe(i.context||'Chưa có thêm bối cảnh.')+'</p></div><a class="btn primary" href="'+safe(notionUrl(i.source_url))+'" target="_blank" rel="noopener noreferrer">Mở nguồn Notion '+icon('arrow')+'</a><p class="info detail-footnote">Nội dung được giữ theo nguồn. Xem chi tiết không thay đổi kế hoạch hoặc trạng thái công việc.</p>';
 if($('#command-dialog').open)$('#command-dialog').close();if(!$('#detail-dialog').open)$('#detail-dialog').showModal();}
function commandResults(){const query=$('#command-input').value.trim();const screens=[['overview','Tuần của tôi','calendar'],['gantt','Gantt Pro','gantt'],['progress','Bản đồ tiến bộ','radar'],['life','Nhịp sống','sun'],['business','Business cá nhân','bag'],['blueprint','Mục tiêu '+selectedYear,'target'],['review','Review & bằng chứng','review'],['settings','Nguồn & cài đặt','settings']];
 const matches=screens.filter(([,name])=>!query||name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
 const records=filterRecords(periodItems(notionWeeks,selectedYear),query);
 $('#command-results').innerHTML=(matches.length?'<div class="command-group-title">Mở màn hình</div>'+matches.map(([view,name,glyph])=>'<button class="command-result" data-view="'+view+'">'+icon(glyph)+'<span>'+safe(name)+'</span>'+icon('arrow')+'</button>').join(''):'')+(records.length?'<div class="command-group-title">Ghi nhận trong năm '+selectedYear+'</div>'+records.map(i=>'<button class="command-result result-record" data-detail="'+safe(detailKey(i))+'">'+icon('note')+'<span>'+safe(i.text)+'<small>'+safe(pName(i.pillar))+' · '+dtext(i.week_start)+'</small></span>'+icon('chevron')+'</button>').join(''):'')+(!matches.length&&!records.length?'<div class="empty-state small"><p>Không tìm thấy kết quả phù hợp.</p></div>':'');}
function openCommand(){if(!user)return;if($('#command-dialog').open){$('#command-input').focus();return;}$('#command-input').value='';commandResults();$('#command-dialog').showModal();$('#command-input').focus();}
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();return;}
 if($('#command-dialog').open&&['ArrowDown','ArrowUp','Enter'].includes(e.key)){
 const rows=[...document.querySelectorAll('#command-results button')];if(!rows.length)return;
 const index=rows.indexOf(document.activeElement);
 if(e.key==='Enter'&&document.activeElement===$('#command-input')){e.preventDefault();rows[0].click();return;}
 if(e.key!=='Enter'){e.preventDefault();const next=e.key==='ArrowDown'?(index+1)%rows.length:(index<=0?rows.length-1:index-1);rows[next].focus();}
 }
});
document.addEventListener('input',e=>{if(e.target.id==='command-input')commandResults();});

document.addEventListener("click",async e=>{
 const progressAction=e.target.closest('[data-progress-action]');if(progressAction){const action=progressAction.dataset.progressAction,data={...progressAction.dataset};handleProgressAction(action,data);if(!$('#detail-dialog').open&&['mode','checkpoint'].includes(action)){[...document.querySelectorAll('[data-progress-action]')].find(b=>b.dataset.progressAction===action&&(action==='mode'?b.dataset.mode===data.mode:b.dataset.checkpoint===data.checkpoint))?.focus({preventScroll:true});}return;}

 const ganttAction=e.target.closest('[data-gantt-action]');if(ganttAction){const action=ganttAction.dataset.ganttAction,id=ganttAction.dataset.ganttId;handleGanttAction(action,id);if(!$('#detail-dialog').open&&['quarter','zoom','group','layout','expand','collapse','more'].includes(action)){[...document.querySelectorAll('[data-gantt-action]')].find(b=>b.dataset.ganttAction===action&&b.dataset.ganttId===id)?.focus({preventScroll:true});}return;}

 const analytical=e.target.closest('[data-analysis]');if(analytical){openAnalysis(analytical.dataset.analysis,{axis:analytical.dataset.axis,status:analytical.dataset.status,date:analytical.dataset.date});return;}
 const sourceWeek=e.target.closest('[data-source-week]');if(sourceWeek){inspectSourceWeek(sourceWeek.dataset.sourceWeek);return;}

 const closer=e.target.closest('[data-close-dialog]');if(closer){$('#'+closer.dataset.closeDialog).close();return;}
 if(e.target.closest('#open-command')){openCommand();return;}
 const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail);return;}

 const dayButton=e.target.closest('[data-day]');if(dayButton){window._selectedDay=dayButton.dataset.day;render();openAnalysis('day',{date:dayButton.dataset.day});return;}
 if(e.target.closest('#copy-checkin')){try{await navigator.clipboard.writeText('Lumi, check-in hôm nay: 1. Kết quả thực tế nào đã tiến triển? 2. Việc gì còn vướng? 3. Học tập và vận động thế nào? 4. Năng lượng 1–5? 5. Ưu tiên số 1 ngày mai? Hãy đọc Weekly Planner hiện hành; sau khi tôi trả lời, ghi Notion và xác minh rồi đồng bộ cùng snapshot tuần trên Personal OS. Không tự đổi cam kết quan trọng.');toast('Đã sao chép câu hỏi. Dán vào ChatGPT để check-in.');}catch{toast('Không sao chép được. Hãy check-in trong ChatGPT.');}return;}

 if(e.target.closest("#reload-notion, #retry-year")){await refresh();return;}
 const aq=e.target.closest("[data-annual-quarter]");if(aq){window._annualQuarter=Number(aq.dataset.annualQuarter);render();return;}
 const mt=e.target.closest("[data-review-month]");if(mt){window._notionPeriod=mt.dataset.reviewMonth;window._notionMode='month';currentView='notion';render();return;}
 const qt=e.target.closest("[data-quarter]");if(qt){window._blueprintQuarter=Number(qt.dataset.quarter);render();return;}
 const nav=e.target.closest("[data-view]");if(nav){if($("#command-dialog").open)$("#command-dialog").close();currentView=nav.dataset.view;render();window.scrollTo(0,0);return;}
 const del=e.target.closest("[data-delete]");if(del){
 if(!confirm("Xóa bản ghi này? Thao tác không thể hoàn tác."))return;
 const {error}=await db.from("personal_os_entries").delete().eq("id",del.dataset.delete).eq("owner_id",user.id);
 if(error)notifyError(error);else{toast("Đã xóa bản ghi.");await refresh();}return;}
 if(e.target.closest("#copy-brief")){
 try{await navigator.clipboard.writeText(reviewBrief());toast("Đã sao chép. Bạn có thể dán vào ChatGPT để Lumi review.");}
 catch{toast("Trình duyệt chặn clipboard. Thử bằng HTTPS.");}return;}
 if(e.target.closest("#export-data")){
 const payload={selectedYear,yearPlan,progressSnapshots,notionWeeks:notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))),format:"henry-personal-os-v1",exported_at:new Date().toISOString(),entries:entries.filter(e=>e.period_start.startsWith(String(selectedYear))),metrics:metrics.filter(m=>m.month_start.startsWith(String(selectedYear))),settings};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="personal-os-backup-"+dateNow()+".json";a.click();URL.revokeObjectURL(url);toast("Đã tạo bản sao lưu. Lưu ở vị trí an toàn.");return;}
});
document.addEventListener("submit",async e=>{
 if(e.target.id==="auth-form"){e.preventDefault();await signIn("login");return;}
 const f=e.target;if(!["weekly-form","monthly-form","evidence-form","decision-form","settings-form"].includes(f.id))return;
 e.preventDefault();if(busy)return;const a=new FormData(f);
 try{
 if(f.id==="settings-form"){
 const url=String(a.get("onenote_url")||"").trim();if(url&&!/^https:\/\//.test(url))throw Error("OneNote URL phải bắt đầu bằng https://");
 const {error}=await db.from("personal_os_settings").upsert({owner_id:user.id,year:selectedYear,onenote_url:url||null,north_star:String(a.get("north_star")||"").trim()||"GM / Country Manager 2031"});
 if(error)throw error;toast("Đã lưu cấu hình.");await refresh();return;}
 if(f.id==="weekly-form") await saveEntry("weekly",a.get("date"),a.get("pillar"),"Weekly Pulse · "+a.get("date"),{wins:a.get("wins"),blocker:a.get("blocker"),next:a.get("next"),energy:a.get("energy")});
 if(f.id==="monthly-form"){
 const month=a.get("month");await saveEntry("monthly",month+"-01",a.get("pillar"),"Monthly Review · "+month,{progress:a.get("progress"),lessons:a.get("lessons"),next:a.get("next"),capacity:a.get("capacity")});
 await addMetrics(month,a);await refresh();}
 if(f.id==="evidence-form")await saveEntry("evidence",a.get("date"),a.get("pillar"),a.get("title"),{description:a.get("description"),link:a.get("link")});
 if(f.id==="decision-form")await saveEntry("decision",a.get("date"),a.get("pillar"),a.get("title"),{context:a.get("context"),choice:a.get("choice"),followup:a.get("followup")});
 }catch(err){notifyError(err);}
});
$("#signup-button").addEventListener("click",()=>signIn("signup"));
$("#reset-button").addEventListener("click",()=>signIn("reset"));
async function logout(){calendarController.clear();gateway.clear();await db.auth.signOut();user=null;entries=[];metrics=[];notionWeeks=[];yearPlan=null;progressSnapshots=[];progressError='';detailRegistry.clear();stateLogin(false);}
$("#logout-button").addEventListener("click",logout);
$("#workspace-logout").addEventListener("click",logout);
$("#mobile-logout").addEventListener("click",logout);
// Keep the auth callback synchronous: authenticated queries must run after
// Supabase releases its auth lock, otherwise getSession and data loads can deadlock.
db.auth.onAuthStateChange((event,session)=>{
 const was=user?.id;user=session?.user||null;if(!user||was&&was!==user.id)gateway.clear();stateLogin(Boolean(user));
 if(user&&was!==user.id){currentView=parseWorkspaceHash(location.hash).view||"overview";setTimeout(()=>{void refresh();void gateway.refreshMetadata();},0);}
});
(async()=>{const {data,error}=await db.auth.getSession();if(error)notifyError(error);user=data?.session?.user||null;stateLogin(Boolean(user));if(user){currentView=parseWorkspaceHash(location.hash).view||"overview";void refresh();void gateway.refreshMetadata();}})();

document.addEventListener("change",e=>{if(e.target.id==='progress-checkpoint'||e.target.id==='progress-compare'){const id=e.target.id;if(id==='progress-checkpoint'){progressState.checkpointId=e.target.value;progressState.compareId=null;}else progressState.compareId=e.target.value;render();$('#'+id)?.focus();return;}if(['gantt-axis','gantt-status','gantt-kind'].includes(e.target.id)){const controlId=e.target.id;ganttState[controlId.replace('gantt-','')]=e.target.value;render();$('#'+controlId)?.focus();return;}if(e.target.id==="mobile-view"){currentView=e.target.value;render();window.scrollTo(0,0);return;}if(e.target.id==="week-select"){window._weekStart=e.target.value;window._selectedDay=null;render();return;}if(e.target.id==="life-date"){if(!e.target.value.startsWith(String(selectedYear))){toast('Chọn năm ở thanh trên để xem dữ liệu năm khác.');render();return;}window._lifeDay=e.target.value;render();return;}if(e.target.id==="os-year"){selectedYear=Number(e.target.value)===2027?2027:2026;localStorage.setItem("henry-os-year",selectedYear);window._notionPeriod=monthNow();window._annualQuarter=undefined;ganttState.quarter=null;ganttState.axis='all';progressState.checkpointId=null;progressState.compareId=null;ganttState.collapsed=[];ganttState.expanded=[];window._weekStart=null;window._lifeDay=null;yearPlan=null;settings=null;refresh();return;}if(e.target.id==="notion-mode"){window._notionMode=e.target.value;render();}if(e.target.id==="notion-period"&&/^\d{4}-\d{2}$/.test(e.target.value)){if(!e.target.value.startsWith(String(selectedYear))){toast("Chọn năm ở thanh trên để chuyển toàn bộ workspace.");e.target.value=window._notionPeriod||monthNow();return;}window._notionPeriod=e.target.value;render();}});

setInterval(()=>{if(user&&!document.hidden&&!loadingData&&['overview','life','business','notion','gantt','progress','calendar'].includes(currentView)&&!document.querySelector('.cal-dialog[open]')&&!document.activeElement?.matches('input,textarea,select'))void refresh(true);},60000);
document.addEventListener('visibilitychange',()=>{if(user&&!document.hidden&&!loadingData&&!document.activeElement?.matches('input,textarea,select'))void refresh();});
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});

setInterval(()=>{if(user&&!document.hidden)void gateway.refreshMetadata();},60000);
