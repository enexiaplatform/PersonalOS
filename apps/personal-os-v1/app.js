import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { SOURCE, BLUEPRINT, CAPACITY } from "./goals.js";
import { PROJECT_URL, PUBLISHABLE_KEY } from "./config.js";
const db=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const PILLARS=[
["career","Career & Leadership","◈","#dcebf8"],
["education","Education & Capability","✦","#ebe4f9"],
["entrepreneurship","Entrepreneurship","◇","#fff0dc"],
["finance","Financial Capital","▤","#e2f3e7"],
["health","Health & Performance","♥","#ffe9e6"],
["relationships","Relationships & Family","♧","#f5e5f1"],
["growth","Personal Growth & Creativity","✳","#fff2d7"]];
const viewNames={notion:"Notion Review",blueprint:"2027 Blueprint",overview:"Your Command Center",weekly:"Weekly Pulse",monthly:"Monthly Review",evidence:"Evidence Log",decision:"Decision Log",settings:"Settings & Export"};
let selectedYear=Number(localStorage.getItem("henry-os-year"))===2027?2027:2026;
let yearPlan=null,loadingData=false,loadError="",refreshSequence=0;
let notionWeeks=[];
let user=null,entries=[],metrics=[],settings=null,currentView="overview",busy=false;
const $=s=>document.querySelector(s);
const safe=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const dateNow=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const monthNow=()=>selectedYear+dateNow().slice(4,7);
const reviewDate=()=>selectedYear+dateNow().slice(4);
const pName=id=>yearPillars().find(p=>p[0]===normalizePillar(id))?.[1]||"General";
const opt=()=>yearPillars().map(p=>'<option value="'+p[0]+'">'+safe(p[1])+'</option>').join("");
const dtext=x=>x?new Date(x+"T00:00:00").toLocaleDateString("vi-VN"):"—";
function toast(message){const t=$("#toast");t.textContent=message;t.classList.remove("hidden");clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.add("hidden"),4800);}
function notifyError(error){toast("Có lỗi: "+(error?.message||String(error)));console.error(error);}
function stateLogin(on){$("#auth").classList.toggle("hidden",on);$("#shell").classList.toggle("hidden",!on);if(on)$("#identity").textContent=user?.email||"";}
async function refresh(){
 if(!user)return;
 const loadOwner=user.id,loadYear=selectedYear,sequence=++refreshSequence;
 loadingData=true;loadError="";render();
 try{
 const results=await Promise.allSettled([
 db.from("personal_os_entries").select("*").order("period_start",{ascending:false}).limit(250),
 db.from("personal_os_metrics").select("*").order("month_start",{ascending:false}).limit(200),
 db.from("personal_os_settings").select("*").eq("owner_id",loadOwner).eq("year",loadYear).maybeSingle(),
 db.from("personal_os_notion_weeks").select("*").eq("owner_id",loadOwner).order("week_start",{ascending:false}).limit(1000),
 db.from("personal_os_year_plans").select("*").eq("owner_id",loadOwner).eq("year",loadYear).maybeSingle()
 ]);
 if(user?.id!==loadOwner||selectedYear!==loadYear||sequence!==refreshSequence)return;
 const data=results.map(r=>r.status==='fulfilled'?r.value:{error:r.reason});
 if(!data[0].error)entries=data[0].data||[];
 if(!data[1].error)metrics=data[1].data||[];
 if(!data[2].error)settings=data[2].data||null;
 if(!data[3].error)notionWeeks=data[3].data||[];
 if(!data[4].error)yearPlan=data[4].data||null;
 const failures=data.filter(r=>r.error);
 if(failures.length){loadError=failures.map(r=>r.error.message||'Không tải được dữ liệu').join(' · ');notifyError(failures[0].error);}
 }catch(error){if(sequence===refreshSequence){loadError=error.message||'Không tải được dữ liệu';notifyError(error);}}
 finally{if(sequence===refreshSequence&&user?.id===loadOwner){loadingData=false;render();}}
}
async function saveEntry(type,date,pillar,title,content){
 if(busy)return;
 if(!String(date).startsWith(String(selectedYear)))throw Error("Ngày bản ghi phải thuộc năm đang chọn.");
 busy=true;
 const {error}=await db.from("personal_os_entries").insert({owner_id:user.id,entry_type:type,period_start:date,pillar:pillar||null,title:title||"",content});
 busy=false;if(error)throw error;toast("Đã lưu an toàn.");await refresh();
}
const items=type=>entries.filter(x=>x.entry_type===type&&x.period_start.startsWith(String(selectedYear)));
function entrySummary(x){
 const c=x.content||{};
 if(x.entry_type==="weekly")return [["Wins",c.wins],["Blocker",c.blocker],["Next",c.next],["Energy",c.energy?c.energy+"/5":null]];
 if(x.entry_type==="monthly")return [["Progress",c.progress],["Lessons",c.lessons],["Next month",c.next],["Capacity",c.capacity]];
 if(x.entry_type==="decision")return [["Context",c.context],["Decision",c.choice],["Follow-up",c.followup]];
 return [["Evidence",c.description],["Link",c.link]];
}
function entryCard(x){
 const lines=entrySummary(x).filter(([,v])=>v).map(([k,v])=>{
 if(k==="Link"&&/^https?:\/\//i.test(v))return '<p><b>Link:</b> <a class="inline-link" href="'+safe(v)+'" target="_blank" rel="noopener noreferrer">Mở bằng chứng ↗</a></p>';
 return "<p><b>"+safe(k)+":</b> "+safe(v)+"</p>";}).join("");
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
 return '<div class="hero"><div><div class="eyebrow">HENRY · 2027 → GM 2031</div><h3>Seven pillars.<br/>One intentional life.</h3><p>Servicebio, MBA và một cuộc sống vững vàng. Mỗi mục tiêu đều cần một hành động tiếp theo, một bằng chứng thực tế.</p></div><div class="hero-stamp"><b>07</b><small>Life pillars</small></div></div>'+
 '<div class="source-banner"><div><b>2027 Objectives · Canonical Source</b><p>Snapshot được đối chiếu '+safe(SOURCE.reviewed)+'. Không tự động đồng bộ; nếu OneNote thay đổi, mục tiêu trên đây cần được cập nhật có kiểm chứng.</p></div><a href="'+safe(SOURCE.url)+'" target="_blank" rel="noopener noreferrer" class="btn soft">Mở OneNote ↗</a></div>'+
 heading("Your 2027 operating thesis","Ba ưu tiên lớn nhất")+
 '<div class="cards"><div class="card"><span class="kicker">01 / PRIMARY GAME</span><b class="value">Servicebio</b><p>National Sales Manager → country P&L, channel, people, operations và HQ influence. Quyền điều hành toàn phần là giả định kế hoạch.</p></div>'+
 '<div class="card"><span class="kicker">02 / STRATEGIC INVESTMENT</span><b class="value">MBA · Apr–May</b><p>Business Chinese + 2 applied management cases; admission và chi phí vẫn cần xác nhận.</p></div>'+
 '<div class="card"><span class="kicker">03 / LONG-TERM FOUNDATION</span><b class="value">25% → 35%</b><p>Base / stretch savings rate, quỹ MBA, sáu tháng liquidity, sức khỏe và các quan hệ được bảo vệ.</p></div></div>'+
 heading("Quarterly commitments","Chọn quý để xem hành động và giới hạn tải")+
 '<div class="quarter-tabs">'+quarterSelect+'</div>'+
 '<div class="capacity-banner"><b>'+CAPACITY[q].quarter+' · '+CAPACITY[q].level+' capacity</b><span>'+safe(CAPACITY[q].rule)+'</span></div>'+
 heading("Seven pillars · Real Objectives","Evidence count = số bản ghi, không phải % hoàn thành")+
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
 const selected=notionPeriodWeeks(),all=selected.filter(w=>w.coverage!=='conflict').flatMap(w=>(w.items||[]).map(i=>({...i,week:w.week_start,source_url:i.source_url||w.source_url})));
 const statusNames={plan:'Kế hoạch',reported_done:'Đã ghi nhận thực hiện',blocked:'Trở ngại',unknown:'Cần làm rõ'};
 const mode=window._notionMode||'month';
 const counts=Object.keys(statusNames).map(k=>'<div class="card"><span class="kicker">'+statusNames[k]+'</span><b class="value">'+all.filter(i=>i.status===k).length+'</b><p>Số ghi nhận trong các nguồn đã nhập.</p></div>').join('');
 const pillars=yearPillars().map(p=>{const list=all.filter(i=>normalizePillar(i.pillar)===p[0]);const goal=selectedYear===2026?yearPlan?.plan?.axes.find(a=>a.id===p[0]):BLUEPRINT.find(b=>b.id===p[0]);const targetYear=(window._notionPeriod||monthNow()).slice(0,4);const ref=goal&&targetYear===String(selectedYear)?'<div class="quarter-detail"><b>Mục tiêu '+selectedYear+'</b><p>'+safe(goal.objective)+'</p><small>Ghi nhận chưa tự xác nhận hoàn thành các KR bên dưới.</small><ul>'+goal.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul></div>':'';return '<details class="goal-card"><summary><span class="goal-icon">'+p[2]+'</span><span><strong>'+safe(p[1])+'</strong><small>'+list.length+' ghi nhận từ Notion</small></span></summary><div class="goal-detail">'+ref+(list.length?list.map(i=>'<div class="entry"><span class="small-pill">'+safe(statusNames[i.status]||'Cần làm rõ')+'</span><p>'+safe(i.text)+'</p><small>'+safe(i.context||'Chưa xác định')+' · Tuần '+dtext(i.week)+'</small> · <a class="inline-link" href="'+safe(notionUrl(i.source_url))+'" target="_blank" rel="noopener noreferrer">Nguồn ↗</a></div>').join(''):'Chưa có dữ liệu cho trục này trong phạm vi đã nhập.')+'</div></details>';}).join('');
 const sources=selected.map(w=>'<article class="entry"><div class="row"><h4>'+safe(w.title)+'</h4><span class="small-pill">'+safe({complete:'Đủ nguồn',partial:'Đọc một phần',page_only:'Phần chữ của page',conflict:'Trùng / cần xác nhận'}[w.coverage]||w.coverage)+'</span></div><p>'+safe(w.summary)+'</p><p class="info">'+(w.warnings||[]).map(safe).join(' · ')+'</p><time>Kiểm tra gần nhất: '+safe(new Date(w.synced_at).toLocaleString('vi-VN'))+'</time> · <a class="inline-link" href="'+safe(notionUrl(w.source_url))+'" target="_blank" rel="noopener noreferrer">Mở trang tuần ↗</a></article>').join('');
 return '<div class="hero"><div><div class="eyebrow">NOTION → PERSONAL OS</div><h3>Your weeks.<br/>A clearer direction.</h3><p>Tiếp tục viết trên Notion. Xem kế hoạch, kết quả tự ghi nhận và trở ngại theo 7 trục tại đây.</p></div><div class="hero-stamp"><b>'+selected.length+'</b><small>Trang tuần trong kỳ</small></div></div>'+
 '<div class="source-banner"><div><b>Đồng bộ qua lịch ChatGPT · sáng thứ Hai</b><p>Tự tìm page Weekly Planner mới qua kết nối Notion. Nút bên cạnh chỉ tải lại dữ liệu đã nhập; chưa kết nối trực tiếp n8n/VPS.</p></div><button class="btn soft" id="reload-notion">Tải lại dữ liệu</button></div>'+
 '<div class="section-header"><h3>Review theo kỳ</h3><div class="toolbar"><label>Kỳ<select id="notion-mode">'+[['month','Tháng'],['quarter','Quý'],['year','Năm']].map(([v,n])=>'<option value="'+v+'" '+(mode===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Mốc tham chiếu<input id="notion-period" type="month" value="'+safe(window._notionPeriod||monthNow())+'"></label></div></div>'+
 '<p class="info">Tuần được xếp theo ngày bắt đầu tuần. '+(mode==='quarter'?'Đang xem Q'+Math.ceil(Number((window._notionPeriod||monthNow()).slice(5,7))/3)+'. ':'')+'Không cộng dồn doanh thu, thói quen hoặc cùng một kết quả được nhắc lại. Số ghi nhận không phải % hoàn thành KR. Dữ liệu 2026 tách khỏi mục tiêu 2027.</p>'+
 '<div class="cards notion-counts">'+counts+'</div>'+heading('7 trục · Kết quả và khoảng trống','Ghi nhận từ nguồn, chưa xác minh độc lập')+'<div class="goal-list">'+pillars+'</div>'+heading('Nguồn và độ đầy đủ',selected.length+' trang tuần')+'<div class="history">'+(sources||'<div class="empty">Chưa có trang tuần được nhập cho kỳ này. Không có dữ liệu không có nghĩa là không tiến triển.</div>')+'</div>';
}
function notionUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['app.notion.com','www.notion.so','notion.so'].includes(u.hostname)?u.href:'#';}catch{return '#';}}

const YEAR_AXES=[['career','Commercial Manager'],['business','Business'],['freelance','Part-time / Freelance'],['education','Learning'],['health','Health & Sport'],['finance','Finance'],['growth','Soul & Creative'],['relationships','Networking & Family']];
const yearPillars=()=>selectedYear===2026?YEAR_AXES.map(([id,name],i)=>[id,name,['◈','◇','↗','✦','♥','▤','✳','♧'][i],['#dcebf8','#fff0dc','#ffe8d6','#ebe4f9','#ffe9e6','#e2f3e7','#fff2d7','#f5e5f1'][i]]):PILLARS;
const sourceForYear=()=>selectedYear===2026?yearPlan?.source_url||'':SOURCE.url;
const normalizePillar=id=>selectedYear===2026&&id==='entrepreneurship'?'business':id;
function annualEvidence(axis,quarter){
 return notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))&&w.coverage!=='conflict'&&Math.floor((Number(w.week_start.slice(5,7))-1)/3)===quarter).flatMap(w=>(w.items||[]).filter(i=>normalizePillar(i.pillar)===axis&&i.status==='reported_done').map(i=>({...i,week:w.week_start,source_url:i.source_url||w.source_url})));
}
function renderYearPlan(){
 if(!yearPlan)return '<div class="empty" role="status">'+(loadingData?'Đang tải Objectives '+selectedYear+'…':loadError?'Không tải được dữ liệu: '+safe(loadError):'Chưa tìm thấy Objectives '+selectedYear+' cho tài khoản này.')+(loadingData?'':'<br/><button class="btn soft" id="retry-year">Tải lại Objectives</button>')+'</div>';
 const p=yearPlan.plan,q=Number.isInteger(window._annualQuarter)?window._annualQuarter:Math.floor(new Date().getMonth()/3);
 const cards=p.axes.map(a=>{const evidence=annualEvidence(a.id,q);return '<details class="goal-card" '+(a.id==='career'?'open':'')+'><summary><span><strong>'+safe(a.name)+'</strong><small>'+evidence.length+' task/ghi nhận thực hiện trong Q'+(q+1)+'</small></span></summary><div class="goal-detail"><div class="goal-north">'+safe(a.objective)+'</div><div class="goal-mini-title">KEY RESULTS · SOURCE OF TRUTH</div><ul>'+a.krs.map(k=>'<li>'+safe(k)+'</li>').join('')+'</ul><div class="goal-mini-title">Q'+(q+1)+' · NỘI DUNG NGUYÊN BẢN</div><div class="quarter-detail preserve-lines">'+safe(a.quarters[q])+'</div><div class="goal-mini-title">ĐỐI CHIẾU · CHƯA PHẢI KẾT LUẬN ĐẠT KR</div><p>'+safe(a.assessment)+'</p><div class="goal-mini-title">GHI NHẬN THỰC HIỆN TỪ NOTION</div>'+(evidence.length?evidence.slice(0,10).map(i=>'<p>• '+safe(i.text)+' <a class="inline-link" target="_blank" rel="noopener noreferrer" href="'+safe(notionUrl(i.source_url))+'">Nguồn ↗</a></p>').join('')+(evidence.length>10?'<p class="info">Xem các ghi nhận còn lại trong Notion Review.</p>':''):'<p>Chưa có bằng chứng được nhập cho quý này. Không mặc định là chưa làm.</p>')+'</div></details>';}).join('');
 return '<div class="hero"><div><div class="eyebrow">2026 / LIVE DATA PILOT</div><h3>A real year.<br/>An honest review.</h3><p>Giữ nguyên 8 trục năm 2026 từ OneNote. Đối chiếu với Notion và ghi rõ khoảng trống dữ liệu.</p></div><div class="hero-stamp"><b>2026</b><small>8 trục nguyên bản</small></div></div><div class="source-banner"><div><b>'+safe(yearPlan.source_title)+'</b><p>Đã đọc bảng OneNote; màu highlight và hình ảnh chưa được dùng để xác định hoàn thành.</p></div><a class="btn soft" href="'+safe(yearPlan.source_url)+'" target="_blank" rel="noopener noreferrer">Mở OneNote ↗</a></div>'+heading('Cam kết và lịch sử theo quý','Q1–Q3 được bảo toàn')+'<div class="quarter-tabs">'+[0,1,2,3].map(n=>'<button class="quarter-tab '+(q===n?'selected':'')+'" data-annual-quarter="'+n+'">Q'+(n+1)+'</button>').join('')+'</div><div class="goal-list" style="margin-top:20px">'+cards+'</div><div class="closing-note"><b>CẦN ĐỐI CHIẾU</b>'+p.warnings.map(w=>'<p>'+safe(w)+'</p>').join('')+'</div>';
}
function renderPilot(){
 const ws=notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))),good=ws.filter(w=>w.coverage!=='conflict');
 const latest=good.filter(w=>w.week_start<=dateNow()).sort((a,b)=>b.week_start.localeCompare(a.week_start))[0];
 const timeline=Array.from({length:12},(_,i)=>{const month=String(i+1).padStart(2,'0'),list=ws.filter(w=>w.week_start.slice(5,7)===month);return '<button class="month-tile" data-review-month="'+selectedYear+'-'+month+'"><b>T'+(i+1)+'</b><span>'+new Set(list.map(w=>w.week_start)).size+' tuần có nguồn</span><small>'+list.filter(w=>w.coverage==='conflict').length+' page cần đối chiếu</small></button>';}).join('');
 return '<div class="hero"><div><div class="eyebrow">HENRY / 2026 LIVE DATA PILOT</div><h3>Look back clearly.<br/>Move forward deliberately.</h3><p>Biomedia, chuyển tiếp Servicebio và 8 trục cuộc sống. Dữ liệu thật từ OneNote + Notion, không gán tiến độ giả.</p><div class="hero-actions"><button class="btn primary" data-view="blueprint">Objectives 2026 ↗</button><button class="btn ghost" data-view="notion">Review dữ liệu Notion</button></div></div><div class="hero-stamp"><b>2026</b><small>Thử nghiệm với lịch sử thật</small></div></div>'+heading('Độ phủ dữ liệu','Đây là số nguồn, không phải % hoàn thành')+'<div class="cards"><div class="card"><span class="kicker">Nguồn đã nhập</span><b class="value">'+ws.length+'</b><p>Trang Weekly / Wekkly Planner tìm thấy.</p></div><div class="card"><span class="kicker">Khoảng tuần</span><b class="value">'+new Set(ws.map(w=>w.week_start)).size+'</b><p>Một số tuần có nhiều phiên bản.</p></div><div class="card"><span class="kicker">Cần chọn bản chính</span><b class="value">'+new Set(ws.filter(w=>w.coverage==='conflict').map(w=>w.week_start)).size+'</b><p>Tạm loại các tuần trùng khỏi đối chiếu kết quả.</p></div></div>'+heading('2026 · Theo tháng','Bấm tháng để xem nguồn và ghi nhận')+'<div class="month-grid">'+timeline+'</div>'+heading('Tuần gần nhất có nguồn')+'<div class="card"><b>'+safe(latest?.title||'Chưa có dữ liệu')+'</b><p>'+safe(latest?.summary||'')+'</p><p class="info">Nội dung tuần chưa kết thúc vẫn có thể là kế hoạch. Task hoàn thành không xác nhận KR đã đạt.</p></div><div class="closing-note"><b>ĐIỂM CẦN THEO DÕI TRONG Q4</b><p>Chuyển hoạt động thương mại thành quyết định khách hàng; bảo vệ onboarding Servicebio; kiểm chứng paid validation; cập nhật cân nặng, cash flow và số liệu thực đo.</p><p>OneNote và Notion đang có khác biệt về snapshot doanh thu/target. Xem Objectives 2026 để đối chiếu trước khi tính attainment.</p></div>';
}

