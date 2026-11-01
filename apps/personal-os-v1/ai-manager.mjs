import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {PROJECT_URL,PUBLISHABLE_KEY} from './config.js';
const sb=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const make=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
const put=(parent,tag,cls,text)=>{const x=make(tag,cls,text);parent.append(x);return x;};
const time=x=>{if(!x)return 'Chưa rõ';const d=new Date(x);return Number.isNaN(d.getTime())?'Chưa rõ':d.toLocaleString('vi-VN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'});};
const scopeTitles={personal:'Personal OS',servicebio:'Servicebio',ventures:'Ventures',enexia:'Enexia'};
const scope=()=>{const v=location.hash.replace(/^#/,'').split('/')[0];return scopeTitles[v]?v:'personal';};
const state={tab:'overview',open:false,busy:false,source:null,actions:[],runs:[],output:null,message:'',lastLoad:0,includeDetails:false,activeRun:null};
const overlay=make('div','aom-overlay');
overlay.innerHTML=[
'<div class="aom-backdrop" data-close></div>',
'<section class="aom-shell" role="dialog" aria-modal="true" aria-labelledby="aom-title">',
'<header class="aom-header"><div class="aom-brand"><span class="aom-logo">✦</span><div><h2 id="aom-title">AI Manager</h2><p>Personal OS · Powered by Manus</p></div></div>',
'<div class="aom-header-actions"><span class="aom-level">● Autonomous · Level B</span><button class="aom-icon" data-refresh title="Kiểm tra nguồn" aria-label="Kiểm tra nguồn">⟳</button><button class="aom-icon" data-close title="Đóng" aria-label="Đóng">×</button></div></header>',
'<nav class="aom-tabs" role="tablist" aria-label="AI Manager"><button data-tab="overview" role="tab">Tổng quan</button><button data-tab="actions" role="tab">Hành động <span id="aom-count"></span></button><button data-tab="history" role="tab">Lịch sử</button><button data-tab="settings" role="tab">Quyền & dữ liệu</button></nav>',
'<div class="aom-content"><main class="aom-main"><div class="aom-source" id="aom-source"></div><div class="aom-body" id="aom-body" aria-live="polite"></div></main>',
'<aside class="aom-rail"><div class="aom-rail-title"><div><h3>Action Queue</h3><p>Những đề xuất cần xem xét</p></div><span id="aom-rail-count">0</span></div><div class="aom-rail-list" id="aom-rail-list"></div><div class="aom-rail-footer">Tự phát hiện rủi ro · Không tự thay đổi Notion.</div></aside></div>',
'<div id="aom-message" class="aom-message" role="status" hidden></div>',
'<form class="aom-composer" id="aom-form"><div class="aom-compose-title"><strong>Hỏi AI Manager</strong><small>Chỉ gọi Manus khi bạn gửi yêu cầu · Có thể tốn credits</small></div>',
'<div class="aom-compose-input"><textarea id="aom-question" maxlength="1600" rows="2" required placeholder="Hỏi về tiến độ, việc cần ưu tiên hoặc cách tối ưu tuần…"></textarea><button class="aom-primary" id="aom-submit" type="submit">Phân tích ↗</button></div>',
'<div class="aom-compose-foot"><span>Ctrl/⌘ + Enter để gửi</span><button type="button" data-tab="settings">Quyền dữ liệu</button></div></form></section>'
].join('');
const launch=make('button','aom-launch','✦ AI Manager');launch.type='button';
launch.setAttribute('aria-label','Mở AI Manager');
document.body.append(overlay,launch);
const $=q=>overlay.querySelector(q),body=$('#aom-body'),list=$('#aom-rail-list'),box=$('#aom-question');
function open(){state.open=true;overlay.classList.add('open');document.body.classList.add('aom-active');state.tab='overview';draw();void load(true);box.focus();}
function close(){state.open=false;overlay.classList.remove('open');document.body.classList.remove('aom-active');launch.focus();}
launch.addEventListener('click',open);
overlay.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',close));
overlay.querySelectorAll('[data-tab]').forEach(x=>x.addEventListener('click',()=>{state.tab=x.dataset.tab;draw();}));
$('[data-refresh]').addEventListener('click',()=>void load(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.open)close();});
window.addEventListener('hashchange',()=>{if(state.open)draw();});
async function api(method,op,fields={}){
 const {data:{session}}=await sb.auth.getSession();
 if(!session?.access_token)throw Error('Bạn cần đăng nhập Personal OS để sử dụng AI Manager.');
 const q=new URLSearchParams({op});if(fields.runId&&method==='GET')q.set('run_id',fields.runId);
 const response=await fetch('/api/ai-manager?'+q,{method,headers:{Authorization:'Bearer '+session.access_token,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({op,...fields})}:{})});
 const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.error||'Không thể kết nối AI Manager');return data;
}
async function load(scan=false){
 if(!scan&&Date.now()-state.lastLoad<12000)return;
 try{const d=scan?await api('POST','scan'):await api('GET','dashboard');state.actions=d.actions||[];state.runs=d.runs||[];if(d.source)state.source=d.source;state.lastLoad=Date.now();
 if(!state.output){state.output=state.runs.find(r=>r.status==='stopped'&&r.summary&&Object.keys(r.summary).length)||null;}
 if(scan&&d.auto_checks>0)state.message='Đã kiểm tra nguồn và đối chiếu '+d.auto_checks+' tín hiệu với Action Queue.';
 }catch(e){state.message=e.message;}draw();
}
function sourceLine(){
 const line=$('#aom-source');line.replaceChildren();
 put(line,'span','aom-dot','●');put(line,'strong','',scopeTitles[scope()]);
 const source=state.source;
 put(line,'span','','· '+(source?.week_start?'Tuần '+source.week_start:'Đang kiểm tra nguồn'));
 if(source?.coverage)put(line,'span','aom-source-label',source.coverage);
 if(source?.source_synced_at)put(line,'span','aom-source-date','Đồng bộ '+time(source.source_synced_at));
}
function para(parent,text,cls='aom-sub'){return put(parent,'p',cls,text);}
function intro(){
 const area=make('section','aom-hero');put(area,'span','aom-eyebrow','EXECUTIVE OPERATIONS');put(area,'h1','','Điều hành dựa trên dữ liệu.');
 para(area,'Một nơi để đọc tình hình, phát hiện điểm nghẽn và quản lý đề xuất. Không suy đoán hoàn thành khi nguồn chưa được xác minh.');
 const cards=make('div','aom-kpis'),pending=state.actions.filter(a=>a.status==='proposed').length,verified=state.actions.filter(a=>a.status==='executed').length;
 for(const [n,label] of [[pending,'Cần xử lý'],[verified,'Đã xác minh'],[state.source?.coverage==='complete'?'Đủ':'Kiểm tra','Độ đầy đủ nguồn']]){const c=make('div','aom-kpi');put(c,'b','',n);put(c,'span','',label);cards.append(c);}
 area.append(cards);return area;
}
function quickPrompts(){
 const s=make('section','aom-quick');put(s,'h3','','Bắt đầu nhanh');
 const grid=make('div','aom-quick-grid');
 const presets=[
 ['Executive Brief','3 ưu tiên, 3 rủi ro','Tổng hợp tình hình tuần hiện tại với tối đa 3 Must-Win outcomes, 3 risks và một stop/defer dựa trên nguồn.'],
 ['Tối ưu tuần','Giảm quá tải','Rà soát workload tuần và đề xuất việc cần hoãn, giữ nguyên lịch hẹn đã cam kết và buffer.'],
 ['Kiểm tra gap','Bằng chứng & tiến độ','Tìm các khoảng trống bằng chứng, trạng thái chưa xác minh và 3 hành động ưu tiên nhất.']
 ];
 for(const [title,subtitle,prompt] of presets){const b=make('button','aom-quick-card');b.type='button';put(b,'strong','',title);put(b,'small','',subtitle);put(b,'span','','↗');b.addEventListener('click',()=>{box.value=prompt;box.focus();});grid.append(b);}
 s.append(grid);return s;
}
function numbered(parent,title,arr,klass){
 if(!Array.isArray(arr)||!arr.length)return;
 const section=make('section','aom-brief-section '+klass);put(section,'h3','',title);
 arr.slice(0,3).forEach((t,i)=>{const r=make('div','aom-brief-row');put(r,'span','aom-index',String(i+1).padStart(2,'0'));para(r,String(t),'');section.append(r);});parent.append(section);
}
function plainMarkdown(parent,raw){
 let bullets=null;
 for(const line of String(raw||'').split(/\r?\n/).slice(0,200)){
 const t=line.trim();if(!t){bullets=null;continue;}const h=t.match(/^#{1,5}\s+(.+)/);
 if(h){put(parent,'h3','aom-raw-heading',h[1].replace(/\*\*/g,''));bullets=null;continue;}
 const b=t.match(/^(?:[-*]|\d+[.)])\s+(.+)/);
 if(b){if(!bullets){bullets=make('ul','aom-raw-list');parent.append(bullets);}put(bullets,'li','',b[1].replace(/\*\*/g,''));continue;}
 para(parent,t.replace(/\*\*/g,''),'aom-raw-paragraph');
 }
}
function brief(run){
 const section=make('section','aom-brief'),data=run.summary||{};
 const header=make('div','aom-brief-head');put(header,'span','aom-eyebrow','MANUS EXECUTIVE BRIEF');put(header,'time','',time(run.created_at));section.append(header);
 put(section,'h2','','Phân tích mới nhất');
 if(data.situation){
 para(section,data.situation,'aom-situation');numbered(section,'Ưu tiên',data.priorities,'aom-priorities');numbered(section,'Rủi ro',data.risks,'aom-risks');
 if(Array.isArray(data.recommendations)&&data.recommendations.length){
 const s=make('section','aom-brief-section');put(s,'h3','','Hành động đề xuất');
 data.recommendations.slice(0,3).forEach((a,i)=>{const row=make('div','aom-rec');put(row,'span','aom-index',String(i+1).padStart(2,'0'));const copy=make('div');put(copy,'strong','',a.title);para(copy,a.why);row.append(copy);s.append(row);});section.append(s);
 }
 if(data.unknowns){const note=make('div','aom-unknown');put(note,'strong','','Chưa xác minh');para(note,data.unknowns);section.append(note);}
 }else plainMarkdown(section,data.raw||'Chưa có nội dung phản hồi từ Manus.');
 try{const link=new URL(run.task_url);if(link.protocol==='https:'&&['manus.im','www.manus.im','manus.ai','www.manus.ai'].includes(link.hostname)){const a=put(section,'a','aom-task-link','Xem task trên Manus ↗');a.href=link.href;a.target='_blank';a.rel='noopener noreferrer';}}catch{}
 return section;
}
function actionCard(a,detailed=false){
 const card=make('article','aom-action'+(a.priority==='high'?' high':'')),top=make('div','aom-action-top');
 put(top,'span','',scopeTitles[a.scope]||'Personal OS');put(top,'span','aom-action-state',a.status==='executed'?'Đã xác minh':a.status==='dismissed'?'Đã bỏ qua':a.priority==='high'?'Ưu tiên cao':'Đề xuất');card.append(top);
 put(card,'h4','',a.title);if(detailed)para(card,a.detail);
 if(a.evidence)para(card,'Nguồn: '+a.evidence,'aom-evidence');
 if(a.status==='proposed'){
 const actions=make('div','aom-action-buttons');
 if(a.operation==='save_review_note'){const save=put(actions,'button','aom-save','Lưu review');save.type='button';save.disabled=state.busy;save.title='Lưu vào nhật ký nội bộ, không thay đổi Notion';save.addEventListener('click',()=>void decide(a,'save_note'));}
 const dismiss=put(actions,'button','aom-dismiss','Bỏ qua');dismiss.type='button';dismiss.disabled=state.busy;dismiss.addEventListener('click',()=>void decide(a,'dismiss'));
 card.append(actions);
 }else if(a.status==='executed')para(card,'✓ Đã lưu và đọc lại xác minh · '+time(a.verified_at),'aom-verified');
 return card;
}
function actionsView(){
 const root=make('section','aom-page');put(root,'span','aom-eyebrow','ACTION QUEUE');put(root,'h2','','Hành động & phê duyệt');
 para(root,'Tự động phát hiện vấn đề; chỉ lưu ghi chú review khi bạn duyệt. Chưa có quyền sửa Notion, deadline, KPI hoặc dữ liệu thương mại.');
 let total=0;
 for(const [status,name] of [['proposed','Chờ xử lý'],['executed','Đã xác minh'],['dismissed','Đã bỏ qua']]){
 const rows=state.actions.filter(a=>a.status===status);if(!rows.length)continue;total+=rows.length;const group=make('div','aom-action-group');put(group,'h3','',name+' · '+rows.length);rows.slice(0,25).forEach(a=>group.append(actionCard(a,true)));root.append(group);
 }
 if(!total)para(root,'Chưa có hành động. Chọn kiểm tra nguồn hoặc yêu cầu Manus phân tích.');
 return root;
}
function historyView(){
 const root=make('section','aom-page');put(root,'span','aom-eyebrow','AUDIT HISTORY');put(root,'h2','','Lịch sử AI runs');
 para(root,'Lưu lại những lần phân tích. Một AI run không đồng nghĩa với một hành động đã thực hiện.');
 if(!state.runs.length)para(root,'Chưa có run nào được lưu.');
 state.runs.forEach(r=>{const b=make('button','aom-history');b.type='button';const top=make('div','aom-history-meta');put(top,'span','',scopeTitles[r.scope]||'Personal OS');put(top,'span','',time(r.created_at));b.append(top);put(b,'strong','',r.question);put(b,'span','aom-history-status',r.status==='stopped'?'Đã hoàn tất':r.status==='running'?'Đang xử lý':r.status==='waiting'?'Cần thao tác':'Lỗi');b.addEventListener('click',()=>{state.output=r;state.tab='overview';draw();if(r.status==='running')void watch(r.id);});root.append(b);});
 return root;
}
function settingsView(){
 const root=make('section','aom-page');put(root,'span','aom-eyebrow','PERMISSIONS');put(root,'h2','','Quyền vận hành · Level B');
 para(root,'Autonomy không có nghĩa là giao toàn bộ dữ liệu hoặc quyền ghi cho Manus. Mọi thao tác đều được kiểm soát từ Personal OS.');
 const opts=[
 ['Tự kiểm tra dữ liệu','Khi mở AI Manager; không gọi Manus, không tiêu tốn credits.','Đang bật'],
 ['Phân tích bằng Manus','Chỉ chạy sau khi nhấn Phân tích.','Theo yêu cầu'],
 ['Ghi nhật ký nội bộ','Có nút duyệt và bước đọc lại xác minh.','Cần duyệt'],
 ['Chỉnh sửa Notion, KPI và lịch đã cam kết','Chưa có connector ghi nguồn và rollback được xác minh.','Chưa cấp quyền']
 ];
 for(const [title,desc,label] of opts){const row=make('div','aom-setting');const copy=make('div');put(copy,'strong','',title);para(copy,desc);row.append(copy);put(row,'span','',label);root.append(row);}
 const label=make('label','aom-consent'),check=make('input');check.type='checkbox';check.checked=state.includeDetails;check.addEventListener('change',()=>{state.includeDetails=check.checked;});label.append(check);const text=make('div');put(text,'strong','','Cho Manus đọc nội dung task cá nhân');para(text,'Mặc định tắt. Khi bật, tối đa 25 task cá nhân của snapshot hiện hành được gửi trong một lần phân tích. Không gửi dữ liệu chi tiết Servicebio.');label.append(text);root.append(label);
 const note=make('div','aom-unknown');para(note,'Notion Weekly Planner là nguồn kế hoạch tuần. Dashboard chỉ có snapshot. Manus không được cấp connector để sửa Notion.');root.append(note);return root;
}
function draw(){
 if(!state.open)return;
 overlay.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===state.tab;b.classList.toggle('selected',active);b.setAttribute('aria-selected',String(active));});
 sourceLine();body.replaceChildren();
 const pending=state.actions.filter(a=>a.status==='proposed');
 $('#aom-count').textContent=pending.length?'('+pending.length+')':'';
 $('#aom-rail-count').textContent=String(pending.length);list.replaceChildren();
 if(!pending.length){const empty=make('div','aom-empty');put(empty,'span','','✓');put(empty,'strong','','Không có đề xuất chờ');para(empty,'Kết quả quét nguồn và khuyến nghị mới sẽ xuất hiện tại đây.');list.append(empty);}
 else pending.slice(0,5).forEach(a=>list.append(actionCard(a)));
 if(pending.length>5){const b=put(list,'button','aom-more','Xem tất cả ↗');b.addEventListener('click',()=>{state.tab='actions';draw();});}
 if(state.tab==='actions')body.append(actionsView());
 else if(state.tab==='history')body.append(historyView());
 else if(state.tab==='settings')body.append(settingsView());
 else{body.append(intro());if(state.busy){const progress=make('div','aom-progress');put(progress,'span','aom-loader','');const copy=make('div');put(copy,'strong','','Manus đang phân tích…');para(copy,'Kết quả sẽ hiển thị thành Executive Brief và danh sách đề xuất.');progress.append(copy);body.append(progress);}if(state.output)body.append(brief(state.output));else body.append(quickPrompts());}
 const msg=$('#aom-message');msg.hidden=!state.message;msg.textContent=state.message;
 const btn=$('#aom-submit');btn.disabled=state.busy;btn.textContent=state.busy?'Đang xử lý…':'Phân tích ↗';
}
async function decide(action,choice){
 if(state.busy)return;state.busy=true;draw();
 try{const result=await api('POST','decision',{action_id:action.id,choice});if(!result.action)throw Error('Chưa xác minh thao tác');
 state.message=choice==='save_note'?'Đã lưu review vào nhật ký và readback thành công; Notion không thay đổi.':'Đã bỏ qua đề xuất.';
 await load(true);state.tab='actions';
 }catch(e){state.message='Không thể cập nhật: '+e.message;}finally{state.busy=false;draw();}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));const watching=new Set();
