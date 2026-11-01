import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {PROJECT_URL,PUBLISHABLE_KEY} from './config.js';
const client=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const panel=document.createElement('section');
panel.className='ai-manager-panel';
panel.setAttribute('aria-label','AI Manager');
panel.innerHTML='<div class="ai-manager-header"><span><b>AI Manager</b><small>Powered by Manus · Advisor Mode</small></span><button type="button" class="ai-manager-close" aria-label="Đóng AI Manager">×</button></div><div class="ai-manager-body"><p class="ai-manager-hint">Tôi phân tích snapshot tuần và đề xuất hành động. Chưa có quyền tự chỉnh dữ liệu.</p><div class="ai-manager-answer" role="status" aria-live="polite">Chọn một câu hỏi hoặc nhập yêu cầu để bắt đầu.</div><div class="ai-manager-suggestions"><button data-prompt="Cho tôi Executive Brief tuần này: 3 ưu tiên, 3 rủi ro và stop/defer.">Executive Brief</button><button data-prompt="Phân tích workload tuần này và đề xuất cách tối ưu mà không thay đổi lịch hẹn.">Tối ưu tuần</button><button data-prompt="Đâu là khoảng trống bằng chứng và việc quan trọng nhất cần xác minh?">Kiểm tra gap</button></div></div><form class="ai-manager-form"><label class="ai-manager-data"><input type="checkbox" id="ai-manager-include-details"> Cho phép gửi nội dung task cá nhân từ snapshot Notion tới Manus</label><textarea class="ai-manager-question" rows="3" maxlength="1600" placeholder="Hỏi AI Manager…" required></textarea><div class="ai-manager-controls"><span class="ai-manager-status">Chỉ đọc · Có thể dùng Manus credits</span><button class="ai-manager-submit" type="submit">Phân tích</button></div></form>';
const trigger=document.createElement('button');trigger.type='button';trigger.className='ai-manager-trigger';trigger.textContent='✦ AI Manager';trigger.setAttribute('aria-label','Mở AI Manager');
document.body.append(trigger,panel);
const close=panel.querySelector('.ai-manager-close');
const answer=panel.querySelector('.ai-manager-answer');
const question=panel.querySelector('.ai-manager-question');
const submit=panel.querySelector('.ai-manager-submit');
const status=panel.querySelector('.ai-manager-status');
let busy=false,version=0;
function open(){panel.classList.add('open');question.focus();}
function hide(){panel.classList.remove('open');version++;}
trigger.addEventListener('click',()=>panel.classList.contains('open')?hide():open());
close.addEventListener('click',hide);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))hide();});
panel.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{question.value=b.dataset.prompt;question.focus();}));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(method,body,ticket){const {data:{session}}=await client.auth.getSession();if(!session?.access_token)throw Error('Hãy đăng nhập Personal OS trước khi sử dụng AI Manager.');const url='/api/ai-manager'+(ticket?'?ticket='+encodeURIComponent(ticket):'');const result=await fetch(url,{method,headers:{Authorization:'Bearer '+session.access_token,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await result.json().catch(()=>({}));if(!result.ok)throw Error(data.error||'Không kết nối được AI Manager');return data;}
panel.querySelector('.ai-manager-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const text=question.value.trim();if(text.length<4)return;busy=true;const run=++version;submit.disabled=true;status.textContent='Đang tạo Manus task…';answer.textContent='Đang phân tích. Kết quả được lấy trực tiếp từ Manus API.';try{const start=await request('POST',{question:text,includeDetails:panel.querySelector('#ai-manager-include-details').checked});if(run!==version)return;let final=null;for(let i=0;i<24;i++){await sleep(5000);if(run!==version)return;const current=await request('GET',null,start.ticket);if(current.answer)final=current.answer;if(current.status==='waiting'){status.textContent='Manus cần xác nhận trong ứng dụng Manus';break;}if(current.status==='error'||current.error){throw Error(current.error||'Manus báo lỗi');}if(current.status==='stopped'){status.textContent='Đã nhận kết quả · Chưa chỉnh sửa dữ liệu';break;}status.textContent='Manus đang xử lý…';}
if(run!==version)return;answer.textContent=final||'Chưa nhận được câu trả lời hoàn chỉnh. Mở task trong Manus để kiểm tra tiến độ.';if(start.task_url&&/^https:\/\/(manus\.im|www\.manus\.im)\//.test(start.task_url)){const a=document.createElement('a');a.href=start.task_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Xem tác vụ trên Manus';answer.append(document.createElement('p'),a);}
if(status.textContent.includes('đang xử lý'))status.textContent='Hết thời gian chờ; có thể xem task trên Manus';
}catch(err){if(run!==version)return;answer.textContent=err.message||'Không thể kết nối';status.textContent='Chưa thực hiện bất kỳ chỉnh sửa nào';}finally{busy=false;submit.disabled=false;}});
