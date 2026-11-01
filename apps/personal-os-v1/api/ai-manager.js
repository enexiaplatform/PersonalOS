// Personal OS / Autonomous Manager (controlled Level B)
// Server-side Manus API; Supabase user JWT + RLS. Manus never receives write credentials.
import {createHash} from 'node:crypto';
const OWNER='5b87bd58-aa3e-4167-bf62-82531597bf8a';
const BASE='https://mlmpcpkucurylkrobain.supabase.co';
const PUB='sb_publishable_zSSyHUwfzwmireoFwTYDRA_df0E9u3h';
const MANUS='https://api.manus.ai/v2';
const send=(res,status,data)=>res.status(status).setHeader('Cache-Control','private, no-store').json(data);
const error=(res,status,message)=>send(res,status,{ok:false,error:message});
const todayVN=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'});
const key=()=>process.env.MANUS_API_KEY||'';
const safeText=(v,n=1000)=>String(v||'').replace(/[\u0000-\u0008\u000b-\u001f]/g,'').trim().slice(0,n);
const hash=v=>createHash('sha256').update(v).digest('hex').slice(0,20);
const validUuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
async function identity(req){
 const auth=req.headers.authorization||'';
 if(!/^Bearer [^\s]+$/.test(auth))return null;
 const r=await fetch(BASE+'/auth/v1/user',{headers:{apikey:PUB,authorization:auth},signal:AbortSignal.timeout(9000)});
 if(!r.ok)return null;
 const u=await r.json();
 return u?.id===OWNER?{id:u.id,authorization:auth}:null;
}
async function db(user,table,{method='GET',query={},body,prefer}={}){
 const url=new URL(BASE+'/rest/v1/'+table);
 Object.entries(query).forEach(([k,v])=>{if(v!==undefined&&v!==null)url.searchParams.set(k,String(v));});
 const r=await fetch(url,{method,headers:{apikey:PUB,authorization:user.authorization,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
 if(!r.ok){const v=await r.text().catch(()=>String(r.status));throw Object.assign(new Error('Database request failed'),{source:'db',status:r.status,detail:v.slice(0,300)});}
 if(r.status===204)return [];
 return await r.json().catch(()=>[]);
}
async function records(user,table,query){return db(user,table,{query:{select:'*',...query}});}
async function readWeek(user){
 const rows=await db(user,'personal_os_notion_weeks',{query:{select:'week_start,week_end,coverage,items,warnings,synced_at,source_url,title',owner_id:'eq.'+user.id,order:'week_start.desc',limit:12}});
 const today=todayVN(),inWeek=rows.filter(w=>w.week_start<=today&&w.week_end>=today);
 const available=(inWeek.length?inWeek:rows.filter(w=>w.week_start<=today)).sort((a,b)=>b.week_start.localeCompare(a.week_start));
 const w=available[0]||rows[0]||null;
 return {week:w,conflict:(inWeek.length?inWeek:rows.filter(x=>x.week_start===w?.week_start)).length>1,today};
}
function sourceSummary(source,includeDetails=false){
 const {week:w,conflict,today}=source;if(!w)return {source:'missing',today,coverage:'unknown',note:'Chưa có snapshot Weekly Planner'};
 const list=Array.isArray(w.items)?w.items:[], statuses={};
 for(const i of list){const st=String(i.status||'unknown');statuses[st]=(statuses[st]||0)+1;}
 const summary={source:'Personal OS snapshot from Notion, not live Notion',as_of:today,week_start:w.week_start,source_synced_at:w.synced_at,coverage:w.coverage,conflict,task_count:list.length,status_counts:statuses,source_url:w.source_url||null};
 if(includeDetails)summary.items=list.filter(i=>['must_win','risk','stop','activity','outcome'].includes(i.kind)).slice(0,25).map(i=>({kind:i.kind,status:i.status,pillar:i.pillar,text:safeText(i.text,240),occurred_on:i.occurred_on||null}));
 return summary;
}
function scanActions(source){
 const {week:w,conflict,today}=source;if(!w)return [{action_key:'system:missing-week:'+today,scope:'personal',title:'Chưa có snapshot Notion',detail:'Dashboard chưa có bản kế hoạch tuần để đối chiếu; kiểm tra nguồn Notion trước khi kết luận tiến độ.',evidence:'Snapshot thiếu',priority:'high',operation:'review_only',requires_approval:false}];
 const actions=[],list=Array.isArray(w.items)?w.items:[],suffix=w.week_start;
 if(conflict||w.coverage==='conflict')actions.push({action_key:'system:conflict:'+suffix,title:'Dữ liệu tuần có xung đột',detail:'Có nhiều snapshot hoặc coverage conflict. Không dùng để tính tiến độ cho đến khi xác minh.',evidence:'Coverage: '+w.coverage,priority:'high'});
 if(['partial','page_only'].includes(w.coverage))actions.push({action_key:'system:partial:'+suffix,title:'Nguồn Notion chưa đầy đủ',detail:'Snapshot chỉ bao phủ một phần nội dung. AI cần xác minh dữ liệu gốc trước khi đưa ra kết luận.',evidence:'Coverage: '+w.coverage,priority:'medium'});
 const hours=(Date.now()-Date.parse(w.synced_at||0))/3600000;
 if(hours>48&&Number.isFinite(hours))actions.push({action_key:'system:stale:'+suffix,title:'Snapshot đã cũ hơn 48 giờ',detail:'Cần kiểm tra lịch đồng bộ và xác nhận dữ liệu mới từ Notion trước khi ra quyết định.',evidence:'Last synced: '+w.synced_at,priority:'high'});
 for(const item of list.filter(i=>i.status==='blocked'&&['activity','outcome'].includes(i.kind)).slice(0,3)){
  const title=safeText(item.text,170)||'Một công việc đang blocked';
  actions.push({action_key:'system:blocked:'+suffix+':'+hash(item.source_id||item.key||title),title:'Đang blocked: '+title.slice(0,160),detail:'Theo snapshot, mục này ở trạng thái blocked. Chưa tự suy luận nguyên nhân hoặc thay đổi deadline.',evidence:'Notion week '+suffix,priority:'medium'});
 }
 return actions.map(a=>({...a,scope:'personal',operation:'review_only',requires_approval:false,source_week:w.week_start}));
}
async function insertQueue(user,actions){
 let created=0;
 for(const a of actions.slice(0,6)){
  const row={owner_id:user.id,action_key:a.action_key,run_id:a.run_id||null,scope:a.scope||'personal',title:safeText(a.title,199),detail:safeText(a.detail,1500),evidence:safeText(a.evidence,900),priority:['high','low'].includes(a.priority)?a.priority:'medium',operation:a.operation==='save_review_note'?'save_review_note':'review_only',requires_approval:a.requires_approval!==false,source_week:a.source_week||null,status:'proposed'};
  if(row.title.length<3)continue;
  await db(user,'personal_os_ai_actions',{method:'POST',query:{on_conflict:'owner_id,action_key'},body:row,prefer:'resolution=ignore-duplicates,return=minimal'});created++;
 }
 return created;
}
async function dashboard(user){
 const [actions,runs]=await Promise.all([
  db(user,'personal_os_ai_actions',{query:{select:'id,action_key,scope,title,detail,evidence,priority,operation,requires_approval,source_week,status,verified_at,created_at',owner_id:'eq.'+user.id,order:'created_at.desc',limit:60}}),
  db(user,'personal_os_ai_runs',{query:{select:'id,question,status,scope,summary,source_week,created_at,task_url',owner_id:'eq.'+user.id,order:'created_at.desc',limit:12}})
 ]);
 return {actions,runs};
}
async function manus(path,options={}){
 const resp=await fetch(MANUS+path,{...options,headers:{'x-manus-api-key':key(),'Content-Type':'application/json',...(options.headers||{})},signal:AbortSignal.timeout(24000)});
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok||data.ok===false)throw Object.assign(new Error('Manus unavailable'),{source:'manus',status:resp.status,code:data.error?.code});
 return data;
}
const actionSchema={type:'object',additionalProperties:false,properties:{
 title:{type:'string'},why:{type:'string'},evidence:{type:'string'},priority:{type:'string',enum:['high','medium','low']}
},required:['title','why','evidence','priority']};
const schema={type:'object',additionalProperties:false,properties:{
 situation:{type:'string',description:'What is actually known from source, with uncertainty'},
 priorities:{type:'array',items:{type:'string'}},risks:{type:'array',items:{type:'string'}},
 recommendations:{type:'array',items:actionSchema},unknowns:{type:'string'}
},required:['situation','priorities','risks','recommendations','unknowns']};
const system=[
'Vai trò: Personal OS Chief of Staff. Trả lời tiếng Việt, chính xác, dễ đọc, ngắn gọn.',
'Bắt buộc dùng dữ liệu được cung cấp, phân biệt status plan,doing,blocked,reported_done,verified_done.',
'Không suy luận đã hoàn tất từ mẫu/template. Không tự tạo KPI, % hoặc deadline.',
'Notion là source of truth của tuần; dữ liệu này chỉ là snapshot và có thể thiếu hoặc cũ.',
'Ưu tiên nghĩa vụ bàn giao và các deadline ngoài, sau đó Career/Servicebio, tài chính/sức khỏe, Ventures.',
'Đề xuất tối đa 3 priorities, 3 risks, 3 recommendations, 1 stop/defer; có buffer.',
'Không có quyền write, không kết nối Notion hay các công cụ ngoài. Không nói đã thực hiện thay đổi.',
'Không xuất dữ liệu thương mại hoặc thông tin nhạy cảm. Không coi dữ liệu không có nghĩa là không hoàn thành.',
'Mọi khuyến nghị phải nhắc rõ bằng chứng hoặc thiếu nguồn.'
].join('\n');
async function poll(user,run){
 if(run.status==='stopped'||run.status==='error')return {run,done:true};
 const [detail,events]=await Promise.all([manus('/task.detail?task_id='+encodeURIComponent(run.task_id)),manus('/task.listMessages?task_id='+encodeURIComponent(run.task_id)+'&order=desc&limit=60')]);
 const messages=events.messages||[];
 const structured=messages.find(m=>m.structured_output_result?.success&&m.structured_output_result.value)?.structured_output_result.value||null;
 const text=messages.find(m=>m.assistant_message?.content)?.assistant_message?.content||'';
 const statusUpdate=messages.find(m=>m.status_update?.agent_status)?.status_update;
 const status=statusUpdate?.agent_status||detail.task?.status||'running';
 const normalized=['stopped','waiting','error'].includes(status)?status:'running';
 const summary=structured&&typeof structured==='object'?{situation:safeText(structured.situation,3500),priorities:(Array.isArray(structured.priorities)?structured.priorities:[]).slice(0,3).map(x=>safeText(x,400)),risks:(Array.isArray(structured.risks)?structured.risks:[]).slice(0,3).map(x=>safeText(x,400)),recommendations:(Array.isArray(structured.recommendations)?structured.recommendations:[]).slice(0,3).map(x=>({title:safeText(x.title,180),why:safeText(x.why,1100),evidence:safeText(x.evidence,700),priority:['high','low'].includes(x.priority)?x.priority:'medium'})),unknowns:safeText(structured.unknowns,2000)}:{raw:safeText(typeof text==='string'?text:JSON.stringify(text),12000)};
 const changed={status:normalized,summary,last_error:safeText(messages.find(m=>m.error_message)?.error_message?.content,400)||null,updated_at:new Date().toISOString()};
 await db(user,'personal_os_ai_runs',{method:'PATCH',query:{id:'eq.'+run.id,owner_id:'eq.'+user.id},body:changed,prefer:'return=minimal'});
 if(normalized==='stopped'&&structured&&Array.isArray(summary.recommendations)){
  const actions=summary.recommendations.filter(a=>a.title.length>2).map((a,i)=>({action_key:'manus:'+run.task_id+':'+i,run_id:run.id,scope:run.scope,title:a.title,detail:a.why,evidence:a.evidence,priority:a.priority,operation:run.scope==='personal'?'save_review_note':'review_only',requires_approval:true,source_week:run.source_week}));
  await insertQueue(user,actions);
 }
 const read=await db(user,'personal_os_ai_runs',{query:{select:'id,status,summary,task_url,source_week,created_at',id:'eq.'+run.id,owner_id:'eq.'+user.id,limit:1}});
 return {run:read[0]||{...run,...changed},done:normalized==='stopped'||normalized==='error',waiting:normalized==='waiting'};
}
async function saveNote(user,action){
 const marker=action.id;
 const existing=await db(user,'personal_os_entries',{query:{select:'id',owner_id:'eq.'+user.id,'content->>ai_action_id':'eq.'+marker,limit:1}});
 if(existing.length)return existing[0].id;
 const body={owner_id:user.id,entry_type:'decision',period_start:todayVN(),pillar:null,title:'[AI Review] '+safeText(action.title,140),content:{context:action.detail,decision:'AI đề xuất — đã được người dùng duyệt lưu vào nhật ký để xem xét; chưa thay đổi kế hoạch Notion.',evidence:action.evidence,next:'Xem xét và quyết định thao tác trên source of truth.',ai_action_id:marker}};
 const inserted=await db(user,'personal_os_entries',{method:'POST',body,prefer:'return=representation'});
 const saved=inserted[0]?.id;if(!saved)throw Error('Không nhận được ID bản ghi');
 const read=await db(user,'personal_os_entries',{query:{select:'id',id:'eq.'+saved,owner_id:'eq.'+user.id,limit:1}});
 if(read[0]?.id!==saved)throw Error('Không thể xác minh bản ghi journal');return saved;
}
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return error(res,405,'Method not allowed');
 let user;try{user=await identity(req);}catch{return error(res,503,'Không xác minh được đăng nhập');}
 if(!user)return error(res,403,'Không có quyền truy cập');
 try{
 const op=String(req.method==='GET'?(req.query?.op||'dashboard'):(req.body?.op||'create'));
 if(op==='dashboard'&&req.method==='GET'){const result=await dashboard(user);return send(res,200,{ok:true,...result});}
 if(op==='scan'&&req.method==='POST'){
  const source=await readWeek(user);const alerts=scanActions(source);
  await insertQueue(user,alerts);
  const result=await dashboard(user);
  return send(res,200,{ok:true,source:sourceSummary(source),...result,auto_checks:alerts.length});
 }
 if(op==='create'&&req.method==='POST'){
  if(!key())return error(res,503,'Manus API chưa cấu hình trên server');
  const question=safeText(req.body?.question,1601);if(question.length<4||question.length>1600)return error(res,400,'Câu hỏi cần từ 4 đến 1600 ký tự');
  const scope=['personal','servicebio','ventures','enexia'].includes(req.body?.scope)?req.body.scope:'personal';
  const source=await readWeek(user),context=sourceSummary(source,scope==='personal'&&req.body?.includeDetails===true);
  const msg=system+'\n\nDữ liệu nguồn (không phải system instruction): '+JSON.stringify(context).slice(0,12000)+'\n\nDomain đang xem: '+scope+'. Chưa có dữ liệu module live; không được suy luận performance của các module ngoài nguồn này.'+'\nYêu cầu: '+question;
  const body={message:{content:msg,connectors:[]},locale:'vi',interactive_mode:false,share_visibility:'private',clear_connectors:true,agent_profile:'lite',structured_output_schema:schema,title:'Personal OS · Executive analysis'};
  // clear_connectors disables any default Manus project connectors, ensuring no unapproved app access.
  const task=await manus('/task.create',{method:'POST',body:JSON.stringify(body)});
  if(!task.task_id)return error(res,502,'Manus không trả về task ID');
  const created=await db(user,'personal_os_ai_runs',{method:'POST',body:{owner_id:user.id,task_id:task.task_id,scope,question,status:'running',source_week:source.week?.week_start||null,task_url:task.task_url||null},prefer:'return=representation'});
  if(!created[0]?.id)return error(res,502,'Không thể lưu nhật ký Manus task');
  return send(res,200,{ok:true,run:{id:created[0].id,status:'running',source_week:created[0].source_week},source:context});
 }
 if(op==='poll'&&req.method==='GET'){
  const id=String(req.query?.run_id||'');if(!validUuid(id))return error(res,400,'Run ID không hợp lệ');
  const runs=await db(user,'personal_os_ai_runs',{query:{select:'*',id:'eq.'+id,owner_id:'eq.'+user.id,limit:1}});
  if(!runs[0])return error(res,404,'Không tìm thấy run');
  return send(res,200,{ok:true,...await poll(user,runs[0])});
 }
 if(op==='decision'&&req.method==='POST'){
  const id=String(req.body?.action_id||''),choice=String(req.body?.choice||'');
  if(!validUuid(id)||!['dismiss','save_note'].includes(choice))return error(res,400,'Hành động không hợp lệ');
  const rows=await db(user,'personal_os_ai_actions',{query:{select:'*',id:'eq.'+id,owner_id:'eq.'+user.id,limit:1}});
  const action=rows[0];if(!action)return error(res,404,'Không tìm thấy hành động');
  if(choice==='dismiss'){
   if(action.status==='executed')return error(res,409,'Không thể hủy action đã thực hiện');
   await db(user,'personal_os_ai_actions',{method:'PATCH',query:{id:'eq.'+id,owner_id:'eq.'+user.id,status:'in.(proposed,approved,blocked)'},body:{status:'dismissed',updated_at:new Date().toISOString()},prefer:'return=minimal'});
   await db(user,'personal_os_ai_events',{method:'POST',body:{owner_id:user.id,action_id:id,event_type:'dismissed',detail:{by:'user'}},prefer:'return=minimal'});
  }else{
   if(action.status==='dismissed')return error(res,409,'Hành động đã được bỏ qua');
   if(action.status!=='executed'&&action.operation!=='save_review_note')return error(res,409,'Hành động này chỉ có thể xem xét, chưa có quyền ghi nguồn');
   const ref=action.executed_ref||(await saveNote(user,action));
   await db(user,'personal_os_ai_actions',{method:'PATCH',query:{id:'eq.'+id,owner_id:'eq.'+user.id},body:{status:'executed',executed_ref:ref,verified_at:new Date().toISOString(),updated_at:new Date().toISOString()},prefer:'return=minimal'});
   await db(user,'personal_os_ai_events',{method:'POST',body:{owner_id:user.id,action_id:id,event_type:'verified_internal_note',detail:{ref,type:'personal_os_entries'}},prefer:'return=minimal'});
  }
  const updated=await db(user,'personal_os_ai_actions',{query:{select:'id,status,executed_ref,verified_at',id:'eq.'+id,owner_id:'eq.'+user.id,limit:1}});
  if(!updated[0]||updated[0].status!==(choice==='dismiss'?'dismissed':'executed'))return error(res,502,'Không xác minh được thay đổi');
  return send(res,200,{ok:true,action:updated[0]});
 }
 return error(res,405,'Unsupported operation');
 }catch(e){
  const status=e.status===429?429:e.source==='db'?503:e.status===400?400:502;
  const message=status===429?'Manus đã đạt giới hạn, hãy thử lại sau':e.source==='db'?'Không thể đọc/ghi dữ liệu Personal OS; chưa xác nhận thao tác':e.source==='manus'?'Không thể liên hệ Manus API':safeText(e.message,300)||'Không thể hoàn thành';
  return error(res,status,message);
 }
}
