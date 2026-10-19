(function(){"use strict";
let initializeApp,getDatabase,ref,set,onValue,onDisconnect,remove,runTransaction,db=null,off=0,offOk=0;
(async()=>{try{if(CFG.apiKey.startsWith("YOUR"))return;
 const V="https://www.gstatic.com/firebasejs/10.12.2/",A=await import(V+"firebase-app.js"),D=await import(V+"firebase-database.js");
 ({initializeApp}=A);({getDatabase,ref,set,onValue,onDisconnect,remove,runTransaction}=D);
 db=getDatabase(initializeApp(CFG));onValue(ref(db,".info/serverTimeOffset"),v=>{off=v.val()||0;offOk=1})}catch(e){console.error("Firebase not loaded:",e)}})();
const myId=Math.random().toString(36).slice(2,10),myUid=(()=>{try{return localStorage.uid||(localStorage.uid=Math.random().toString(36).slice(2)+Date.now().toString(36))}catch(e){return myId}})(),cdn=()=>Math.min(3,Math.ceil(Math.max(0,S.cd)));const now=()=>Date.now()+off;

const $=i=>document.getElementById(i),cv=$("g");let cx=cv.getContext("2d");
let W=0,H=0;
function rs(){const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)}
addEventListener("resize",rs);rs();
const COL=["#ff4f7b","#2bb7ff","#5bd94a","#ffc233"],L=1500;
const VOL={s:.8,m:.45},OPT={sh:1,wx:1,vb:1};try{const o=JSON.parse(localStorage.opt);Object.assign(VOL,o.v);Object.assign(OPT,o.o)}catch(e){}
const saveOpt=()=>{try{localStorage.opt=JSON.stringify({v:VOL,o:OPT})}catch(e){}},vib=p=>{try{OPT.vb&&navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
const LC=()=>LOC[S.loc]||LOC[0],score=()=>Math.round(S.d*10+S.coins*25+S.pt);
/* particles, weather and roadside decor */
const PT=[],FQ=[],WP=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),s:Math.random()}));
function burst(x,y,n,c,sp=4,g=.12,l=.7){if(PT.length>300)PT.splice(0,60);for(let i=0;i<n;i++){const a=Math.random()*6.28,v=sp*(.3+Math.random());PT.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.4,l,m:l,c,r:2+Math.random()*3,g})}}
function pts2(){for(let i=PT.length;i--;){const p=PT[i];p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l-=.016;if(p.l<=0){PT.splice(i,1);continue}cx.globalAlpha=p.l/p.m;cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r*(.5+p.l/p.m*.5),0,7);cx.fill()}cx.globalAlpha=1}
function wxd(){const t=LC().wx;if(!t||!OPT.wx)return;
 for(const p of WP){
  if(t==="rain"){p.y+=.03+p.s*.02;p.x-=.004;cx.strokeStyle="rgba(200,215,255,.45)";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(p.x*W,p.y*H);cx.lineTo(p.x*W-5,p.y*H+14);cx.stroke()}
  else if(t==="snow"){p.y+=.003+p.s*.004;p.x+=Math.sin(p.y*20+p.s*9)*.0012;cx.fillStyle="rgba(255,255,255,.85)";cx.beginPath();cx.arc(p.x*W,p.y*H,1.2+p.s*2.2,0,7);cx.fill()}
  else if(t==="petal"){p.y+=.003+p.s*.003;p.x+=.001+Math.sin(p.y*14+p.s*9)*.0016;cx.fillStyle="rgba(255,170,205,.85)";cx.beginPath();cx.ellipse(p.x*W,p.y*H,3+p.s*3,1.8+p.s,p.y*10,0,7);cx.fill()}
  else{p.x+=.012+p.s*.01;p.y+=.0005;cx.fillStyle="rgba(240,205,140,.35)";cx.fillRect(p.x*W,p.y*H,10+p.s*14,1.5)}
  if(p.y>1){p.y=-.05;p.x=Math.random()}if(p.x>1.05)p.x=-.05;if(p.x<-.05)p.x=1.05}}
function deco(t,x,y,s,k,sd){
 if(t==="palm"){const h=s*(1.9+k%3*.25);cx.strokeStyle="#7a4a24";cx.lineWidth=s*.12;cx.beginPath();cx.moveTo(x,y);cx.quadraticCurveTo(x+sd*s*.15,y-h*.5,x,y-h);cx.stroke();cx.fillStyle="#1fa35a";for(let i=0;i<5;i++){const a=(i-2)*.7;cx.beginPath();cx.ellipse(x+Math.sin(a)*s*.45,y-h+Math.abs(a)*s*.14,s*.5,s*.1,a*.7,0,7);cx.fill()}}
 else if(t==="pine"){const h=s*2.2;for(let i=0;i<3;i++){const ay=y-h*(1-i*.22),by=ay+h*.45,w=s*(.3+i*.12);cx.fillStyle=i%2?"#1f6a4a":"#2a7d58";cx.beginPath();cx.moveTo(x,ay);cx.lineTo(x+w,by);cx.lineTo(x-w,by);cx.fill()}rr(x-s*.05,y-h*.12,s*.1,h*.12,0,"#5a3a24")}
 else if(t==="lamp"){rr(x-s*.04,y-s*1.9,s*.08,s*1.9,0,"#2a2a36");const lx=x-sd*s*.25;cx.strokeStyle="#2a2a36";cx.lineWidth=s*.05;cx.beginPath();cx.moveTo(x,y-s*1.88);cx.lineTo(lx,y-s*1.9);cx.stroke();const g=cx.createRadialGradient(lx,y-s*1.8,0,lx,y-s*1.8,s*.6);g.addColorStop(0,"rgba(255,233,160,.75)");g.addColorStop(1,"rgba(255,233,160,0)");cx.fillStyle=g;cx.fillRect(lx-s*.6,y-s*2.4,s*1.2,s*1.2);cx.fillStyle="#fff3c0";cx.beginPath();cx.arc(lx,y-s*1.82,s*.09,0,7);cx.fill()}
 else if(t==="pag"){s*=.9;for(let i=0;i<3;i++){const w=s*(1-i*.24),by=y-i*s*.62;rr(x-w*.42,by-s*.5,w*.84,s*.5,0,"#8a1f2e");rr(x-w*.42,by-s*.38,w*.84,s*.07,0,"#ffd23f");cx.fillStyle="#2a1b4d";cx.beginPath();cx.moveTo(x-w*.72,by-s*.5);cx.lineTo(x-w*.4,by-s*.72);cx.lineTo(x+w*.4,by-s*.72);cx.lineTo(x+w*.72,by-s*.5);cx.fill()}}}
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function gen(c,df=1){const r=rng(hash(c)),it=[],m=[.45,.7,1][df];
 for(let z=50;z<L-40;z+=8){const k=r(),ln=Math.floor(r()*4);
  if(k<.2*m)it.push({z,l:ln,t:"low"});
  else if(k<.33*m)it.push({z,l:ln,t:"high"});
  else if(k<.43*m){const b=(ln+1+Math.floor(r()*3))%4;it.push({z,l:ln,t:r()<.3?"rick":"wall"},{z,l:b,t:r()<.3?"rick":"wall"})}
  else if(k<.77){for(let i=0;i<4;i++)it.push({z:z+i*2,l:ln,t:"coin"})}
  else if(k<.85)it.push({z,l:ln,t:"boost"});
  else if(k<.89)it.push({z,l:ln,t:"shield"});else if(k<.94)it.push({z,l:ln,t:"crate"});else if(k<.97)it.push({z,l:ln,t:"scoot"})}
 return it}
const sky=(()=>{const r=rng(7),a=[];for(let i=0;i<22;i++)a.push({x:i/22+r()*.03,w:.04+r()*.04,h:.25+r()*.6,dome:r()<.35,ci:i%3});return a})();
let selLoc=(+(()=>{try{return localStorage.lc}catch(e){}})()||0)%LOC.length,myCh=+(()=>{try{return localStorage.ch}catch(e){}})()||0,rm=null,seen={},code="",items=gen("demo"),sm={},S={st:"menu",loc:selLoc},myc=1,lastP=0;
const sv=(k,v)=>{try{localStorage[k]=typeof v==="string"?v:JSON.stringify(v)}catch(e){}};
let PROF=null,booted=0,DM=0,UL=[0];
try{PROF=JSON.parse(localStorage.bkp)}catch(e){}
try{DM=+localStorage.dm||0;UL=JSON.parse(localStorage.ul)||[0]}catch(e){}
[0,1,2].forEach(i=>{if(!UL.includes(i))UL.push(i)});let CL=[1,1,1,1,1,1,1];try{const a=JSON.parse(localStorage.cl);if(Array.isArray(a))CL=CL.map((x,i)=>Math.min(10,Math.max(1,+a[i]||1)))}catch(e){}if(!UL.includes(selLoc)){selLoc=0;S.loc=0}
function seg(id){const s=$(id),d=document.createElement("div"),u=()=>[...d.children].forEach((b,i)=>b.classList.toggle("on",s.options[i].value===s.value));d.className="seg";[...s.options].forEach(o=>{const b=document.createElement("button");b.textContent=o.text;b.onclick=()=>{s.value=o.value;u();s.dispatchEvent(new Event("change"));snd(660,.08,"triangle",.06,200)};d.append(b)});s.after(d);s.hidden=true;u()}
seg("df");seg("nb");seg("md");seg("ol");
const LCS=[...document.querySelectorAll(".locs")],COST=[0,0,0,100,200,350];
LCS.forEach(c=>{LOC.forEach((l,i)=>{const b=document.createElement("button");b.innerHTML="<b>"+l.e+"</b><span>"+l.n+"</span><em></em>";b.style.background="linear-gradient(180deg,"+l.sky[0]+","+l.sky[1]+" 55%,"+l.sky[2]+")";b.onclick=()=>pickLoc(i);c.append(b)})});
function locUI(){LCS.forEach(c=>[...c.children].forEach((b,j)=>{const u=UL.includes(j);b.classList.toggle("on",j===selLoc);b.classList.toggle("lk",!u);b.lastChild.textContent=u?(j===selLoc?"Selected":"Unlocked"):"🔒 💎 "+COST[j]}))}
locUI();
function pickLoc(i){if(!UL.includes(i)){if(DM<COST[i]){snd(200,.2,"sawtooth",.06,-80);return toast("Need 💎 "+COST[i]+" to unlock "+LOC[i].n+". You have 💎 "+DM+". Earn more in offline races!")}
 if(!confirm("Unlock "+LOC[i].n+" for 💎 "+COST[i]+"?"))return;DM-=COST[i];UL.push(i);sv("dm",DM);sv("ul",UL);sfx("win",myCh,.5)}
 selLoc=i;S.loc=i;sv("lc",i);locUI();ds();snd(520+i*60,.12,"triangle",.07,300)}
{$("vs").value=VOL.s*100;$("vm").value=VOL.m*100;
 $("vs").oninput=()=>{VOL.s=$("vs").value/100;saveOpt()};$("vs").onchange=()=>sfx("coin");
 $("vm").oninput=()=>{VOL.m=$("vm").value/100;saveOpt()};$("vm").onchange=()=>{if(S.st==="run")music(1)};
 [["sh","📳 Shake"],["wx","🌦 Weather"],["vb","📱 Vibrate"]].forEach(([k,n])=>{const b=document.createElement("button"),u=()=>b.classList.toggle("on",!!OPT[k]);b.textContent=n;b.onclick=()=>{OPT[k]=OPT[k]?0:1;u();saveOpt()};u();$("tg").append(b)});
 $("se").onclick=()=>show("p5");$("bk2").onclick=home}
