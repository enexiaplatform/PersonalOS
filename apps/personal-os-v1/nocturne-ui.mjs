/* Local presentation interactions. No provider calls, persistence or source writes. */
import {mountUI} from './design-system/ui.mjs';
mountUI();
const density=document.querySelector('#os-density');
try{const saved=localStorage.getItem('henry-os-density');if(saved==='compact')document.documentElement.dataset.density=saved;}catch{}
if(density){density.value=document.documentElement.dataset.density;density.addEventListener('change',()=>{document.documentElement.dataset.density=density.value;window.dispatchEvent(new CustomEvent('henry-density-change',{detail:density.value}));try{localStorage.setItem('henry-os-density',density.value);}catch{}});}
import {createFocusTimer} from './focus-timer.mjs';
const focus=createFocusTimer();
function timer(){const {remaining,running,label}=focus.read();const out=document.querySelector('#focus-countdown');if(out)out.textContent=label;const b=document.querySelector('[data-focus-start]');if(b)b.textContent=running?'Tạm dừng':remaining===0?'Bắt đầu lại':'Bắt đầu';}
setInterval(timer,1000);
const observer=new MutationObserver(()=>timer());observer.observe(document.querySelector('#view-content'),{childList:true});
for(const b of document.querySelectorAll('#nav .nav-item')){const label=[...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||b.textContent.trim();if(!b.title)b.title=label;for(const n of [...b.childNodes])if(n.nodeType===3&&n.textContent.trim()){const span=document.createElement('span');span.className='nc-nav-label';span.textContent=n.textContent;n.replaceWith(span);}b.querySelector('#blueprint-label')?.classList.add('nc-nav-label');}
for(const b of document.querySelectorAll('.home-space-nav>button')){b.title=b.textContent.trim();for(const n of [...b.childNodes])if(n.nodeType===3&&n.textContent.trim()){const span=document.createElement('span');span.className='nc-nav-label';span.textContent=n.textContent;n.replaceWith(span);}}
document.addEventListener('click',e=>{
 if(e.target.closest('#collapse-sidebar')){const on=document.body.classList.toggle('sidebar-compact');document.querySelector('#collapse-sidebar').setAttribute('aria-pressed',String(on));}
 if(e.target.closest('[data-utility-collapse]'))document.body.classList.add('utilities-collapsed');
 if(e.target.closest('[data-utility-expand]'))document.body.classList.remove('utilities-collapsed');
 if(e.target.closest('[data-focus-start]')){focus.toggle();timer();}
 if(e.target.closest('[data-focus-reset]')){focus.reset();timer();}
});
