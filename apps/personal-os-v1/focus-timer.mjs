// Wall-clock time keeps the countdown correct after a throttled/background tab.
export function createFocusTimer({seconds=1500,now=()=>Date.now()}={}){
 let left=seconds,end=0,running=false;
 function read(){if(running){left=Math.max(0,Math.ceil((end-now())/1000));if(!left)running=false;}return {remaining:left,running,label:String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0')};}
 return {read,toggle(){read();if(running)running=false;else{if(!left)left=seconds;end=now()+left*1000;running=true;}return read();},reset(){left=seconds;running=false;return read();}};
}