/* ---- app features: keep screen awake while racing, install button ---- */
let WL=null;async function wl(on){try{if(on&&navigator.wakeLock&&!WL){WL=await navigator.wakeLock.request("screen");WL.onrelease=()=>{WL=null}}else if(!on&&WL){const w=WL;WL=null;await w.release()}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&(S.st==="run"||S.st==="count"))wl(1)});
let DP=null;const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();DP=e});
addEventListener("appinstalled",()=>{DP=null;$("inst").hidden=true});
const IOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
$("inst").onclick=async()=>{if(DP){DP.prompt();try{await DP.userChoice}catch(e){}DP=null;return}toast(IOS?"To install: tap Share, then Add to Home Screen.":"To install: open your browser menu and choose Install app (or Add to Home screen).")};
const PW=[["c","🌶️","Chilli","slows rivals for 2.5s","Kedar"],["w","🧱","Wall drop","drops a brick wall in front of rivals","Rasmina"],["d","🌀","Dizzy","reverses rivals’ left/right for 4s","Amit"],["f","❄️","Freeze","freezes rivals in place for 1.5s","Rahul"],["g","🌫️","Fog","blinds rivals with thick fog for 4s","Resmina"],["l","🔒","Lane lock","locks rivals into their lane for 3s","Rushina"],["s","🌪️","Shove","throws rivals into a random lane","Navraj"]];
const RU={"🎮 Basics":["Reach the finish line first. Touch a wall, barrier or bar and you’re out.","Swipe or use ← → to change lane, ↑ / Space to jump, ↓ to slide.","Shift or the 🥟 button = speed boost. Collect 10 🌀 coins for a samosa.","P pauses offline races. Every runner starts in their own lane.","Jump or slide past barriers to build a 🔥 combo for bonus points."],"🚧 Obstacles":["🧱 Brick wall: change lane.","🚧 Concrete barrier: jump over it.","⛓️ Overhead bar: slide under it.","🛺 Rickshaw: change lane."],"⭐ Pickups":["🌀 Coins: 10 = 1 samosa boost.","🍵 Chai: a shield that blocks one hit.","🛵 Scooty: 8s of extra speed, absorbs one crash.","🎁 Crate: gives you your runner’s special power. Tap the power button to hit your rivals."],"⚡ Powers":PW.map(x=>x[1]+" "+x[4]+" · "+x[2]+": "+x[3]),"🏁 Modes":["🤖 Offline: practice alone or race 1–3 computer runners.","⚡ Online quick match: race anyone worldwide.","👥 Private room: share the code, up to 4 runners. The code also sets the room’s location and difficulty.","📍 Levels: Kathmandu, Pokhara, Chitwan, Lumbini, Mustang and Everest each have their own scenery, weather, vehicles and music. Unlock them with 💎 diamonds.","💎 Diamonds: earn them in offline races (1 per 25 coins, +2 for finishing). Also spend them to level up your runners (max level 10).","Finish first to win. Crashed runners rank by distance."]};
{const t=$("tabs"),k=Object.keys(RU),tb=$("tb"),sel=i=>{[...t.children].forEach((b,j)=>b.classList.toggle("on",i===j));tb.textContent="";RU[k[i]].forEach(x=>{const e=document.createElement("p");e.textContent=x;tb.append(e)})};k.forEach((n,i)=>{const b=document.createElement("button");b.textContent=n;b.onclick=()=>sel(i);t.append(b)});sel(0)}
let ST2={r:0,b:0};try{Object.assign(ST2,JSON.parse(localStorage.sst))}catch(e){}
function ds(){if(booted)dashUI()}
function rec(t){S.dg=0;if(S.solo){S.dg=Math.floor(S.coins/25)+(t?2:0);DM+=S.dg;sv("dm",DM)}ST2.r++;ST2.c=(ST2.c||0)+S.coins;if(t){const k=LC().k;ST2.lb=ST2.lb||{};S.pb=!ST2.lb[k]||t<ST2.lb[k];if(S.pb)ST2.lb[k]=t;if(!ST2.b||t<ST2.b)ST2.b=t}try{localStorage.sst=JSON.stringify(ST2)}catch(e){}ds()}ds();
const CT=[["IN","India"],["US","USA"],["GB","UK"],["PK","Pakistan"],["BD","Bangladesh"],["AE","UAE"],["CA","Canada"],["AU","Australia"],["DE","Germany"],["FR","France"],["BR","Brazil"],["NG","Nigeria"],["ID","Indonesia"],["JP","Japan"],["ZA","South Africa"],["NP","Nepal"],["LK","Sri Lanka"]];
const fl=c=>c?String.fromCodePoint(...[...c].map(x=>127397+x.charCodeAt(0))):"",nm=p=>fl(p.c)+" "+(p.n||"Player");
{const lc=(navigator.language.split("-")[1]||"").toUpperCase();CT.forEach(([c,n])=>$("ct").add(new Option(fl(c)+" "+n,c)));$("ct").value=CT.some(x=>x[0]===lc)?lc:"NP"}
const nick=()=>PROF?PROF.user.slice(0,12):"Runner";
function reset(){Object.assign(S,{d:0,x:1,lane:1,y:0,vy:0,sl:0,sp:0,bt:0,ch:0,coins:0,sh:0,hit:0,ft:0,t:0,msg:"",mt:0,sc:0,pw:0,cr:0,rt:0,at:"",an:0,sk:0,fz:0,dz:0,fg:0,lk:0,pt:0,cm:0,cmT:0,cl:0,tp:0,pb:0})}
reset();
const stc=()=>({menu:0,lobby:0,ready:1,count:2,run:2,done:3})[S.st]??0;
function pres(){if(!rm)return;rm.presence({n:nick(),st:stc(),d:+S.d.toFixed(1),x:+S.x.toFixed(2),y:+S.y.toFixed(2),sl:S.sl>0?1:0,bt:S.bt>0?1:0,sh:S.sh,ft:+S.ft.toFixed(2),t0:S.T0||0,rt:S.rt,cr:S.cr,at:S.at,c:$("ct").value,ch:myCh})}
let PA=0,bots=[];const slot=i=>[1,2,0,3][i%4];const viewers=()=>rm?rm.peers():bots.map(b=>({peer:b.id,isMe:false,presence:b.p}));
const order=()=>rm?viewers().map(p=>p.peer).sort():[myId,...bots.map(b=>b.id)];
function show(p){["p1","p2","p3","p4","p5","p6"].forEach(i=>$(i).hidden=i!==p);$("ui").hidden=!p;$("dash").hidden=!!p||S.st!=="menu"||!PROF;$("mt").style.display=$("dash").hidden?"":"none"}
const msg=(el,t)=>{$(el).textContent=t};
function say(t){S.msg=t;S.mt=1.1;snd(520,.18,"triangle",.07,400)}
const dfOf=c=>{const i="enh".indexOf((c[4]||"").toLowerCase());return i<0?1:i},locOf=c=>(parseInt(c[5],10)||0)%LOC.length;
function begin(solo,T,nb){wl(1);reset();S.df=solo?+$("df").value:dfOf(code);S.loc=solo?selLoc:locOf(code);items=gen(solo?"solo"+Math.random():code,S.df);S.T0=T||now()+3000;S.solo=solo;S.nb=nb|0;if(S.nb)mkBots(S.nb,S.df);else bots=[];S.lane=S.x=slot(Math.max(0,order().indexOf(myId)));S.st="count";S.cd=3;seen={};show(null);$("bst").hidden=false;$("pw").hidden=solo&&!nb;$("ps").hidden=!!rm;PA=0;pres()}
/* ---- room layer on Firebase Realtime Database: rooms live at sprint/<code>/<playerId> ---- */
async function joinRoom(c){
 c=c.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,6);
 if(c.length<3)return msg("m0","Enter a room code (3–6 letters or digits).");
 if(!db)return msg("m0","Rooms aren’t switched on yet: add your Firebase config in js/firebase-config.js. Practice solo works now.");
 for(let i=0;i<30&&!offOk;i++)await new Promise(r=>setTimeout(r,100));
 const room=ref(db,"sprint/"+c),me=ref(db,"sprint/"+c+"/"+myId);
 let fmr=null,others={},mine={n:nick(),st:0,d:0,x:1,y:0,sl:0,bt:0,sh:0,ft:0,t0:0,rt:0,cr:0,at:"",c:$("ct").value,ch:myCh},cbs=[],cache=[];
 const rebuild=()=>{const o={...others};o[myId]=mine;cache=Object.entries(o).map(([k,v])=>({peer:k,isMe:k===myId,presence:v||{}}))};
 try{
  await onDisconnect(me).remove();await set(me,mine);
  rm={peers:()=>cache,onPeers:f=>cbs.push(f),
   presence:p=>{Object.assign(mine,p);rebuild();return set(me,mine).catch(()=>{})},
   leave:async()=>{unsub();try{await onDisconnect(me).cancel();await remove(me);if(fmr)await remove(fmr)}catch(e){}}};
  var unsub=onValue(room,s=>{others=s.val()||{};rebuild();cbs.forEach(f=>f())},()=>msg("m1","Lost connection to the room."));
  rebuild();
  try{const fR=ref(db,"sprintface/"+c);if(MYD){fmr=ref(db,"sprintface/"+c+"/"+myId);await onDisconnect(fmr).remove();set(fmr,MYD).catch(()=>{})}
   onValue(fR,sn=>{const v=sn.val()||{};for(const k in v){if(k===myId||PFD[k]===v[k]||!okFace(v[k]))continue;PFD[k]=v[k];const im=new Image();im.src=v[k];PFI[k]=im}})}catch(e){}
 }catch(e){rm=null;return msg("m0","Couldn’t join that room. Check your Firebase rules and config.")}
 code=c;S.loc=locOf(c);S.st="lobby";sm={};rm.onPeers(renderLobby);$("rc").textContent=c.toUpperCase();$("rl").textContent="Room code · "+["Easy","Normal","Hard"][dfOf(c)]+" mode · "+LOC[locOf(c)].e+" "+LOC[locOf(c)].n;show("p2");renderLobby()}
function renderLobby(){
 if(!rm||(S.st!=="lobby"&&S.st!=="ready"))return;
 const ps=viewers(),ord=order(),ul=$("pl");ul.textContent="";
 ps.forEach(p=>{const li=document.createElement("li"),i=document.createElement("i"),n=document.createElement("b"),s=document.createElement("span");
  i.style.background=COL[ord.indexOf(p.peer)%4];n.textContent=nm(p.presence)+(p.isMe?" (you)":"");
  s.className="s";s.textContent=ord.indexOf(p.peer)>=4?"watching":(p.presence.st===1?"ready ✓":p.presence.st>=2?"racing":"not ready");
  li.append(i,n,s);ul.append(li)});
 const full=ord.indexOf(myId)>=4;
 $("rd").disabled=full;$("rd").textContent=S.st==="ready"?"Not ready":"I’m ready";
 msg("m1",full?"This room is full (4 players max).":ps.length<2?"Waiting for friends to join…":"Everyone taps ready to start the countdown.")}
