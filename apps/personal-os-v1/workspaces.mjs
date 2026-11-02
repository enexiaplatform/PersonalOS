import {icon,statementParts} from './experience.mjs';
export const MODULES=Object.freeze({personal:{name:'Personal OS',eyebrow:'01 / LIFE & DIRECTION',description:'Ưu tiên rõ ràng. Giữ nhịp cuộc sống. Nhìn thấy mình tiến bộ.',sections:'Tuần của tôi · Gantt Pro · Bản đồ tiến bộ',mark:'◈'},servicebio:{name:'Servicebio',eyebrow:'02 / SCIENCE & COMMERCE',description:'Từ bằng chứng khoa học đến chiến lược và hành động thương mại.',sections:'Commercial · Intelligence · Market Explorer',mark:'✳'},ventures:{name:'Ventures',eyebrow:'03 / BUILD & EXPLORE',description:'Theo sát danh mục. Kiểm chứng giả thuyết. Ra quyết định có căn cứ.',sections:'B2C · Night Food · DP Lab · TrendBridge',mark:'↗'},enexia:{name:'Enexia',eyebrow:'04 / PRODUCT & PLATFORM',description:'Phát triển hệ sinh thái phần mềm. Kiểm chứng giá trị. Kết nối quyết định với kết quả.',sections:'Memoire · Helm · Sentinel · Forge · Flow',mark:'⌘'}});
export function parseWorkspaceHash(hash){const [module,view]=hash.replace(/^#/,'').split('/');return module==='personal'?{module,view:/^(overview|calendar|gantt|progress|life|business|blueprint|review|notion|weekly|monthly|evidence|decision|settings)$/.test(view)?view:'overview'}:Object.hasOwn(MODULES,module)?{module,view:null}:{module:'home',view:null};}
export function artwork(name){let shapes='';if(name==='personal'){for(let i=0;i<7;i++)shapes+=`<ellipse cx="220" cy="184" rx="${45+i*24}" ry="${15+i*10}"/><path d="M${220+i*19} ${184-i*14}v${-48-i*8}"/><circle cx="${220+i*19}" cy="${136-i*22}" r="4"/>`;shapes+='<ellipse class="solid" cx="220" cy="184" rx="38" ry="13"/>';}else if(name==='servicebio'){for(let i=0;i<3;i++){const x=108+i*105,y=178-i*43;shapes+=`<path class="pane" d="M${x} ${y-45}l78 38-78 40-78-40z"/><path d="M${x} ${y-45}v-61m-78 99v54l78 40 78-40v-54"/><circle cx="${x}" cy="${y-106}" r="5"/><path d="M${x-12} ${y-11}h24m-12-12v24"/>`;}}else if(name==='enexia'){shapes='<path d="M100 110L220 70L340 110L340 220L220 260L100 220Z"/><path d="M100 110L220 180L340 110M220 180V260M220 70V180"/><circle class="solid" cx="220" cy="180" r="15"/><circle cx="100" cy="110" r="9"/><circle cx="340" cy="110" r="9"/><circle cx="220" cy="70" r="9"/><circle cx="220" cy="260" r="9"/>';}else{for(let i=0;i<3;i++){const y=211-i*60;shapes+=`<path class="pane" d="M60 ${y}l235-104 95 45-235 104z"/><path d="M295 ${y-104}v-55m-140 159v-55"/><path class="solid" d="M${158+i*54} ${y-21}v-30l20-10 20 10v30l-20 10z"/>`;}}return `<svg class="portal-art" viewBox="0 0 440 300" aria-hidden="true"><g>${shapes}</g></svg>`;}
export function renderWorkspaceHome({escape:s,metadata={},weekCount=null,last='personal'}={}){
 const icons={personal:'calendar',servicebio:'target',ventures:'bag',enexia:'gantt'};
 return `<section class="platform-home"><header class="platform-heading"><h1>Không gian làm việc</h1><p>Chọn không gian để tiếp tục công việc.</p></header><nav class="platform-spaces" aria-label="Các không gian làm việc">${Object.entries(MODULES).map(([id,module])=>{const stamp=metadata[id]?.source_updated_at;const source=id==='personal'?(weekCount===null?'Đang đọc nguồn kế hoạch':weekCount+' bản ghi tuần'):stamp?'Nguồn · '+s(new Date(stamp).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})):'Chưa đọc được thời điểm nguồn';return `<button type="button" class="portal portal-${id} ui-card platform-space" data-workspace="${id}"><span class="platform-space-icon">${icon(icons[id])}</span><strong>${module.name}</strong><p>${module.description}</p><span class="platform-space-sections">${module.sections}</span><span class="platform-space-source">${source}</span><span class="platform-space-open">Mở không gian ${icon('arrow')}</span></button>`;}).join('')}</nav>${Object.hasOwn(MODULES,last)?`<div class="platform-resume"><span>Không gian gần nhất · ${MODULES[last].name}</span><button class="ui-button ui-button--secondary" type="button" data-workspace="${last}">Tiếp tục ${icon('arrow')}</button></div>`:''}</section>`;
}
export function withExecutiveTheme(html,module){
 if(!['servicebio','ventures','enexia'].includes(module))return html;
 // Isolated workspaces ship their own foundation through their source build.
 // Parent CSS cannot style an iframe and must not override that module's recipes.
 return html.replace(/<body\b/i,'<body data-executive-module="'+module+'"');
}
export function createWorkspaceGateway({db,getUser,container,onMetadata}){
 const frames=new Map(),prepared=new Map(),reading=new Map(),bootSnapshots=new Map();let generation=0,metadata={},metadataTask=null;
 const valid=module=>['servicebio','ventures','enexia'].includes(module);
 function readSource(module){
  if(!valid(module))return Promise.reject(Error('Module không hợp lệ'));
  const owner=getUser()?.id,stamp=generation;if(!owner)return Promise.reject(Error('Cần đăng nhập'));
  const key=owner+':'+module;if(reading.has(key))return reading.get(key);
  const task=(async()=>{const query=module==='enexia'?db.from('personal_os_enexia_snapshots').select('payload,source_updated_at').eq('owner_id',owner):db.from('personal_os_module_snapshots').select('payload,source_updated_at,mirrored_at').eq('owner_id',owner).eq('module',module);const {data,error}=await query.maybeSingle();if(error)throw error;if(generation!==stamp||getUser()?.id!==owner)throw Error('Phiên đã thay đổi');if(!data)throw Error('Chưa có bản dữ liệu cho tài khoản này');return data.payload;})();
  reading.set(key,task);void task.finally(()=>{if(reading.get(key)===task)reading.delete(key);}).catch(()=>{});return task;
 }
 async function read(module){const boot=bootSnapshots.get(module);if(boot&&boot.owner===getUser()?.id){bootSnapshots.delete(module);return boot.task;}return readSource(module);}
 window.PersonalOSModuleBridge=Object.freeze({read});
 async function refreshMetadata(){
  if(metadataTask)return metadataTask;const owner=getUser()?.id,stamp=generation;if(!owner)return;
  const task=(async()=>{const {data,error}=await db.from('personal_os_module_snapshots').select('module,source_updated_at,mirrored_at').eq('owner_id',owner);if(error||generation!==stamp||getUser()?.id!==owner)return;metadata=Object.fromEntries((data||[]).map(x=>[x.module,x]));onMetadata(metadata);})();metadataTask=task;try{await task;}finally{if(metadataTask===task)metadataTask=null;}
 }
 function preload(module){
  if(!valid(module))return Promise.resolve(null);const owner=getUser()?.id,stamp=generation;if(!owner)return Promise.resolve(null);
  const key=owner+':'+module;if(prepared.has(key))return prepared.get(key);
  const task=(async()=>{let html;if(module==='enexia'){const response=await fetch('./enexia.html');if(!response.ok)throw Error('Không tải được giao diện Enexia');html=await response.text();}else{const {data,error}=await db.from('personal_os_module_assets').select('content_gzip_base64').eq('owner_id',owner).eq('module',module).maybeSingle();if(error)throw error;if(!data)throw Error('Giao diện module chưa sẵn sàng cho tài khoản này.');const bytes=Uint8Array.from(atob(data.content_gzip_base64),c=>c.charCodeAt(0));html=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}if(generation!==stamp||getUser()?.id!==owner)throw Error('Phiên đã thay đổi');return withExecutiveTheme(html,module);})();
  prepared.set(key,task);void task.catch(()=>{if(prepared.get(key)===task)prepared.delete(key);});return task;
 }
 async function open(module){
  container.querySelectorAll?.('.module-error').forEach(n=>n.remove());for(const [key,frame]of frames)frame.hidden=key!==module;
  if(!valid(module)){container.hidden=true;return;}container.hidden=false;if(frames.has(module))return;
  const owner=getUser()?.id,stamp=generation;if(!owner)return;
  const frame=document.createElement('iframe');frame.title=MODULES[module].name+' · Không gian làm việc';frame.className='workspace-frame';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads allow-popups allow-popups-to-escape-sandbox');frame.referrerPolicy='no-referrer';frames.set(module,frame);container.append(frame);frame.srcdoc='<link rel="stylesheet" href="/tokens.css"><body><p role="status">Đang mở '+MODULES[module].name+'…</p></body>';
  const htmlTask=preload(module),snapshotTask=readSource(module);bootSnapshots.set(module,{owner,task:snapshotTask});void snapshotTask.catch(()=>{});
  try{const html=await htmlTask;if(stamp!==generation||getUser()?.id!==owner)return;frame.srcdoc=html;}catch(e){if(stamp!==generation||getUser()?.id!==owner)return;frame.remove();frames.delete(module);bootSnapshots.delete(module);const notice=document.createElement('div');notice.className='module-error';notice.textContent='Chưa mở được '+MODULES[module].name+'. '+e.message;const retry=document.createElement('button');retry.textContent='Thử lại';retry.onclick=()=>{notice.remove();void open(module)};notice.append(retry);container.append(notice);}
 }
 function clear(){generation++;for(const frame of frames.values())frame.remove();frames.clear();prepared.clear();reading.clear();bootSnapshots.clear();metadataTask=null;metadata={};container.replaceChildren();container.hidden=true;}
 return {open,read,preload,refreshMetadata,clear};
}
