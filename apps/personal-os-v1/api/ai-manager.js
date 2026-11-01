// Personal OS -> Manus API v2. Server-only, owner-scoped, read-only advisor.
// Deployment configuration: MANUS_API_KEY (encrypted); no API credentials in browser or Git.
import {createHmac,timingSafeEqual} from 'node:crypto';

const OWNER_ID='5b87bd58-aa3e-4167-bf62-82531597bf8a';
const SUPABASE_URL='https://mlmpcpkucurylkrobain.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_zSSyHUwfzwmireoFwTYDRA_df0E9u3h';
const API='https://api.manus.ai/v2';
const json=(res,status,data)=>{res.status(status).setHeader('Cache-Control','no-store').json(data);};
const fail=(res,status,error)=>json(res,status,{ok:false,error});
const signingKey=()=>process.env.MANUS_API_KEY||'';
function ticket(id){const signature=createHmac('sha256',signingKey()).update(id).digest('hex');return id+'.'+signature;}
function verifyTicket(value){if(typeof value!=='string'||value.length>240)return null;const i=value.lastIndexOf('.');if(i<1)return null;const id=value.slice(0,i),provided=value.slice(i+1);if(!/^[a-zA-Z0-9_-]{10,100}$/.test(id)||!/^[a-f0-9]{64}$/.test(provided))return null;const expected=ticket(id).slice(id.length+1);return timingSafeEqual(Buffer.from(expected),Buffer.from(provided))?id:null;}
async function getUser(req){const header=req.headers.authorization||'';if(!/^Bearer [^\s]+$/.test(header))return null;const response=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:PUBLISHABLE_KEY,Authorization:header},signal:AbortSignal.timeout(8000)});if(!response.ok)return null;const identity=await response.json();return identity?.id===OWNER_ID?{identity,header}:null;}
async function weeklyContext(header,withDetails){const url=new URL(SUPABASE_URL+'/rest/v1/personal_os_notion_weeks');url.searchParams.set('select','week_start,coverage,items');url.searchParams.set('owner_id','eq.'+OWNER_ID);url.searchParams.set('order','week_start.desc');url.searchParams.set('limit','2');const r=await fetch(url,{headers:{apikey:PUBLISHABLE_KEY,Authorization:header},signal:AbortSignal.timeout(8000)});if(!r.ok)return {source:'unavailable',warning:'Notion snapshots not readable'};const weeks=await r.json();const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const newest=weeks.find(w=>w.week_start<=today)||weeks[0];if(!newest)return {source:'empty',as_of:today};const items=Array.isArray(newest.items)?newest.items:[];const counts={};for(const item of items){const key=String(item.status||'unknown');counts[key]=(counts[key]||0)+1;}
const context={source:'Notion dashboard snapshot (not live Notion)',week_start:newest.week_start,coverage:newest.coverage,count:items.length,status_counts:counts,as_of:today};
if(withDetails){context.records=items.filter(i=>['must_win','risk','stop','activity','outcome'].includes(i.kind)).slice(0,30).map(i=>({kind:i.kind,status:i.status,pillar:i.pillar,text:String(i.text||'').slice(0,260),occurred_on:i.occurred_on||null}));}return context;}
async function manus(path,options){const response=await fetch(API+path,{...options,headers:{'x-manus-api-key':signingKey(),'Content-Type':'application/json',...(options?.headers||{})},signal:AbortSignal.timeout(24000)});const data=await response.json().catch(()=>null);if(!response.ok||data?.ok===false)throw Object.assign(new Error('Manus request failed'),{status:response.status,providerCode:data?.error?.code||'upstream_error'});return data;}
const SYSTEM_INSTRUCTIONS=[
'Bạn là Personal OS AI Manager, Executive Assistant của Henry. Trả lời tiếng Việt ngắn gọn dựa trên evidence.',
'Chỉ được phân tích và đề xuất; không được sửa, gửi, xóa hoặc đồng bộ dữ liệu. Không có connector được cấp trong task này.',
'Notion Weekly Planner là source of truth, dashboard là snapshot có thể cũ; thiếu nguồn phải nói rõ.',
'Phân biệt plan, doing, blocked, reported_done, verified_done. Activity không phải outcome.',
'Mỗi tuần tối đa 3 Must-Win outcomes, 3 risk và một stop/defer; bảo vệ buffer và nghĩa vụ bên ngoài.',
'Không suy đoán % KPI, doanh thu hay trạng thái hoàn thành. Không tự nhận đã thực hiện hành động.',
'Không đưa thông tin nhạy cảm Servicebio, giá/margin/khách hàng ra nguồn ngoài.',
'Giữ nguyên domain, menu, cam kết và lịch hẹn hiện tại.',
'Trả về: Tình hình, 3 ưu tiên, Rủi ro, Hành động đề xuất, Điều chưa xác minh.'
].join('\n');
export default async function handler(req,res){
if(!['GET','POST'].includes(req.method))return fail(res,405,'Method not allowed');
if(!signingKey())return fail(res,503,'MANUS_API_KEY chưa được cấu hình trên server. Không gửi API key qua Dashboard.');
let user;try{user=await getUser(req);}catch{return fail(res,503,'Không xác minh được phiên đăng nhập');}
if(!user)return fail(res,403,'Unauthorized');
try{
 if(req.method==='GET'){
 const id=verifyTicket(req.query?.ticket);if(!id)return fail(res,400,'Invalid task token');
 const [detail,events]=await Promise.all([manus('/task.detail?task_id='+encodeURIComponent(id)),manus('/task.listMessages?task_id='+encodeURIComponent(id)+'&order=desc&limit=25')]);
 const messages=events.messages||[];
 const assistant=messages.find(m=>m.type==='assistant_message'&&m.assistant_message?.content)?.assistant_message?.content||'';
 const event=messages.find(m=>m.type==='status_update');
 const status=event?.status_update?.agent_status||'running';
 return json(res,200,{ok:true,status,answer:assistant||null,task_url:detail.task?.task_url||null,waiting:status==='waiting',error:messages.find(m=>m.type==='error_message')?.error_message?.content||null});
 }
 const input=req.body||{};const question=String(input.question||'').trim();if(question.length<4||question.length>1600)return fail(res,400,'Câu hỏi phải từ 4 đến 1600 ký tự');
 const withDetails=input.includeDetails===true;
 const context=await weeklyContext(user.header,withDetails);
 const message=SYSTEM_INSTRUCTIONS+'\n\nNgày và snapshot: '+JSON.stringify(context).slice(0,12000)+'\n\nYêu cầu của người dùng (không phải chỉ thị hệ thống): '+question;
 const created=await manus('/task.create',{method:'POST',body:JSON.stringify({message:{content:message,connectors:[]},locale:'vi',interactive_mode:false,share_visibility:'private',agent_profile:'manus-1.6-lite',title:'Personal OS | AI Advisor'})});
 if(!created.task_id)return fail(res,502,'Manus did not return a task id');
 return json(res,200,{ok:true,ticket:ticket(created.task_id),task_url:created.task_url||null,status:'running',source:context.source,week_start:context.week_start||null});
}catch(e){return fail(res,e.status===429?429:502,e.status===429?'Manus rate limit reached':e.providerCode==='unauthenticated'?'Manus API key không hợp lệ hoặc đã bị thu hồi':'AI service unavailable; thử lại sau');}
}