function checkStart(){
 if(!rm||S.st!=="ready")return;
 const o=viewers().filter(p=>!p.isMe);if(!o.length||o.length>3)return;
 if(o.every(p=>p.presence.st===1||(p.presence.st===2&&Math.abs(now()-p.presence.t0)<9000)))begin(false,Math.max(S.rt+3000,...o.map(p=>p.presence.st===2?p.presence.t0:(p.presence.rt||0)+3000)))}
const rcode=(d=1,l=0)=>{const a="ABCDEFGHJKMNPQRSTUVWXYZ23456789";let c="";for(let i=0;i<4;i++)c+=a[Math.floor(Math.random()*a.length)];return c+"ENH"[d]+l};
const mk=()=>joinRoom(rcode(+$("df").value,selLoc));
const quick=async()=>{if(!db)return msg("m0","Rooms aren’t switched on yet: add your Firebase config in js/firebase-config.js.");msg("m0","Finding a rival…");
 const c=rcode(1,Math.floor(Math.random()*LOC.length));let f=null;
 try{await runTransaction(ref(db,"mm/open"),v=>{if(v&&now()-v.t<40000){f=v.room;return null}f=null;return{room:c,t:now()}})}catch(e){return msg("m0","Matchmaking failed. Check your database rules.")}
 await joinRoom(f||c);if(rm){S.st="ready";S.rt=now();pres();renderLobby()}};
$("hw").onclick=()=>show("p4");$("bk").onclick=home;
$("rd").onclick=()=>{S.st=S.st==="ready"?"lobby":"ready";S.rt=S.st==="ready"?now():0;pres();renderLobby()};
function pause(){if(S.st==="run"&&!rm){PA=!PA;music(!PA)}}addEventListener("keydown",e=>{if(e.key==="p"||e.key==="P"||e.key==="Escape")pause()});$("ps").onclick=pause;
function leave(){wl(0);if(rm){rm.leave();rm=null}bots=[];PA=0;$("ps").hidden=true;code="";S.loc=selLoc;music(0);ds();S.st="menu";$("bst").hidden=$("pw").hidden=true;items=gen("demo");reset();home()}
$("lv").onclick=$("lv2").onclick=leave;
$("ag").onclick=()=>{if(S.solo)begin(true,0,S.nb);else{S.st="lobby";reset();$("bst").hidden=true;pres();show("p2");renderLobby()}};
function act(a){
 if(S.st!=="run")return;
 if(S.lk>0&&(a==="L"||a==="R"))return;if(S.dz>0&&(a==="L"||a==="R"))a=a==="L"?"R":"L";
 if(a==="L")S.lane=Math.max(0,S.lane-1);
 else if(a==="R")S.lane=Math.min(3,S.lane+1);
 else if(a==="J"){if(S.y<=0){S.vy=12;S.y=.001;S.sl=0;sfx("jump")}}
 else if(a==="S"){S.sl=.7;sfx("slide");if(S.y>0)S.vy=-16}
 else if(a==="B"&&S.ch>0){S.ch--;S.bt=Math.min(S.bt+2.2,5);say("SAMOSA POWER!");sfx("boost")}
 else if(a==="P"&&S.pw&&(rm||bots.length)){if(!rm)botHit(S.pw);S.at=S.pw+":"+(++S.an);say(PW.find(x=>x[0]===S.pw)[1]+" "+PW.find(x=>x[0]===S.pw)[2]+" sent!");S.pw=0;sfx("power");pres()}}
addEventListener("keydown",e=>{const m={arrowleft:"L",a:"L",arrowright:"R",d:"R",arrowup:"J",w:"J"," ":"J",arrowdown:"S",s:"S",shift:"B",b:"B",e:"B",f:"P",q:"P"}[e.key.toLowerCase()];
 if(m&&S.st==="run"){e.preventDefault();act(m)}});
let px=0,py=0,pid=-1;
cv.addEventListener("pointerdown",e=>{px=e.clientX;py=e.clientY;pid=e.pointerId});
cv.addEventListener("pointerup",e=>{if(e.pointerId!==pid)return;pid=-1;const dx=e.clientX-px,dy=e.clientY-py;
 if(Math.abs(dx)<22&&Math.abs(dy)<22)return act("J");
 if(Math.abs(dx)>Math.abs(dy))act(dx<0?"L":"R");else act(dy<0?"J":"S")});
$("bst").addEventListener("pointerdown",e=>{e.stopPropagation();act("B")});
$("pw").addEventListener("pointerdown",e=>{e.stopPropagation();act("P")});
function step(dt){
 if(S.mt>0)S.mt-=dt;
 if(S.st==="menu"||S.st==="lobby"||S.st==="ready"){S.d=(S.d+10*dt)%600;return}
 if(S.st==="count"){const q=cdn();S.cd=(S.T0-now())/1000;if(cdn()!==q&&S.cd>0)snd(440,.12,"square",.06);if(S.cd<=0){snd(880,.4,"square",.07);S.st="run";S.t=Math.max(0,-S.cd);music(1)}return}
 if(S.st==="done"){S.sp*=Math.pow(.2,dt);S.d+=S.sp*dt;return}
 S.t+=dt;
 const base=[12,14,16][S.df??1];let tg=(S.bt>0?base*1.65:base)*(S.sc>0?1.3:1)*(S.solo?1+.012*(CL[myCh]-1):1);
 if(S.hit>0){S.hit-=dt;tg=base*.45}if(S.fz>0){S.fz-=dt;tg=0}S.dz=Math.max(0,S.dz-dt);S.fg=Math.max(0,S.fg-dt);S.lk=Math.max(0,S.lk-dt);
 S.sp+=(tg-S.sp)*Math.min(1,dt*(S.hit>0?10:3));S.tp=Math.max(S.tp,S.sp*7);S.cmT=Math.max(0,S.cmT-dt);if(!S.cmT)S.cm=0;
 S.d+=S.sp*dt;S.bt=Math.max(0,S.bt-dt);S.sc=Math.max(0,S.sc-dt);S.sl=Math.max(0,S.sl-dt);
 S.x+=(S.lane-S.x)*Math.min(1,dt*14);
 if(S.y>0||S.vy>0){S.vy-=38*dt;S.y+=S.vy*dt;if(S.y<=0){S.y=0;S.vy=0}}
 for(const o of items){if(o.g)continue;const dz=o.z-S.d;if(dz<-1)continue;if(dz>1.2)break;
  if(Math.abs(S.x-o.l)>.6)continue;
  if(o.t==="coin"){o.g=1;sfx("coin");FQ.push("c");if(++S.coins%10===0&&S.ch<3){S.ch++;say("Samosa ready!")}}
  else if(o.t==="boost"){o.g=1;S.ch=Math.min(3,S.ch+1);say("+1 samosa")}
  else if(o.t==="shield"){o.g=1;S.sh=1;say("Chai shield!")}
  else if(o.t==="scoot"){o.g=1;S.sc=8;say("🛵 Scooty ride!")}
  else if(o.t==="crate"){o.g=1;if((rm||bots.length)&&!S.pw){S.pw=PW[myCh][0];say("Power: "+PW[myCh][1]+" "+PW[myCh][2])}}
  else if((o.t==="low"&&S.y<.9)||(o.t==="high"&&S.sl<=0)||o.t==="wall"||o.t==="rick"){o.g=1;if(S.sh){S.sh=0;say("Chai spilled!")}else if(S.sc>0){S.sc=0;S.sk=.4;say("Scooty smashed!")}else crash()}else if((o.t==="low"||o.t==="high")&&!o.pc){o.pc=1;S.cl++;S.cm++;S.cmT=5;S.pt+=100*S.cm;FQ.push("n");say(S.cm>1?"🔥 Combo x"+S.cm:"Clean!")}}
 if(S.d>=L){S.st="done";S.ft=S.t;rec(S.ft);sfx("win");music(0);pres();$("bst").hidden=$("pw").hidden=true;show("p3");results()}}
function crash(){sfx("crash");vib([80,40,160]);music(0);FQ.push("x");rec(0);S.cr=1;S.sk=.6;S.st="done";S.ft=S.t;S.sp=0;$("bst").hidden=$("pw").hidden=true;pres();setTimeout(()=>{show("p3");results()},900)}
function hitBy(k){if(S.sh){S.sh=0;say("Chai blocked it!");return}sfx("hit");vib(60);S.cm=0;
 if(k==="c"){S.hit=2.5;S.bt=0;say("🌶️ Chilli! You’re slowed")}
 else if(k==="f"){S.hit=1.5;S.fz=1.5;S.bt=0;say("❄️ Frozen!")}
 else if(k==="d"){S.dz=4;say("🌀 Dizzy! Controls reversed")}
 else if(k==="g"){S.fg=4;say("🌫️ Fog! Can’t see")}
 else if(k==="l"){S.lk=3;say("🔒 Lane locked!")}
 else if(k==="s"){S.lane=Math.floor(Math.random()*4);say("🌪️ Shoved into another lane!")}
 else{items.push({z:S.d+38,l:S.lane,t:k==="w"?"wall":"rick"});items.sort((a,b)=>a.z-b.z);say("⚠ Wall ahead!")}}
function fx(){if(!rm||(S.st!=="run"&&S.st!=="count"))return;
 for(const p of viewers()){if(p.isMe)continue;const a=p.presence.at||"";
  if(seen[p.peer]===undefined||S.st==="count"){seen[p.peer]=a;continue}
  if(a&&a!==seen[p.peer]){seen[p.peer]=a;hitBy(a[0])}}}
function results(){
 if(S.st!=="done")return;
 const a=[{n:nm({c:$("ct").value,n:nick()}),me:1,st:3,ft:S.ft,d:S.d,cr:S.cr}];
 viewers().forEach(p=>{if(!p.isMe&&p.presence.st>=2)a.push({n:nm(p.presence),st:p.presence.st,ft:p.presence.ft,d:p.presence.d||0,cr:p.presence.cr})});
 const sc=x=>x.cr?x.d:x.st===3?1e5-x.ft:1e4+x.d;a.sort((x,y)=>sc(y)-sc(x));
 const me=a.findIndex(x=>x.me);
 $("ttl").textContent=S.cr?(a.length<2?"💥 Crashed!":me===0?"💥 You crashed, but got further":"💥 Crashed. You’re out"):me===0?(a.length>1?"🏆 You won!":"🏁 Finished!"):"🏁 You finished #"+(me+1);
 const ul=$("rs");ul.textContent="";
 a.forEach((x,i)=>{const li=document.createElement("li"),b=document.createElement("b"),s=document.createElement("span");
  b.textContent=(["🥇","🥈","🥉","4️⃣"][i]||"")+" "+x.n+(x.me?" (you)":"");s.className="s";
  s.textContent=x.cr?"💥 crashed at "+Math.round(x.d/L*100)+"%":x.st===3?x.ft.toFixed(1)+" s":"running… "+Math.round(Math.min(100,x.d/L*100))+"%";if(x.me)li.style.background="rgba(255,194,51,.2)";li.append(b,s);ul.append(li)});$("rst").textContent=(a.every(x=>x.cr||x.st===3)?"🏁 Final result  ·  ":"⏳ Waiting for others  ·  ")+"⭐ "+score()+"  ·  🌀 "+S.coins+(S.dg?"  ·  💎 +"+S.dg:"")+"  ·  🚧 "+S.cl+" clean  ·  🚀 "+Math.round(S.tp)+" km/h"+(S.pb&&!S.cr?"  ·  🏆 New best at "+LC().n+"!":"")}