async function watch(id){
 if(watching.has(id))return;watching.add(id);
 try{for(let i=0;i<24;i++){
  await sleep(5000);
  const d=await api('GET','poll',{runId:id});if(d.run)state.output=d.run;
  if(d.run?.status==='waiting'){state.message='Manus đang chờ xác nhận; mở task từ kết quả để tiếp tục.';break;}
  if(d.run?.status==='error'){state.message='Manus không hoàn thành. Kiểm tra lịch sử task.';break;}
  if(d.done){state.message='Đã nhận Executive Brief. Các khuyến nghị đã được đưa vào Action Queue, không sửa nguồn Notion.';break;}
  draw();
 }
 await load(false);
 }catch(e){state.message='Không thể theo dõi tiến độ Manus: '+e.message;}
 finally{watching.delete(id);state.busy=false;draw();}
}
async function analyze(){
 if(state.busy)return;const text=box.value.trim();if(text.length<4){state.message='Hãy nhập yêu cầu cụ thể (ít nhất 4 ký tự).';draw();return;}
 state.busy=true;state.tab='overview';state.output=null;state.message='Đang tạo Manus task. Phân tích này có thể tiêu thụ credits.';draw();
 try{const result=await api('POST','create',{question:text,scope:scope(),includeDetails:state.includeDetails});
  if(!result.run?.id)throw Error('Không nhận được Manus run ID');
  box.value='';state.activeRun=result.run.id;
  state.message='Manus đang phân tích dữ liệu snapshot.';void watch(state.activeRun);draw();
 }catch(e){state.message=e.message;state.busy=false;draw();}
}
$('#aom-form').addEventListener('submit',e=>{e.preventDefault();void analyze();});
box.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();void analyze();}});
setInterval(()=>{if(state.open&&!state.busy&&Date.now()-state.lastLoad>120000)void load(false);},60000);