function renderOverview(){
 if(selectedYear===2026)return renderPilot();
 const latest=items("weekly")[0],month=monthNow();
 const active=entries.filter(x=>x.period_start.slice(0,7)===month).length;
 const nMonthly=items("monthly").length;
 const total=entries.filter(x=>x.period_start.startsWith(String(selectedYear))).length;
 const pillarsHtml=PILLARS.map(p=>{
 const count=entries.filter(x=>x.pillar===p[0]&&x.period_start.startsWith(String(selectedYear))).length;
 return '<div class="pillar" style="border-top:4px solid '+p[3]+'"><span class="emoji">'+p[2]+'</span><strong>'+p[1]+'</strong><div class="sub">'+count+' bản ghi trong hành trình</div></div>';
 }).join("");
 let recent=latest?'<div class="card"><div class="kicker">Latest Weekly Pulse · '+dtext(latest.period_start)+'</div><p>'+safe(latest.content?.wins||"Chưa có thành tựu được ghi")+'</p><div class="section-header"><span class="small-pill">Next</span></div><p>'+safe(latest.content?.next||"Chưa cập nhật")+'</p></div>':'<div class="card"><b>Start small</b><p>10 phút mỗi tuần: 3 wins, 1 blocker, 3 next priorities. Không cần điền mọi trục.</p><button class="btn primary" data-view="weekly" style="margin-top:18px">Tạo Weekly Pulse</button></div>';
 const m=metrics.filter(x=>x.month_start.slice(0,7)===month);
 const ms=m.length?m.map(x=>'<div class="metric-row"><span>'+safe(x.metric_key)+'</span><strong>'+safe(x.metric_value)+' '+safe(x.unit)+'</strong></div>').join(""):'<p>Chưa có chỉ số tháng này. Chỉ nhập kết quả đã đo được.</p>';
 return '<div class="hero"><div><div class="eyebrow">HENRY / YOUR PERSONAL COMMAND CENTER</div><h3>Build the country.<br/>Build the leader.</h3><p>Chào Henry. Xây Servicebio Vietnam, trưởng thành qua MBA và giữ vững những điều quan trọng. Bắt đầu từ tuần này.</p><div class="hero-actions"><button class="btn primary" data-view="weekly">Cập nhật tuần này ↗</button><button class="btn ghost" data-view="blueprint">Xem mục tiêu 2027</button></div></div><div class="hero-stamp"><b>2031</b><small>'+safe(settings?.north_star||"GM / Country Manager")+'</small></div></div>'+
 reviewRhythm(latest)+
 heading("Your execution, at a glance","Những gì bạn đã thực sự ghi nhận")+
 '<div class="cards"><div class="card"><span class="kicker">Updates · this month</span><b class="value">'+active+'</b><p>Weekly, monthly, evidence và decision entries.</p></div><div class="card"><span class="kicker">Monthly reviews</span><b class="value">'+nMonthly+'</b><p>Lịch sử review đã lưu.</p></div><div class="card"><span class="kicker">Records</span><b class="value">'+total+'</b><p>Tổng số bản ghi cá nhân gần đây.</p></div></div>'+
 heading("Seven life pillars","Nội dung được phân loại khi ghi nhận")+'<div class="pillars">'+pillarsHtml+'</div>'+
 heading("Latest weekly pulse","Tuần gần nhất")+'<div class="two-col">'+recent+'<div class="card"><div class="kicker">Monthly metrics · '+month+'</div>'+ms+'<button class="btn soft" data-view="monthly" style="margin-top:13px">Review tháng này</button></div></div>'+
 heading("Review with Lumi","Không tự gửi dữ liệu cho AI")+'<div class="card"><p>Chọn “Sao chép review brief” để lấy một bản tóm tắt có nguồn dữ liệu và nhờ Lumi đánh giá trong ChatGPT.</p><button class="btn primary" id="copy-brief">Sao chép review brief</button> '+((settings?.onenote_url||SOURCE.url)?'<a class="inline-link" href="'+safe(settings?.onenote_url||SOURCE.url)+'" rel="noopener noreferrer" target="_blank">Mở OneNote Source of Truth ↗</a>':'<button class="btn soft" data-view="settings">Liên kết OneNote</button>')+'</div>';
}
function renderWeekly(){
 return '<div class="two-col"><div class="form-card"><h3>Weekly Pulse · 10 minutes</h3><p class="tagline">'+(selectedYear===2026?'Ví dụ: Biomedia Q4, Servicebio onboarding, HSK4, tài chính hoặc recovery.':'Ví dụ: Servicebio market map, HQ budget, MBA admission, Chinese, tiết kiệm hoặc recovery.')+' Không cần điền mọi trục.</p><form id="weekly-form">'+
 '<div class="form-grid"><label>Ngày review<input required name="date" type="date" value="'+reviewDate()+'"></label><label>Trục chính<select name="pillar">'+opt()+'</select></label></div>'+
 '<label>3 wins / achievements<textarea required name="wins" placeholder="Điều gì đã tiến triển? Kết quả/bằng chứng?"></textarea></label>'+
 '<label>Biggest blocker<textarea name="blocker" placeholder="Một trở ngại đáng xử lý"></textarea></label>'+
 '<label>Next 3 priorities<textarea required name="next" placeholder="3 việc quan trọng nhất tuần tới"></textarea></label>'+
 '<label>Energy 1–5<select name="energy"><option value="">Không đánh giá</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu Weekly Pulse</button></div></form></div>'+
 '<div><div class="section-header"><h3>Weekly history</h3></div>'+historyHtml("weekly",15)+'</div></div>';
}
function renderMonthly(){
 const now=monthNow();
 const monthMetrics=metrics.filter(x=>x.month_start.slice(0,7)===now).map(x=>'<div class="metric-row"><span>'+safe(x.metric_key)+'</span><strong>'+safe(x.metric_value)+' '+safe(x.unit)+'</strong></div>').join("");
 return '<div class="two-col"><div class="form-card"><h3>Monthly Review · 30 minutes</h3><p class="tagline">'+(selectedYear===2026?'Review 2026: Biomedia, business, freelance, learning, health, finance, creative và family.':'Review 2027: business economics, MBA, Chinese, cash reserve, training, relationships và capacity.')+'</p><form id="monthly-form">'+
 '<label>Tháng review<input type="month" name="month" value="'+now+'" required></label>'+
 '<label>Trục ưu tiên<select name="pillar">'+opt()+'</select></label>'+
 '<label>Progress & evidence<textarea name="progress" required placeholder="Các kết quả quan trọng, bằng chứng và điểm lệch kế hoạch"></textarea></label>'+
 '<label>Lessons<textarea name="lessons" placeholder="Điều gì thực sự hiệu quả / không hiệu quả?"></textarea></label>'+
 '<label>Next-month decisions<textarea name="next" placeholder="Continue / Accelerate / Pause"></textarea></label>'+
 '<label>Capacity & sustainability<textarea name="capacity" placeholder="Workload, MBA, health, relationships"></textarea></label>'+
 '<div class="section-header"><h3>Optional measured metrics</h3></div>'+
 '<div class="form-grid"><label>'+(selectedYear===2026?'Biomedia':'Servicebio')+' revenue attainment (%)<input type="number" min="0" step=".1" name="revenue" placeholder="Chỉ dùng số liệu được phép"></label><label>Qualified pipeline coverage (×)<input type="number" min="0" step=".1" name="pipeline" placeholder="Target ≥3×"></label><label>Forecast error (%)<input type="number" min="0" step=".1" name="forecast" placeholder="Sai số thực đo"></label><label>Productive distributors<input type="number" min="0" step="1" name="partners" placeholder="Theo scorecard thực tế"></label><label>'+(selectedYear===2026?'Applied learning hours':'MBA study hours')+'<input type="number" min="0" max="300" step=".5" name="study" placeholder="Giờ thực học trong tháng"></label><label>Saving rate (%)<input type="number" min="-100" max="100" step=".1" name="saving" placeholder="Tỷ lệ thực tế trong tháng"></label><label>Emergency reserve (months)<input type="number" min="0" step=".1" name="reserve" placeholder="Số tháng chi tiêu được bảo đảm"></label><label>Workout sessions<input type="number" min="0" max="100" step="1" name="workouts" placeholder="Số buổi thực tế"></label><label>Energy (1–5)<input type="number" min="1" max="5" step="1" name="energy" placeholder="Tùy chọn"></label></div>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu Monthly Review</button></div></form></div>'+
 '<div><div class="section-header"><h3>Monthly scoreboard · '+now+'</h3></div><div class="card">'+(monthMetrics||'<p class="info">Chưa có số liệu tháng này</p>')+'</div>'+heading("Monthly history")+historyHtml("monthly",15)+'</div></div>';
}
function renderEvidence(){
 return '<div class="two-col"><div class="form-card"><h3>Document leadership evidence</h3><p class="tagline">Tập trung vào thành tích, kỹ năng, quyết định đã được phép ghi nhận. Không tải tài liệu mật.</p><form id="evidence-form">'+
 '<div class="form-grid"><label>Ngày<input name="date" type="date" value="'+reviewDate()+'" required></label><label>Trục<select name="pillar">'+opt()+'</select></label></div>'+
 '<label>Evidence headline<input name="title" placeholder="Ví dụ: Hoàn thành FY28 operating plan" required></label>'+
 '<label>What happened<textarea name="description" placeholder="Kết quả cụ thể và vai trò của bạn" required></textarea></label>'+
 '<label>Public or permitted supporting link<input name="link" type="url" placeholder="https://... (tùy chọn)"></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu Evidence</button></div></form></div>'+
 '<div>'+heading("Evidence history")+historyHtml("evidence",30)+'</div></div>';
}
function renderDecision(){
 return '<div class="two-col"><div class="form-card"><h3>Decision Journal</h3><p class="tagline">Ghi lại vì sao bạn quyết định và khi nào cần kiểm tra kết quả.</p><form id="decision-form">'+
 '<div class="form-grid"><label>Ngày<input name="date" type="date" value="'+reviewDate()+'" required></label><label>Trục<select name="pillar">'+opt()+'</select></label></div>'+
 '<label>Decision title<input name="title" placeholder="Vấn đề / quyết định" required></label>'+
 '<label>Context<textarea name="context" required placeholder="Lý do, dữ liệu, lựa chọn và rủi ro"></textarea></label>'+
 '<label>Chosen action<textarea name="choice" required placeholder="Quyết định cuối cùng"></textarea></label>'+
 '<label>Revisit at<textarea name="followup" placeholder="Điều kiện hoặc thời điểm review lại"></textarea></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu Decision</button></div></form></div>'+
 '<div>'+heading("Decision history")+historyHtml("decision",30)+'</div></div>';
}
function renderSettings(){
 return '<div class="two-col"><div class="form-card"><h3>Source-of-Truth Settings</h3><p class="tagline">OneNote không tự đồng bộ. Các thay đổi Objectives chỉ thực hiện sau khi bạn phê duyệt.</p><form id="settings-form">'+
 '<label>OneNote Objectives URL<input name="onenote_url" type="url" placeholder="https://..." value="'+safe(settings?.onenote_url||sourceForYear())+'"></label>'+
 '<label>North Star<input name="north_star" type="text" value="'+safe(settings?.north_star||"GM / Country Manager 2031")+'"></label>'+
 '<div class="action-row"><button class="btn primary" type="submit">Lưu Settings</button></div></form></div>'+
 '<div class="stack"><div class="card"><h3>Personal data export</h3><p>Xuất dữ liệu thành JSON để tự lưu bản sao lưu. File này chứa nội dung riêng tư, hãy bảo quản cẩn thận.</p><button class="btn soft" id="export-data">Tải bản sao dữ liệu</button></div><div class="card danger-zone"><h3>Security boundary</h3><p>Chia sẻ cùng Supabase project với Memoire nhưng dùng bảng Personal OS riêng, RLS theo user và không sử dụng service-role key phía trình duyệt.</p><p>Không có AI tự động xử lý dữ liệu: chỉ sao chép dữ liệu bạn chủ động chọn để review.</p></div></div></div>';
}
function render(){
 if(!user)return;
 $("#page-title").textContent=currentView==='blueprint'?selectedYear+' Blueprint':viewNames[currentView]||viewNames.overview;
 $('#os-year').value=String(selectedYear);
 $('#blueprint-label').textContent=selectedYear+' Blueprint';
 document.querySelectorAll("#nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
 const fn={notion:renderNotion,blueprint:renderBlueprint,overview:renderOverview,weekly:renderWeekly,monthly:renderMonthly,evidence:renderEvidence,decision:renderDecision,settings:renderSettings}[currentView]||renderOverview;
 $("#view-content").innerHTML=fn();
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
 [selectedYear===2026?"Applied learning hours":"MBA study hours",form.get("study"),"hours","education"],
 ["Energy",form.get("energy"),"/5","health"]];
 const rows=values.filter(v=>v[1]!==null&&String(v[1]).trim()!=="").map(v=>({owner_id:user.id,month_start:month+"-01",pillar:v[3],metric_key:v[0],metric_value:Number(v[1]),unit:v[2]}));
 if(!rows.length)return;
 const {error}=await db.from("personal_os_metrics").upsert(rows,{onConflict:"owner_id,month_start,pillar,metric_key"});
 if(error)throw error;
}
function reviewBrief(){
 const lastW=items("weekly").slice(0,4),lastM=items("monthly").slice(0,2),lastE=items("evidence").slice(0,7),lastD=items("decision").slice(0,7);
 const sections=[["Weekly",lastW],["Monthly",lastM],["Evidence",lastE],["Decisions",lastD]].map(([name,data])=>name+"\n"+data.map(x=>"- "+x.period_start+" ["+pName(x.pillar)+"] "+x.title+" "+JSON.stringify(x.content)).join("\n")).join("\n\n");
 return "Notion imports (nguồn tự ghi nhận; không suy đoán hoàn thành KR):\n"+JSON.stringify(notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))))+"\n\n"+"Bạn là Lumi, trợ lý và mentor. Đây là dữ liệu Personal OS do tôi tự lựa chọn chia sẻ. Hãy phân tích tiến độ, rủi ro, các quyết định, lệch kế hoạch và 3 ưu tiên tiếp theo. Không suy đoán số liệu còn thiếu. OneNote Objectives năm "+selectedYear+" là Source of Truth. Chỉ đối chiếu dữ liệu cùng năm; không suy đoán hoàn thành KR từ task. Các trục: "+yearPillars().map(p=>p[1]).join(", ")+". Bản mục tiêu: "+JSON.stringify(selectedYear===2026?yearPlan?.plan:BLUEPRINT)+".\n\n"+sections;
}
document.addEventListener("click",async e=>{
 if(e.target.closest("#reload-notion, #retry-year")){await refresh();return;}
 const aq=e.target.closest("[data-annual-quarter]");if(aq){window._annualQuarter=Number(aq.dataset.annualQuarter);render();return;}
 const mt=e.target.closest("[data-review-month]");if(mt){window._notionPeriod=mt.dataset.reviewMonth;window._notionMode='month';currentView='notion';render();return;}
 const qt=e.target.closest("[data-quarter]");if(qt){window._blueprintQuarter=Number(qt.dataset.quarter);render();return;}
 const nav=e.target.closest("[data-view]");if(nav){currentView=nav.dataset.view;render();window.scrollTo(0,0);return;}
 const del=e.target.closest("[data-delete]");if(del){
 if(!confirm("Xóa bản ghi này? Thao tác không thể hoàn tác."))return;
 const {error}=await db.from("personal_os_entries").delete().eq("id",del.dataset.delete).eq("owner_id",user.id);
 if(error)notifyError(error);else{toast("Đã xóa bản ghi.");await refresh();}return;}
 if(e.target.closest("#copy-brief")){
 try{await navigator.clipboard.writeText(reviewBrief());toast("Đã sao chép. Bạn có thể dán vào ChatGPT để Lumi review.");}
 catch{toast("Trình duyệt chặn clipboard. Thử bằng HTTPS.");}return;}
 if(e.target.closest("#export-data")){
 const payload={selectedYear,yearPlan,notionWeeks:notionWeeks.filter(w=>w.week_start.startsWith(String(selectedYear))),format:"henry-personal-os-v1",exported_at:new Date().toISOString(),entries:entries.filter(e=>e.period_start.startsWith(String(selectedYear))),metrics:metrics.filter(m=>m.month_start.startsWith(String(selectedYear))),settings};
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
$("#logout-button").addEventListener("click",async()=>{await db.auth.signOut();user=null;entries=[];metrics=[];notionWeeks=[];yearPlan=null;stateLogin(false);});
// Keep the auth callback synchronous: authenticated queries must run after
// Supabase releases its auth lock, otherwise getSession and data loads can deadlock.
db.auth.onAuthStateChange((event,session)=>{
 const was=user?.id;user=session?.user||null;stateLogin(Boolean(user));
 if(user&&was!==user.id){currentView="overview";setTimeout(()=>{void refresh();},0);}
});
(async()=>{const {data,error}=await db.auth.getSession();if(error)notifyError(error);user=data?.session?.user||null;stateLogin(Boolean(user));if(user)void refresh()})();

document.addEventListener("change",e=>{if(e.target.id==="os-year"){selectedYear=Number(e.target.value)===2027?2027:2026;localStorage.setItem("henry-os-year",selectedYear);window._notionPeriod=monthNow();window._annualQuarter=undefined;yearPlan=null;settings=null;refresh();return;}if(e.target.id==="notion-mode"){window._notionMode=e.target.value;render();}if(e.target.id==="notion-period"&&/^\d{4}-\d{2}$/.test(e.target.value)){if(!e.target.value.startsWith(String(selectedYear))){toast("Chọn năm ở thanh trên để chuyển toàn bộ workspace.");e.target.value=window._notionPeriod||monthNow();return;}window._notionPeriod=e.target.value;render();}});