setInterval(results,400);
function brick(x,y,s){const w=s*.96,h=s*.95,l=x-w/2,rows=6,bh=h/rows,bw=w/3.5;
 cx.fillStyle="rgba(0,0,0,.35)";cx.beginPath();cx.ellipse(x,y,w*.55,s*.07,0,0,7);cx.fill();rr(l,y-h,w,h,s*.02,"#6e2a1c");
 for(let r=0;r<rows;r++){const o=r%2?.5:0;for(let c=-1;c<4;c++){const x0=Math.max(l,l+(c+o)*bw),x1=Math.min(l+w,l+(c+o+1)*bw);if(x1-x0<1)continue;cx.fillStyle=(r*3+c)%3?"#b9503a":"#9c3b28";cx.fillRect(x0+1,y-h+r*bh+1,x1-x0-2,bh-2)}}
 const g=cx.createLinearGradient(l,0,l+w,0);g.addColorStop(0,"rgba(0,0,0,.3)");g.addColorStop(.5,"rgba(255,255,255,.1)");g.addColorStop(1,"rgba(0,0,0,.32)");cx.fillStyle=g;cx.fillRect(l,y-h,w,h);
 rr(l-s*.03,y-h-s*.07,w+s*.06,s*.09,s*.02,"#8d8d99");for(let i=0;i<5;i++)rr(l+i*w/5,y-h*.62,w/5,h*.1,0,i%2?"#ffc233":"#222")}
function barr(x,y,s){cx.fillStyle="rgba(0,0,0,.35)";cx.beginPath();cx.ellipse(x,y,s*.5,s*.07,0,0,7);cx.fill();
 cx.fillStyle="#c3c6d0";cx.beginPath();cx.moveTo(x-s*.46,y);cx.lineTo(x-s*.34,y-s*.5);cx.lineTo(x+s*.34,y-s*.5);cx.lineTo(x+s*.46,y);cx.fill();
 cx.fillStyle="rgba(0,0,0,.18)";cx.beginPath();cx.moveTo(x+s*.1,y-s*.5);cx.lineTo(x+s*.34,y-s*.5);cx.lineTo(x+s*.46,y);cx.lineTo(x+s*.15,y);cx.fill();
 for(let i=0;i<4;i++)rr(x-s*.3+i*s*.15,y-s*.43,s*.08,s*.12,0,"#ff4f2b");rr(x-s*.34,y-s*.55,s*.68,s*.07,s*.02,"#e1e3ea")}
const BN=["Rocket","Chotu","Tiger","Dosa","Ninja","Bolt","Mirchi","Vada"],NH=["IN","US","GB","NP","BR","JP","DE","AU"];
function mkBots(n,df){bots=[];const nn=BN.slice().sort(()=>Math.random()-.5);for(let i=0;i<n;i++)bots.push({id:"bot"+i,x:slot(i+1),lane:slot(i+1),vy:0,sl:0,sp:0,bt:0,hit:0,t:0,seen:new WeakSet(),ign:new WeakSet(),ex:[],btT:6+Math.random()*8,atT:14+Math.random()*12,k:.95+Math.random()*.06+df*.015,e:[.02,.009,.004][df],p:{n:CH[(myCh+1+i)%7].n,st:2,d:0,x:slot(i+1),y:0,sl:0,bt:0,sh:0,ft:0,t0:0,rt:0,cr:0,at:"",c:"NP",ch:(myCh+1+i)%7}})}
function botHit(k){for(const b of bots){if(b.p.cr||b.p.ft)continue;if(k==="c"){b.hit=2.5;b.bt=0}else if(k==="f"){b.hit=1.5;b.fz=1.5;b.bt=0}else if(k==="w"||k==="r")b.ex.push({z:b.p.d+38,l:b.lane,t:"wall"});else if(k==="s")b.lane=Math.floor(Math.random()*4);else b.lk=3.5}}
function botStep(dt){if(!bots.length||(S.st!=="run"&&S.st!=="done"))return;
 for(const b of bots){const p=b.p;if(p.cr||p.ft)continue;b.t+=dt;const base=[12,14,16][S.df]*b.k;
  if((b.btT-=dt)<0){b.bt=2.2;b.btT=10+Math.random()*10}
  if((b.atT-=dt)<0){b.atT=14+Math.random()*12;if(S.st==="run")hitBy(PW[p.ch][0])}
  let tg=b.bt>0?base*1.65:base;if(b.hit>0){b.hit-=dt;tg=base*.45}if(b.fz>0){b.fz-=dt;tg=0}if(b.lk>0)b.lk-=dt;b.bt=Math.max(0,b.bt-dt);b.sl=Math.max(0,b.sl-dt);
  b.sp+=(tg-b.sp)*Math.min(1,dt*3);p.d+=b.sp*dt;b.x+=(b.lane-b.x)*Math.min(1,dt*14);
  if(p.y>0||b.vy>0){b.vy-=38*dt;p.y+=b.vy*dt;if(p.y<=0){p.y=0;b.vy=0}}
  const all=b.ex.length?items.concat(b.ex):items,la=b.sp*1.3+4;let wr=null;
  for(const o of all){const dz=o.z-p.d;if(dz<-1.2||dz>la||o.t==="coin"||o.t==="boost"||o.t==="shield"||o.t==="crate"||o.t==="scoot")continue;
   if(!b.seen.has(o)){b.seen.add(o);if(Math.random()<b.e)b.ign.add(o)}
   if(Math.abs(b.x-o.l)<=.6&&dz<=1.2&&dz>=-1&&(o.t==="wall"||o.t==="rick"||(o.t==="low"&&p.y<.9)||(o.t==="high"&&b.sl<=0))){p.cr=1;p.st=3;p.ft=b.t;b.sp=0;break}
   if(b.ign.has(o))continue;
   if(o.t==="wall"||o.t==="rick"){if(!wr||o.z<wr.z-.5)wr={z:o.z,bl:[o.l]};else if(o.z<wr.z+.5)wr.bl.push(o.l)}
   else if(b.lane===o.l&&dz>0){if(o.t==="low"&&p.y<=0&&dz<1.2+b.sp*.2){b.vy=12;p.y=.001;b.sl=0}else if(o.t==="high"&&b.sl<=0&&dz<1.2+b.sp*.3){b.sl=.7;if(p.y>0)b.vy=-16}}}
  if(!(b.lk>0)&&wr&&wr.bl.includes(b.lane)){const f=[0,1,2,3].filter(l=>!wr.bl.includes(l));if(f.length)b.lane=f.reduce((a,c)=>Math.abs(c-b.lane)<Math.abs(a-b.lane)?c:a)}
  b.ex=b.ex.filter(o=>o.z>p.d-3);if(!p.cr&&p.d>=L){p.st=3;p.ft=b.t}
  p.x=+b.x.toFixed(2);p.sl=b.sl>0?1:0;p.bt=b.bt>0?1:0}}
function rr(x,y,w,h,r,f){cx.fillStyle=f;cx.beginPath();cx.roundRect(x,y,w,h,r);cx.fill()}
function rick(x,y,s){cx.fillStyle="rgba(0,0,0,.35)";cx.beginPath();cx.ellipse(x,y,s*.5,s*.07,0,0,7);cx.fill();
 rr(x-s*.42,y-s*.2,s*.2,s*.2,s*.06,"#111");rr(x+s*.22,y-s*.2,s*.2,s*.2,s*.06,"#111");
 rr(x-s*.46,y-s*.62,s*.92,s*.46,s*.1,LC().vh[0]);rr(x-s*.46,y-s*.34,s*.92,s*.09,0,LC().vh[1]);
 rr(x-s*.4,y-s*1.08,s*.8,s*.5,s*.16,"#1b1b26");rr(x-s*.3,y-s*1.0,s*.6,s*.28,s*.07,"#9ad9f5");rr(x-s*.3,y-s*1.0,s*.28,s*.28,s*.07,"rgba(255,255,255,.35)");
 rr(x-s*.42,y-s*.55,s*.12,s*.08,2,"#ff2d2d");rr(x+s*.3,y-s*.55,s*.12,s*.08,2,"#ff2d2d");rr(x-s*.15,y-s*.5,s*.3,s*.12,2,"#fff");
 cx.fillStyle="#111";cx.font="800 "+s*.09+"px system-ui";cx.textAlign="center";cx.fillText(LC().vh[2],x,y-s*.41)}
function scoot(x,y,s){rr(x-s*.05,y-s*.3,s*.1,s*.3,s*.03,"#111");rr(x-s*.22,y-s*.44,s*.44,s*.24,s*.1,"#12b5a6");rr(x-s*.24,y-s*.52,s*.48,s*.1,s*.05,"#ff4f7b");rr(x-s*.05,y-s*.4,s*.1,s*.05,2,"#ff3b3b")}
const CH=[
{n:"Kedar",sk:"#c98f64",hr:"#17110d",hs:0,bd:1,t:"#ff8f1f",t2:"#fff3d6",b:"#1d2a4f",lg:0,sh:"#f4f4f4",f:0},
{n:"Rasmina",sk:"#d9a07a",hr:"#120c0a",hs:1,t:"#ff3d71",t2:"#ffffff",b:"#2a1b4d",lg:1,sh:"#ffd23f",f:1},
{n:"Amit",sk:"#a8704a",hr:"#0f0b09",hs:5,t:"#2b6fe0",t2:"#ffffff",b:"#1b1b26",lg:0,sh:"#12b5a6",f:0},
{n:"Rahul",sk:"#f0c6a0",hr:"#5a3a1e",hs:0,t:"#12a67a",t2:"#e8fff6",b:"#232333",lg:1,sh:"#ff6a3a",f:0},
{n:"Resmina",sk:"#e2a984",hr:"#3a2312",hs:3,t:"#8e44ad",t2:"#ffd23f",b:"#1b1b26",lg:1,sh:"#ffffff",f:1},
{n:"Rushina",sk:"#7a4a2e",hr:"#0b0807",hs:2,t:"#ffd23f",t2:"#2a1b4d",b:"#c8102e",lg:0,sh:"#2a1b4d",f:1},
{n:"Navraj",sk:"#8a5a38",hr:"#0e0a08",hs:4,bd:1,t:"#e8504a",t2:"#ffffff",b:"#f1f1f1",lg:0,sh:"#2b2b33",f:0}];
let AC=null,mute=false;
const au=()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();pre()}catch(e){}};
addEventListener("pointerdown",au);addEventListener("keydown",au);
function snd(f,d=.12,ty="square",v=.06,sl=0){if(mute||!AC)return;try{const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);g.gain.setValueAtTime(Math.max(.0002,v*VOL.s),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start();o.stop(t+d)}catch(e){}}
$("mt").onclick=()=>{mute=!mute;$("mt").textContent=mute?"🔇":"🔊";music(!mute&&S.st==="run")};
/* built-in synth voice for each runner (same order as the runner list); your SOUND_FILES override these */
const VOICE=[[1,"square"],[1.35,"triangle"],[.8,"sawtooth"],[.9,"sine"],[1.5,"square"],[1.2,"triangle"],[.7,"sawtooth"]].map(([m,w])=>({jump:[300*m,.16,w,.07,400*m],slide:[220*m,.14,w,.04,-90*m],coin:[900*m,.07,w==="sine"?"triangle":w,.04,500],crash:[150*m,.6,"sawtooth",.14,-100],power:[520*m,.2,w,.07,400],boost:[400*m,.3,w,.06,700*m],win:[660*m,.5,w,.09,600*m],hit:[240*m,.25,"sawtooth",.1,-120],pick:[520*m,.14,w,.07,300*m]}));
const BUF={};
async function ld(u){if(u in BUF)return;BUF[u]=0;try{BUF[u]=await AC.decodeAudioData(await(await fetch(u)).arrayBuffer())}catch(e){console.warn("Sound not loaded:",u)}}
function pre(){for(const k in SOUND_FILES){const v=SOUND_FILES[k];if(typeof v!=="string")for(const e in v)ld(v[e])}}
function sfx(ev,ci=myCh,v=1){if(mute||!AC)return;const P=SOUND_FILES[CH[ci].n]||SOUND_FILES[ci]||{},u=P[ev]||(SOUND_FILES.all||{})[ev];
 if(u){if(BUF[u]){const b=AC.createBufferSource(),g=AC.createGain();b.buffer=BUF[u];g.gain.value=VOL.s*v;b.connect(g).connect(AC.destination);b.start();return}ld(u)}
 const r=VOICE[ci][ev];if(r)snd(r[0],r[1],r[2],r[3]*v,r[4])}
function tn(f,t,d,ty,v){const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(Math.max(.0002,v),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d)}
let MA=null,MI=0;
function music(on){clearInterval(MI);if(MA){MA.pause();MA=null}if(!on||mute||!AC||!VOL.m)return;
 if(SOUND_FILES.music){MA=new Audio(SOUND_FILES.music);MA.loop=true;MA.volume=VOL.m;MA.play().catch(()=>{});return}
 const m=LC().mu;let n=0,nt=AC.currentTime+.05;
 MI=setInterval(()=>{while(nt<AC.currentTime+.25){const st=60/(112+S.sp*1.5)/2,k=n%16,v=VOL.m*.09;
  if(k%4===0)tn(m.r/2,nt,st*3,"triangle",v*1.6);
  if(k%2===0||k>11)tn(m.r*m.s[[0,2,4,2,3,5,4,3][(k>>1)%8]]*(k>7?1.5:1),nt,st*.9,"square",v*.5);
  if(k%2)tn(4000,nt,.03,"square",v*.15);
  nt+=st;n++}},80)}
let thd=0,lc=-1;const TH=[];
/* ---- player photo: pick, position in an oval, save on this device, share with the room ---- */
const PFI={},PFD={};let MYD=null,MYF=null;
try{const d=localStorage.face;if(typeof d==="string"&&d.indexOf("data:image/")===0){MYD=d;MYF=new Image();MYF.src=d}}catch(e){}
const okFace=v=>typeof v==="string"&&v.indexOf("data:image/")===0&&v.length<30000;
const CR={img:null,x:0,y:0,s:1,s0:1,dr:null},CW=260,CH2=300,OX=30,OY=32,OW=200,OH=236;
function crClamp(){const w=CR.img.width*CR.s,h=CR.img.height*CR.s;CR.x=Math.min(OX,Math.max(OX+OW-w,CR.x));CR.y=Math.min(OY,Math.max(OY+OH-h,CR.y))}
function crDraw(){const c=$("cr").getContext("2d");c.clearRect(0,0,CW,CH2);c.fillStyle="#111";c.fillRect(0,0,CW,CH2);if(!CR.img)return;c.drawImage(CR.img,CR.x,CR.y,CR.img.width*CR.s,CR.img.height*CR.s);
 c.save();c.fillStyle="rgba(10,5,30,.68)";c.beginPath();c.rect(0,0,CW,CH2);c.ellipse(130,150,100,118,0,0,7);c.fill("evenodd");c.restore();
 c.strokeStyle="#ffc233";c.lineWidth=3;c.beginPath();c.ellipse(130,150,100,118,0,0,7);c.stroke()}
function photoUI(){$("phx").hidden=!MYD;$("ph").textContent=MYD?"📷 Change photo":"📷 Add my photo"}
function crSave(){const k=136/OW,o=document.createElement("canvas");o.width=136;o.height=160;const c=o.getContext("2d");
 c.drawImage(CR.img,(CR.x-OX)*k,(CR.y-OY)*k,CR.img.width*CR.s*k,CR.img.height*CR.s*k);
 c.save();c.translate(68,80);c.scale(1,160/136);const g=c.createRadialGradient(0,0,0,0,0,68);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(.86,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");c.globalCompositeOperation="destination-in";c.fillStyle=g;c.fillRect(-68,-80,136,160);c.restore();
 let d=o.toDataURL("image/webp",.82);if(d.indexOf("image/webp")<0)d=o.toDataURL("image/jpeg",.8);
 MYD=d;MYF=new Image();MYF.src=d;try{localStorage.face=d}catch(e){}photoUI();show("p1");sfx("win",myCh,.5)}
{const cr=$("cr");
 cr.onpointerdown=e=>{if(!CR.img)return;CR.dr={x:e.clientX,y:e.clientY,ox:CR.x,oy:CR.y};cr.setPointerCapture(e.pointerId)};
 cr.onpointermove=e=>{if(!CR.dr)return;const r=cr.getBoundingClientRect(),k=CW/r.width;CR.x=CR.dr.ox+(e.clientX-CR.dr.x)*k;CR.y=CR.dr.oy+(e.clientY-CR.dr.y)*k;crClamp();crDraw()};
 cr.onpointerup=cr.onpointercancel=()=>{CR.dr=null};
 $("cz").oninput=()=>{if(!CR.img)return;const ns=CR.s0*($("cz").value/100),k=ns/CR.s;CR.x=130-(130-CR.x)*k;CR.y=150-(150-CR.y)*k;CR.s=ns;crClamp();crDraw()};
 $("ph").onclick=()=>$("pf").click();
 $("pf").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f)return;if(!/^image\//.test(f.type))return msg("mph","Please choose a photo (image file).");
  const im=new Image();im.onload=()=>{CR.img=im;CR.s0=CR.s=Math.max(OW/im.width,OH/im.height);CR.x=130-im.width*CR.s/2;CR.y=150-im.height*CR.s/2;crClamp();$("cz").value=100;msg("mph","Put your own face on your runner. Saved on this device.");show("p6");crDraw()};
  im.onerror=()=>msg("mph","Couldn’t open that photo. Try another one.");im.src=URL.createObjectURL(f)};
 $("cu").onclick=()=>{if(CR.img)crSave()};$("cc").onclick=()=>show("p1");
 $("phx").onclick=()=>{MYD=null;MYF=null;try{localStorage.removeItem("face")}catch(e){}photoUI()};photoUI()}

function bust(c,x,y,r,i,fc){const mc=cx;cx=c;c.save();c.beginPath();c.arc(x,y,r,0,7);c.clip();const g=c.createRadialGradient(x,y-r*.3,r*.1,x,y,r);g.addColorStop(0,"#5b3aa0");g.addColorStop(1,"#241446");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);const sz=r*11.2;runner(x,y+sz*.885-r*.08,sz,"#ffc233",i,0,0,"",0,0,0,1,1,fc);c.restore();cx=mc}
function drawThumbs(){TH.forEach((k,i)=>{const c=k.getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,112,144);bust(c,56,72,50,i);c.lineWidth=3;c.strokeStyle="rgba(255,255,255,.55)";c.beginPath();c.arc(56,72,50,0,7);c.stroke()})}
function pick(i){myCh=(i+CH.length)%CH.length;sv("ch",myCh);sfx("pick");ds()}
function pv(el,ci){const c2=el.getContext("2d"),mc=cx,fc=ci===myCh?MYF:null;cx=c2;
 c2.setTransform(2,0,0,2,0,0);c2.clearRect(0,0,360,190);c2.fillStyle="rgba(255,255,255,.1)";c2.beginPath();c2.ellipse(250,176,70,10,0,0,7);c2.fill();
 {const px=96,py=98,pr=56;c2.save();const gl=c2.createRadialGradient(px,py,pr*.6,px,py,pr*1.5);gl.addColorStop(0,"rgba(255,194,51,.5)");gl.addColorStop(1,"rgba(255,194,51,0)");c2.fillStyle=gl;c2.fillRect(0,0,200,190);c2.restore();bust(c2,px,py,pr,ci,fc);c2.lineWidth=4;c2.strokeStyle="#ffc233";c2.beginPath();c2.arc(px,py,pr,0,7);c2.stroke();cx=c2}
 runner(250,176,145,"#ffc233",ci,0,0,"",0,0,0,1,1,fc);cx=mc}
const faceOk=i=>i&&i.complete&&i.naturalWidth?i:null;
function runner(sx,yy,sz,col,ci,y,sl,name,bt,sh,hit,al,fr,fc){
 const C=CH[ci|0]||CH[0],K=Date.now(),ar=y>0,s1=(!ar&&!fr)?Math.sin(K/95):0,b=yy-y*sz*.5+(fr?Math.sin(K/420)*sz*.006:0),
  H=sz*(sl?.66:1),lg=H*.47,hp=b-lg,sy=hp-H*.3,hr=sz*.058,hc=sy-H*.115,w=sz*(C.f?.11:.13),hs=C.hs,ink="#2a1b4d";
 const P=(c,wd)=>{cx.strokeStyle=c;cx.lineWidth=wd;cx.lineCap="round";cx.lineJoin="round"},E=(x,y2,a,bb,f)=>{cx.fillStyle=f;cx.beginPath();cx.ellipse(x,y2,a,bb,0,0,7);cx.fill()};
 cx.globalAlpha=al;E(sx,yy,sz*.26,sz*.06,"rgba(0,0,0,.3)");cx.globalAlpha=al*.3;E(sx,yy,sz*.34,sz*.09,col);cx.globalAlpha=al;
 P(col,Math.max(2,sz*.03));cx.beginPath();cx.ellipse(sx,yy,sz*.31,sz*.08,0,0,7);cx.stroke();
 if(bt){P("rgba(255,255,255,.7)",Math.max(1,sz*.03));for(let i=-1;i<=1;i++){cx.beginPath();cx.moveTo(sx+i*sz*.14,hc-hr);cx.lineTo(sx+i*sz*.14,hc-hr+sz*(.5+Math.random()*.4));cx.stroke()}}
 for(const d of[-1,1]){const lf=fr?0:ar?(d>0?lg*.32:lg*.08):Math.max(0,d*s1)*lg*.3,hx=sx+d*sz*.05,fx=sx+d*sz*.065,fy=b-lf,ky=hp+lg*.5-lf*.45;
  P(C.lg?C.b:C.sk,sz*.072);cx.beginPath();cx.moveTo(hx,hp);cx.lineTo(fx,ky);cx.lineTo(fx,fy-sz*.03);cx.stroke();
  if(!C.lg){P(C.b,sz*.088);cx.beginPath();cx.moveTo(hx,hp);cx.lineTo((hx+fx)/2,hp+(ky-hp)*.5);cx.stroke()}
  E(fx,fy-sz*.018,sz*.055,sz*.03,C.sh);cx.fillStyle="rgba(0,0,0,.35)";cx.fillRect(fx-sz*.055,fy-sz*.01,sz*.11,sz*.01)}
 cx.beginPath();cx.moveTo(sx-w,sy);cx.lineTo(sx+w,sy);cx.lineTo(sx+w*.74,hp+sz*.02);cx.lineTo(sx-w*.74,hp+sz*.02);cx.closePath();cx.fillStyle=hit&&K%200<100?"#fff":C.t;cx.fill();
 const g=cx.createLinearGradient(sx-w,0,sx+w,0);g.addColorStop(0,"rgba(255,255,255,.22)");g.addColorStop(.55,"rgba(255,255,255,0)");g.addColorStop(1,"rgba(0,0,0,.32)");cx.fillStyle=g;cx.fill();
 cx.fillStyle=C.t2;cx.fillRect(sx-w*.76,hp-H*.07,w*1.52,H*.035);cx.fillStyle=C.b;cx.fillRect(sx-w*.76,hp-sz*.01,w*1.52,sz*.07);{const sg=cx.createLinearGradient(0,sy,0,hp);sg.addColorStop(0,"rgba(255,255,255,.12)");sg.addColorStop(1,"rgba(0,0,0,.18)");cx.fillStyle=sg;cx.beginPath();cx.moveTo(sx-w,sy);cx.lineTo(sx+w,sy);cx.lineTo(sx+w*.74,hp+sz*.02);cx.lineTo(sx-w*.74,hp+sz*.02);cx.closePath();cx.fill()}
 if(!fr){cx.fillStyle="#fff";cx.fillRect(sx-w*.38,sy+H*.07,w*.76,H*.1);cx.fillStyle=ink;cx.font="800 "+H*.085+"px system-ui";cx.textAlign="center";cx.fillText(ci+7,sx,sy+H*.152)}
 for(const d of[-1,1]){const a=fr?0:ar?.6*d:s1*d,ax=sx+d*w,ay=sy+sz*.02,ex=ax+d*sz*(fr?.02:.03),ey=ay+H*.14-a*H*.045,hx=ex+d*sz*(fr?.01:-.008),hh=ey+H*.13-a*H*.1;
  P(C.t,sz*.062);cx.beginPath();cx.moveTo(ax,ay);cx.lineTo(ex,ey);cx.stroke();P(C.sk,sz*.05);cx.beginPath();cx.moveTo(ex,ey);cx.lineTo(hx,hh);cx.stroke();E(hx,hh,sz*.03,sz*.03,C.sk)}
 P(C.sk,hr*.75);cx.beginPath();cx.moveTo(sx,sy+sz*.01);cx.lineTo(sx,hc+hr*.9);cx.stroke();
 const PH=fr?faceOk(fc):null;
 if(PH){const pw=hr*2.75,ph=hr*3.2;
  if(C.f||hs===3){E(sx,hc+hr*.9,hr*1.3,hr*2,C.hr);cx.fillStyle="rgba(0,0,0,.18)";cx.beginPath();cx.ellipse(sx,hc+hr*.9,hr*1.3,hr*2,0,0,7);cx.fill()}
  cx.fillStyle="rgba(0,0,0,.22)";cx.beginPath();cx.ellipse(sx,hc+hr*1.45,hr*.7,hr*.28,0,0,7);cx.fill();
  cx.drawImage(PH,sx-pw/2,hc-ph*.5+hr*.08,pw,ph);
  const rg=cx.createLinearGradient(sx-hr,0,sx+hr,0);rg.addColorStop(0,"rgba(255,255,255,.10)");rg.addColorStop(.6,"rgba(255,255,255,0)");rg.addColorStop(1,"rgba(0,0,0,.18)");cx.fillStyle=rg;cx.beginPath();cx.ellipse(sx,hc+hr*.1,hr*1.05,hr*1.3,0,0,7);cx.fill()}
 else{if(fr&&hs===3){E(sx-hr,hc+hr*1.2,hr*.42,hr*1.9,C.hr);E(sx+hr,hc+hr*1.2,hr*.42,hr*1.9,C.hr)}
 if(!fr&&hs===1)E(sx+Math.sin(K/110)*sz*.012,hc+hr*1.5,hr*.38,hr*1.2,C.hr);
 if(hs===4)for(let i=0;i<10;i++){const q=i/10*6.283;if(fr&&Math.sin(q)>.35)continue;E(sx+Math.cos(q)*hr*.98,hc+Math.sin(q)*hr*1.15,hr*.4,hr*.4,C.hr)}
 E(sx-hr,hc+hr*.1,hr*.16,hr*.25,C.sk);E(sx+hr,hc+hr*.1,hr*.16,hr*.25,C.sk);E(sx,hc,hr,hr*1.22,C.sk);
 const hg=cx.createRadialGradient(sx-hr*.35,hc-hr*.4,hr*.15,sx,hc,hr*1.3);hg.addColorStop(0,"rgba(255,255,255,.15)");hg.addColorStop(1,"rgba(40,10,0,.35)");cx.fillStyle=hg;cx.beginPath();cx.ellipse(sx,hc,hr,hr*1.22,0,0,7);cx.fill();
 cx.fillStyle=C.hr;cx.beginPath();if(fr)cx.ellipse(sx,hc-hr*.35,hr*1.06,hr*1.2,0,Math.PI,0);else cx.ellipse(sx,hc-hr*.12,hr*1.07,hr*1.16,0,0,7);cx.fill();
 if(hs===2)E(sx,hc-hr*1.35,hr*.5,hr*.5,C.hr);
 if(hs===3&&!fr){cx.beginPath();cx.moveTo(sx-hr*1.07,hc);cx.quadraticCurveTo(sx-hr*1.3,hc+hr*3,sx,hc+hr*3.3);cx.quadraticCurveTo(sx+hr*1.3,hc+hr*3,sx+hr*1.07,hc);cx.fill()}
 if(hs===5){cx.fillStyle=C.t2;cx.beginPath();cx.ellipse(sx,hc-hr*.3,hr*1.12,hr*1.05,0,Math.PI,0);cx.fill();cx.fillStyle="rgba(0,0,0,.28)";if(fr)cx.fillRect(sx-hr*1.15,hc-hr*.38,hr*2.3,hr*.16);else cx.fillRect(sx-hr*.5,hc-hr*.4,hr,hr*.12)}
 if(fr){for(const d of[-1,1]){E(sx+d*hr*.4,hc+hr*.05,hr*.2,hr*.11,"#fff");E(sx+d*hr*.4,hc+hr*.06,hr*.09,hr*.09,"#2a1810");P(C.hr,Math.max(1,hr*.1));cx.beginPath();cx.moveTo(sx+d*hr*.2,hc-hr*.2);cx.lineTo(sx+d*hr*.62,hc-hr*.26);cx.stroke()}
  if(C.bd){cx.fillStyle=C.hr;cx.beginPath();cx.moveTo(sx-hr*.95,hc+hr*.15);cx.quadraticCurveTo(sx-hr*.9,hc+hr*1.45,sx,hc+hr*1.38);cx.quadraticCurveTo(sx+hr*.9,hc+hr*1.45,sx+hr*.95,hc+hr*.15);cx.quadraticCurveTo(sx,hc+hr*.62,sx-hr*.95,hc+hr*.15);cx.fill()}
  P("rgba(60,20,10,.4)",Math.max(1,hr*.08));cx.beginPath();cx.moveTo(sx,hc+hr*.05);cx.lineTo(sx-hr*.1,hc+hr*.42);cx.lineTo(sx+hr*.1,hc+hr*.42);cx.stroke();
  P(C.bd?"#e8b0a0":"#8a3a2e",Math.max(1,hr*.1));cx.beginPath();cx.arc(sx,hc+hr*.5,hr*.28,.15*Math.PI,.85*Math.PI);cx.stroke()}}
 if(sh){P("#12b5a6",Math.max(2,sz*.04));cx.beginPath();cx.arc(sx,b-H*.5,sz*.55,0,7);cx.stroke()}
 if(name){const fs=Math.max(11,sz*.2);cx.font="800 "+fs+"px 'Baloo 2',system-ui";cx.textAlign="center";const av=faceOk(fc),ao=av?fs*1.1:0,ty=hc-hr*2.9,tw=cx.measureText(name).width+fs*.8+ao,x0=sx-tw/2;rr(x0,ty-fs*.95,tw,fs*1.3,fs*.65,col);if(av){const ar=fs*.78,ax=x0+ar+fs*.08,ay=ty-fs*.3;cx.save();cx.beginPath();cx.arc(ax,ay,ar,0,7);cx.clip();cx.fillStyle="#fff3d6";cx.fillRect(ax-ar,ay-ar,ar*2,ar*2);cx.drawImage(av,ax-ar*1.05,ay-ar*1.12,ar*2.1,ar*2.45);cx.restore();cx.strokeStyle=ink;cx.lineWidth=Math.max(1,fs*.08);cx.beginPath();cx.arc(ax,ay,ar,0,7);cx.stroke()}cx.fillStyle=ink;cx.fillText(name,sx+ao/2,ty)}
 cx.globalAlpha=1}
function draw(){cx.save();if(S.sk>0){S.sk-=.016;OPT.sh&&cx.translate((Math.random()-.5)*14*S.sk,(Math.random()-.5)*14*S.sk)}
 const hz=H*.3,gy=H*.93,LW=Math.min(W*.22,H*.3),cam=1.5+(S.x-1.5)*.5;
 const P=z=>1/(1+z/20),Y=p=>hz+(gy-hz)*p,X=(l,p)=>W/2+(l-cam)*LW*p;
 const LO=LC(),g=cx.createLinearGradient(0,0,0,hz);g.addColorStop(0,LO.sky[0]);g.addColorStop(.6,LO.sky[1]);g.addColorStop(1,LO.sky[2]);cx.fillStyle=g;cx.fillRect(0,0,W,hz+1);{const sg=cx.createRadialGradient(W*.7,hz,0,W*.7,hz,H*.38);sg.addColorStop(0,"rgba("+LO.sun+",.95)");sg.addColorStop(1,"rgba("+LO.sun+",0)");cx.fillStyle=sg;cx.fillRect(0,0,W,hz+1)}
 /*skyline*/
 for(const [f,al,hs] of [[.06,.45,.75],[.15,1,1]]){const sx0=-((S.d*f)%W);cx.globalAlpha=al;for(let rep=0;rep<2;rep++)for(const b of sky){const bx=sx0+rep*W+(b.x+(f<.1?.037:0))*W,bw=b.w*W,bh=b.h*hz*.9*hs;cx.fillStyle=LO.bg[b.ci];
 if(LO.sk==="pyr"||LO.sk==="mtn"){const tp=LO.sk==="mtn"?1.1:.8,m=bx+bw/2;cx.beginPath();cx.moveTo(m-bw*1.1,hz);cx.lineTo(m,hz-bh*tp);cx.lineTo(m+bw*1.1,hz);cx.fill();if(LO.sk==="mtn"){cx.fillStyle="#fff";cx.beginPath();cx.moveTo(m-bw*.31,hz-bh*tp*.72);cx.lineTo(m,hz-bh*tp);cx.lineTo(m+bw*.31,hz-bh*tp*.72);cx.fill()}}
 else if(LO.sk==="hill"){cx.beginPath();cx.ellipse(bx+bw/2,hz,bw*1.5,bh*.8,0,Math.PI,0);cx.fill()}
 else{cx.fillRect(bx,hz-bh,bw,bh);if(b.dome){cx.beginPath();cx.arc(bx+bw/2,hz-bh,bw*.45,Math.PI,0);cx.fill()}}}cx.globalAlpha=1}
 cx.fillStyle=LO.gr;cx.fillRect(0,hz,W,H-hz);
 const q=(l0,l1,za,zb,f)=>{const pa=P(za),pb=P(zb);cx.fillStyle=f;cx.beginPath();cx.moveTo(X(l0,pa),Y(pa));cx.lineTo(X(l1,pa),Y(pa));cx.lineTo(X(l1,pb),Y(pb));cx.lineTo(X(l0,pb),Y(pb));cx.fill()};
 const base=S.d-6,k0=Math.floor(base/10);
 for(let k=k0;k<k0+13;k++){const z0=k*10-base,z1=z0+10;
  q(-1.1,-.5,z0,z1,LO.sd[k%2]);q(3.5,4.1,z0,z1,LO.sd[k%2]);
  q(-.5,3.5,z0,z1,LO.rd[k%2]);q(-.62,-.5,z0,z1,LO.cb[k%2]);q(3.5,3.62,z0,z1,LO.cb[k%2]);
  if(k%2){q(.47,.53,z0,z1,"rgba(255,255,255,.7)");q(1.47,1.53,z0,z1,"rgba(255,255,255,.7)");q(2.47,2.53,z0,z1,"rgba(255,255,255,.7)")}}
 const E=[];
 for(const o of items){if(o.g)continue;const z=o.z-S.d+6;if(z>115)break;if(z>-2)E.push({z,o})}
 const fz=L-S.d+6;if(fz>-2&&fz<115)E.push({z:fz,f:1});
 {const k0=Math.floor((S.d-6)/12);for(let k=k0;k<k0+10;k++){const z=k*12-S.d+6;if(z>-2)for(const sd of[-1,1])E.push({z,dc:1,sd,k})}}const ord=order();
 for(const p of viewers()){if(p.isMe||p.presence.st<2)continue;
  const s=sm[p.peer]||(sm[p.peer]={d:p.presence.d||0,x:p.presence.x??1});
  s.d+=((p.presence.d||0)-s.d)*.35;s.x+=((p.presence.x??1)-s.x)*.35;
  const z=s.d-S.d+6;if(z>-3&&z<115)E.push({z,pl:p,s})}
 E.push({z:6,me:1});E.sort((a,b)=>b.z-a.z);
 myc=(rm||bots.length)?Math.max(0,ord.indexOf(myId))%4:1;
 cx.textAlign="center";
 for(const e of E){const p=P(e.z),yy=Y(p),sz=LW*p;
  if(e.f){for(let r=0;r<2;r++)for(let i=0;i<16;i++)q(-.5+i*.25,-.25+i*.25,e.z+r*1.5,e.z+r*1.5+1.5,(i+r)%2?"#fff":"#222");
   const xa=X(-.5,p),xb=X(3.5,p);cx.fillStyle="#fff";cx.fillRect(xa-sz*.05,yy-sz*1.7,sz*.1,sz*1.7);cx.fillRect(xb-sz*.05,yy-sz*1.7,sz*.1,sz*1.7);
   rr(xa,yy-sz*1.7,xb-xa,sz*.42,sz*.06,"#ff4f7b");cx.fillStyle="#fff";cx.font="800 "+sz*.3+"px 'Baloo 2',system-ui";cx.fillText("FINISH",(xa+xb)/2,yy-sz*1.38);continue}
  if(e.dc){const x=X(e.sd<0?-.95:3.95,p),dt2=LO.dc[(e.k+(e.sd>0?1:0))%LO.dc.length];if(dt2!=="bld"){deco(dt2,x,yy,sz,e.k,e.sd);continue}const w=sz*1.3,h=sz*(1.4+(e.k*5%3)*.35),c=LO.bc[(e.k*3+(e.sd>0?2:0))%LO.bc.length];rr(x-w/2,yy-h,w,h,sz*.04,LO.bb);rr(x-w/2,yy-h*.45,w,h*.12,0,c);for(let i=0;i<3;i++)rr(x-w*.4+i*w*.3,yy-h*.9,w*.2,h*.2,2,(e.k+i)%3?"#ffd98a":"#4a3a7a");continue}
  if(e.me){const mx=X(S.x,p);
   while(FQ.length){const k=FQ.pop();if(k==="c")burst(mx,yy-sz*.8,6,"#ffd23f",3,.1,.5);else if(k==="n")burst(mx,yy-sz*.5,14,"#5bd94a",5,.12,.8);else burst(mx,yy-sz*.6,40,"#ff6a3a",9,.2,1.1)}
   if(S.st==="run"&&S.y<=0&&S.sp>3&&Math.random()<.6)burst(mx+(Math.random()-.5)*sz*.2,yy,1,LO.gr,1.2,.02,.5);
   if(S.bt>0&&Math.random()<.9)burst(mx,yy-sz*.1,2,"#ffb347",2,.05,.35);if(S.sc>0)scoot(mx,yy-S.y*sz*.5,sz);runner(mx,yy,sz,COL[myc],myCh,S.y+(S.sc>0?.35:0),S.sl>0,"YOU",S.bt>0,S.sh,S.hit>0,1,0,MYF);continue}
  if(e.pl){const q2=e.pl.presence,ci=ord.indexOf(e.pl.peer)%4;{const jn=(q2.y||0)>.25;if(jn&&!e.s.j)sfx("jump",q2.ch|0,.35);e.s.j=jn;if(q2.cr&&!e.s.k)sfx("crash",q2.ch|0,.45);e.s.k=q2.cr}runner(X(e.s.x,p),yy,sz,COL[ci],q2.ch|0,q2.y||0,q2.sl,(q2.cr?"💥 ":q2.st===3?"🏁 ":"")+nm(q2),q2.bt,q2.sh,0,.85,0,PFI[e.pl.peer]);continue}
  const o=e.o,sx=X(o.l,p);
  if(o.t==="coin"){cx.strokeStyle="#ff8f1f";cx.lineWidth=Math.max(2,sz*.06);cx.beginPath();for(let a=0;a<12;a+=.3){const r=sz*.015*a+sz*.02;cx.lineTo(sx+Math.cos(a)*r,yy-sz*.45+Math.sin(a)*r)}cx.stroke()}
  else if(o.t==="low")barr(sx,yy,sz)
  else if(o.t==="high"){cx.fillStyle="#8d93a8";cx.fillRect(sx-sz*.44,yy-sz*1.05,sz*.06,sz*1.05);cx.fillRect(sx+sz*.38,yy-sz*1.05,sz*.06,sz*1.05);for(let i=0;i<6;i++)rr(sx-sz*.45+i*sz*.15,yy-sz*1.05,sz*.15,sz*.3,0,i%2?"#ffc233":"#2a1b4d")}
  else if(o.t==="wall")brick(sx,yy,sz)
  else if(o.t==="rick")rick(sx,yy,sz)
  else{cx.fillStyle=o.t==="boost"?"rgba(255,194,51,.5)":o.t==="crate"?"rgba(255,79,123,.55)":o.t==="scoot"?"rgba(18,181,166,.7)":"rgba(18,181,166,.4)";cx.beginPath();cx.arc(sx,yy-sz*.45,sz*.34,0,7);cx.fill();cx.font=sz*.5+"px serif";cx.fillStyle="#000";cx.fillText(o.t==="boost"?"🥟":o.t==="crate"?"🎁":o.t==="scoot"?"🛵":"🍵",sx,yy-sz*.3)}}
 pts2();wxd();
 if(S.bt>0){cx.strokeStyle="rgba(255,255,255,.35)";cx.lineWidth=2;for(let i=0;i<14;i++){const a=Math.random()*6.28,r1=Math.min(W,H)*(.35+Math.random()*.2);cx.beginPath();cx.moveTo(W/2+Math.cos(a)*r1,H*.55+Math.sin(a)*r1);cx.lineTo(W/2+Math.cos(a)*r1*1.35,H*.55+Math.sin(a)*r1*1.35);cx.stroke()}}
 cx.restore();{const v=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(10,4,30,.55)");cx.fillStyle=v;cx.fillRect(0,0,W,H)}
 if(S.fg>0){const a=Math.min(.92,S.fg),g2=cx.createLinearGradient(0,hz,0,H*.8);g2.addColorStop(0,"rgba(232,236,250,"+a+")");g2.addColorStop(1,"rgba(232,236,250,0)");cx.fillStyle=g2;cx.fillRect(0,0,W,H*.8)}
 if(S.cr&&S.sk>0){cx.fillStyle="rgba(255,60,60,"+S.sk*.6+")";cx.fillRect(0,0,W,H)}
 hud(ord)}
function hud(ord){
 if(S.st==="menu"||S.st==="lobby"||S.st==="ready")return;
 $("pw").textContent=S.pw?PW.find(x=>x[0]===S.pw)[1]:"🎁";$("pw").disabled=!S.pw;$("pw").classList.toggle("rdy",!!S.pw);const bx=20,bw=W-40,by=22,pr=d=>bx+bw*Math.max(0,Math.min(1,d/L)),F=s=>"800 "+s+"px 'Baloo 2',system-ui";
 {const g3=cx.createLinearGradient(0,0,0,100);g3.addColorStop(0,"rgba(20,10,48,.8)");g3.addColorStop(1,"rgba(20,10,48,0)");cx.fillStyle=g3;cx.fillRect(0,0,W,100)}
 rr(bx,by-4,bw,8,4,"rgba(255,255,255,.25)");rr(bx,by-4,Math.max(8,pr(S.d)-bx),8,4,LC().ac);cx.textAlign="center";
 const oth=viewers().filter(p=>!p.isMe&&p.presence.st>=2);
 for(const p of oth){cx.fillStyle=COL[ord.indexOf(p.peer)%4];cx.beginPath();cx.arc(pr(p.presence.d||0),by,8,0,7);cx.fill()}
 cx.fillStyle=COL[myc];cx.strokeStyle="#fff";cx.lineWidth=3;cx.beginPath();cx.arc(pr(S.d),by,10,0,7);cx.fill();cx.stroke();
 cx.font="16px serif";cx.fillStyle="#fff";cx.fillText("🏁",bx+bw,by+22);
 let rk=1;for(const p of oth){const o=p.presence;if(o.cr?0:o.st===3?(S.st!=="done"||o.ft<S.ft):(o.d||0)>S.d)rk++}
 cx.textAlign="left";cx.fillStyle="#fff";cx.font=F(24);cx.fillText(["1st","2nd","3rd","4th"][rk-1]+" of "+(oth.length+1),20,62);
 cx.textAlign="center";cx.font=F(18);cx.fillStyle="rgba(255,255,255,.9)";cx.fillText(Math.round(S.sp*7)+" km/h"+(S.sc>0?"  🛵 "+Math.ceil(S.sc)+"s":"")+(S.fz>0?" ❄️":"")+(S.dz>0?" 🌀":"")+(S.fg>0?" 🌫️":"")+(S.lk>0?" 🔒":""),W/2,62);cx.textAlign="right";cx.font=F(20);cx.fillText("🌀 "+S.coins+"   🥟 ×"+S.ch,W-20,62);cx.textAlign="left";cx.font=F(16);cx.fillStyle="#ffe9a0";cx.fillText("⭐ "+score()+(S.cm>1?"   🔥 x"+S.cm:""),20,86);cx.fillStyle="#fff";
 cx.textAlign="center";cx.lineWidth=6;cx.strokeStyle="#2a1b4d";
 const big=(t,sz,c,y)=>{cx.font=sz+"px Bungee,'Baloo 2',system-ui";cx.fillStyle=c;cx.strokeText(t,W/2,y);cx.fillText(t,W/2,y)};
 if(S.st==="count"){{const n3=4-cdn(),r3=Math.min(W,H)*.05;for(let i=0;i<3;i++){cx.fillStyle=i<n3?"#ff2d2d":"#3a1a3a";cx.shadowColor="#ff2d2d";cx.shadowBlur=i<n3?24:0;cx.beginPath();cx.arc(W/2+(i-1)*r3*2.6,H*.3,r3,0,7);cx.fill()}cx.shadowBlur=0}big(cdn(),Math.min(W,H)*.25,"#ffc233",H*.5);cx.font=F(16);cx.fillStyle="#fff";cx.lineWidth=4;cx.strokeText("Swipe or arrow keys to move, jump, slide · Shift or 🥟 to boost",W/2,H*.58);cx.fillText("Swipe or arrow keys to move, jump, slide · Shift or 🥟 to boost",W/2,H*.58)}
 else if(S.st==="run"&&S.t<.8)big("GO!",Math.min(W,H)*.2,"#5bd94a",H*.5);
 if(S.st==="run"&&S.t<2.6){cx.globalAlpha=Math.min(1,(2.6-S.t)*1.5,S.t*3+.2);cx.font=Math.min(W*.06,34)+"px Bungee,'Baloo 2',system-ui";cx.fillStyle="#fff";cx.lineWidth=5;cx.strokeStyle="#2a1b4d";const tx=LC().e+" "+LC().n;cx.strokeText(tx,W/2,H*.24);cx.fillText(tx,W/2,H*.24);cx.globalAlpha=1}
 if(S.mt>0){cx.globalAlpha=Math.min(1,S.mt*2);big(S.msg,28,"#fff",H*.2);cx.globalAlpha=1}}
/* ---- dashboard: profile, characters, levels, start game ---- */
const UNRE=/^[a-z0-9_]{3,16}$/,mkUser=n=>((n||"runner").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,10)||"runner")+Math.floor(100+Math.random()*900);
const INTRO=["The street-smart sprinter from Kathmandu who never stops running. Fast, fearless, always one step ahead.","Quick feet and a quicker mind. She builds walls in her rivals’ way while she sprints past.","The joker with a spinning secret. One zap and rivals don’t know left from right.","Cool under pressure. He freezes the competition solid, then dashes off.","Calm as mountain mist. She hides the road in thick fog so rivals run blind.","Fierce and focused. She locks rivals into their lane and leaves them stuck.","Big heart, bigger shove. He sends rivals flying into a random lane."];
let TAB=0,vc=myCh;
const lvOf=()=>{const x=(ST2.c||0)+(ST2.r||0)*20;return{l:1+Math.floor(x/100),p:x%100}};
function toast(t){const e=$("toast");e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{e.hidden=true},3500)}
async function claimUser(u,old){for(let i=0;i<30&&!db;i++)await new Promise(r=>setTimeout(r,100));if(!db)return"offline";
 try{const r=await runTransaction(ref(db,"usernames/"+u),v=>v&&v!==myUid?undefined:myUid);if(!r.committed)return"taken";if(old&&old!==u)remove(ref(db,"usernames/"+old)).catch(()=>{});return"ok"}catch(e){return"error"}}
function openProfile(){const p=PROF||{};$("nick").value=p.name||"";$("em").value=p.email||"";$("un").value=p.user||"";$("un").dataset.t=p.user?"1":"";if(p.cc)$("ct").value=p.cc;
 $("cn1").hidden=!PROF;$("n1").textContent=PROF?"Save":"Enter game";$("ph1").textContent=PROF?"Edit profile":"Create your player";msg("m9","");photoUI();show("p1")}
function home(){S.st="menu";if(!PROF)return openProfile();show(null);dashUI()}
$("nick").oninput=()=>{if(!$("un").dataset.t&&!PROF)$("un").value=mkUser($("nick").value)};
$("un").oninput=()=>{$("un").dataset.t="1";$("un").value=$("un").value.toLowerCase().replace(/[^a-z0-9_]/g,"")};
$("n1").onclick=async()=>{const n=$("nick").value.trim().slice(0,20),em=$("em").value.trim().toLowerCase(),u=$("un").value.trim().toLowerCase();
 if(!n)return msg("m9","Type your name.");
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return msg("m9","Enter a valid email address.");
 if(!UNRE.test(u))return msg("m9","Username: 3 to 16 letters, numbers or _");
 const old=PROF&&PROF.user;$("n1").disabled=true;msg("m9","Checking username…");
 const r=u===old?"same":await claimUser(u,old);$("n1").disabled=false;
 if(r==="taken")return msg("m9","That username is already taken. Try another one.");
 if(r==="offline"||r==="error")toast("Couldn’t reserve the username online. Saved on this device.");
 PROF={name:n,email:em,user:u,cc:$("ct").value};sv("bkp",PROF);msg("m9","");home()};
$("cn1").onclick=home;$("pfb").onclick=openProfile;
function dashUI(){if(!booted||!PROF)return;const v={l:CL[myCh],p:CL[myCh]*10};$("dn").textContent=PROF.name;$("du").textContent="@"+PROF.user;$("dl").textContent="Lv "+v.l+" / 10";$("dx").style.width=v.p+"%";$("dm").textContent="💎 "+DM;
 const c=$("avc").getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,96,96);bust(c,48,48,44,myCh,MYF);
 $("cn").textContent=CH[myCh].n;$("cp").textContent=PW[myCh][1]+" "+PW[myCh][2]+": "+PW[myCh][3];
 const b=(ST2.lb||{})[LC().k];$("bs").textContent=b?"🏆 Best at "+LC().n+": "+b.toFixed(1)+"s":"";
 [...$("th").children].forEach((x,i)=>{x.classList.toggle("on",i===myCh);x.lastChild.textContent=CH[i].n+" · Lv "+CL[i]});locUI();photoUI();chUI()}
function buildThumbs(){CH.forEach((c,i)=>{const b=document.createElement("button"),k=document.createElement("canvas"),s=document.createElement("span");k.width=112;k.height=144;s.textContent=c.n;b.append(k,s);b.setAttribute("aria-label",c.n);b.onclick=()=>{vc=i;chUI();sfx("pick",i)};$("th").append(b);TH.push(k)});drawThumbs()}
function chUI(){const p=PW[vc];$("cn2").textContent=CH[vc].n;$("ci").textContent=INTRO[vc];$("cw").innerHTML="<b>"+p[1]+" "+p[2]+"</b><span>Power: "+p[3]+"</span>";
 {const L=CL[vc];$("cl").textContent="Level "+L+" / 10";$("lu").textContent=L>=10?"MAX LEVEL":"⬆ Level up · 💎 "+10*L;$("lu").disabled=L>=10}
 $("set").textContent=vc===myCh?"✔ Your runner":"Set as my runner";$("set").disabled=vc===myCh;[...$("th").children].forEach((b,i)=>b.classList.toggle("sel",i===vc))}
$("set").onclick=()=>{pick(vc);chUI()};
$("lu").onclick=()=>{const L=CL[vc];if(L>=10)return;if(DM<10*L){snd(200,.2,"sawtooth",.06,-80);return toast("Need 💎 "+10*L+" to level up "+CH[vc].n+". You have 💎 "+DM+".")}DM-=10*L;CL[vc]=L+1;sv("dm",DM);sv("cl",CL);sfx("win",vc,.6);dashUI()};
[...$("dt").children].forEach((b,i)=>b.onclick=()=>{TAB=i;[...$("dt").children].forEach((x,j)=>x.classList.toggle("on",j===i));[0,1,2].forEach(j=>$("t"+j).hidden=j!==i);if(i===1){vc=myCh;chUI()}snd(600,.06,"triangle",.05)});
function panels(){const on=$("md").value==="1",t=$("ol").value;$("offp").hidden=on;$("onp").hidden=!on;$("cd").hidden=!on||t!=="2";$("dfp").hidden=on&&t!=="1";msg("m0","")}
$("md").onchange=$("ol").onchange=panels;
$("go").onclick=()=>{msg("m0","");if($("md").value==="0")return begin(true,0,+$("nb").value);const t=$("ol").value;if(t==="0")quick();else if(t==="1")mk();else joinRoom($("cd").value)};
function boot(){booted=1;buildThumbs();if(PROF&&PROF.cc)$("ct").value=PROF.cc;$("inst").hidden=standalone();panels();home()}
boot();
let last=performance.now();
function loop(n){const dt=PA?0:Math.min(.05,(n-last)/1000);last=n;step(dt);botStep(dt);checkStart();fx();
 if(rm&&n-lastP>45&&(S.st==="run"||S.st==="count"||S.st==="done")){lastP=n;pres()}
 if(!$("dash").hidden){if(TAB===0)pv($("pv"),myCh);else if(TAB===1)pv($("pv2"),vc)}draw();if(PA){cx.fillStyle="rgba(10,4,30,.6)";cx.fillRect(0,0,W,H);cx.fillStyle="#fff";cx.textAlign="center";cx.font="800 36px system-ui";cx.fillText("⏸ PAUSED · press P",W/2,H/2)}requestAnimationFrame(loop)}
requestAnimationFrame(loop);

})();
