import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,updateProfile,GoogleAuthProvider,signInWithPopup} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {initializeFirestore,persistentLocalCache,collection,doc,setDoc,getDoc,addDoc,updateDoc,deleteDoc,getDocs,query,where,onSnapshot,arrayUnion,arrayRemove} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=initializeFirestore(app,{localCache:persistentLocalCache()});
const XPCSS=`:root{--sab:env(safe-area-inset-bottom,0px)}html.kb{--sab:0px}
html.lock,html.lock body{overflow:hidden}html.lock body{position:fixed;left:0;right:0;width:100%}
.xp{position:fixed;top:0;left:0;right:0;height:var(--vvh,100%);transform:translate(var(--vvx,0px),var(--vvy,0px));z-index:30;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;background:var(--bg)}
.xp-in{max-width:560px;margin:0 auto;padding:0 16px 8px}
.xp-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:10px;margin:0 -16px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;background:var(--bg)}
.xp-top::after{content:"";width:40px;flex:none}
.xp-top h3{flex:1;margin:0;text-align:center;font:800 18px var(--display)}
.xp-top .xbtn{float:none;position:static;margin:0;flex:none}
.xp-amt{text-align:center;padding:6px 0 2px}
.who{display:inline-flex;align-items:center;gap:8px;max-width:100%;padding:5px 14px 5px 5px;border-radius:99px;background:var(--surf);border:1px solid var(--line);font-size:14px;font-weight:700;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.who .av{width:26px;height:26px;font-size:12px}
.xp-money{display:flex;align-items:baseline;justify-content:center;gap:4px;margin-top:18px}
.xp-money span{font:800 34px var(--display);color:var(--mute)}
.xp-money input{width:4ch;min-width:0;max-width:calc(100vw - 110px);border:0;background:none;outline:0;padding:0;text-align:left;font:800 56px var(--display);letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--ink)}.xp-money input::placeholder{color:var(--line)}
.xp-desc{display:block;width:100%;margin:12px 0 0;padding:13px 16px;border:1.5px solid var(--line);border-radius:16px;background:var(--surf);outline:0;text-align:center;font:700 18px Nunito,system-ui,sans-serif;color:var(--ink);transition:border-color .15s,box-shadow .15s}.xp-desc::placeholder{color:var(--mute);font-weight:600}
.xp-desc:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(34,197,94,.22)}
.xp-cats{position:relative;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:10px 16px 12px;margin:10px -16px 0;touch-action:pan-x pan-y;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:none}.xp-cats::-webkit-scrollbar{display:none}
.xp-cat{flex:none;scroll-snap-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;width:74px;font-size:12px;font-weight:700;color:var(--mute);transition:color .15s}
.xp-cat i{font-style:normal;width:56px;height:56px;border-radius:20px;display:grid;place-items:center;font-size:26px;background:var(--surf);border:1.5px solid var(--line);transition:background .15s,border-color .15s,transform .15s}
.xp-cat:active i{transform:scale(.94)}
.xp-cat.on{color:var(--ink)}.xp-cat.on i{background:rgba(34,197,94,.18);border-color:var(--green);transform:scale(1.06)}
.xp-card{margin-top:12px;border-radius:20px;background:var(--surf);border:1px solid var(--line);overflow:hidden}
.xp-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;min-height:56px}.xp-row+.xp-row{border-top:1px solid var(--line)}
.xp-row>label,.xp-row>b{flex:none;font-weight:700}
.xp-row select,.xp-row input{min-width:0;max-width:62%;border:0;background:none;outline:0;text-align:right;font-weight:700;padding:6px 0;-webkit-appearance:none;appearance:none;color:var(--ink)}
.xp-row select{padding-right:22px;text-overflow:ellipsis;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%2394a19a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E") no-repeat right center}
.xp-who{padding:14px 16px 16px}.xp-who>b{display:block;margin-bottom:10px;font-weight:700}.xp-who+.xp-row{border-top:1px solid var(--line)}
.paychips{display:flex;flex-wrap:wrap;gap:8px}
.paychip{display:flex;align-items:center;gap:8px;min-height:44px;max-width:100%;padding:5px 16px 5px 5px;border-radius:99px;border:1.5px solid var(--line);background:var(--bg);font-size:15px;font-weight:700;color:var(--ink);transition:background .15s,border-color .15s,color .15s}
.paychip .av{width:32px;height:32px;font-size:14px}
.paychip>span:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.paychip:active{transform:scale(.97)}
.paychip.on{background:var(--green);border-color:var(--green);color:var(--on)}
.xp-row input[type=date]{display:block;min-height:36px;margin:0;line-height:1.2}.xp-row input[type=date]::-webkit-date-and-time-value{text-align:right;margin:0}
.xp-row input.xp-note{flex:1;max-width:100%}
.xp-h{margin:22px 4px 0;font-size:14px;font-weight:800;color:var(--mute)}
.seg{display:flex;gap:4px;padding:4px;border-radius:14px;background:var(--surf2)}
.seg button{flex:1;min-width:0;min-height:40px;padding:8px 6px;border-radius:11px;font-size:14px;font-weight:800;color:var(--mute);transition:background .15s,color .15s}
.seg button.on{background:var(--green);color:var(--on)}
.xp .seg{margin:0}
.xp .plist{margin:0;padding:0 16px 4px;border-radius:0;background:none}
.xp .plist .pr{gap:12px;padding:0;min-height:56px}.xp .plist .pr+.pr{border-top:1px solid var(--line)}
.xp .plist .pr label{align-self:stretch;padding:8px 0;cursor:pointer}
.xp .plist .pr input[type=checkbox]{-webkit-appearance:none;appearance:none;flex:none;display:grid;place-items:center;width:26px;height:26px;margin:0;border-radius:50%;border:2px solid var(--line);background:var(--bg);transition:background .15s,border-color .15s}
.xp .plist .pr input[type=checkbox]:checked{background:var(--green);border-color:var(--green)}
.xp .plist .pr input[type=checkbox]:checked::after{content:"";width:6px;height:11px;margin-top:-2px;border:solid var(--on);border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.xp .plist .pr input[type=checkbox]:not(:checked)~label{opacity:.5}
.xp .plist .in{padding:10px 12px;background:var(--bg)}
.xp .pr .sub[data-eq]{font:800 15px var(--display);color:var(--ink);font-variant-numeric:tabular-nums}
.xp .hint{margin:10px 0 0;padding:10px 14px;border-radius:12px;background:var(--surf2);text-align:center;font-size:14px;font-weight:700;color:var(--mute);transition:background .15s,color .15s}
.xp .hint.ok{background:rgba(34,197,94,.14);color:var(--gd)}.xp .hint.bad{background:rgba(198,58,26,.12);color:var(--owe)}
.xp-foot{position:sticky;bottom:0;z-index:3;margin:16px -16px 0;padding:22px 16px calc(14px + var(--sab));background:linear-gradient(to bottom,transparent,var(--bg) 24px)}
.xp-foot .btn{padding:16px 18px;font-size:17px;border-radius:16px;box-shadow:0 8px 22px rgba(34,197,94,.28)}`;
{const st=document.createElement("style");st.id="xp-css";st.textContent=XPCSS;document.head.appendChild(st)}
const THEMECSS=`
.row.top{align-items:flex-start}.row.top .amt{padding-top:2px}
.tree{display:block;margin:4px 0 0 2px;border-left:1.5px solid var(--line)}
.tl{display:block;position:relative;padding:4px 0 4px 20px;font-size:14px;color:var(--mute)}
.tl::before{content:"";position:absolute;left:0;top:50%;width:14px;border-top:1.5px solid var(--line)}
.tl.pos{color:var(--gd)}.tl.neg{color:var(--owe)}
.hide{padding:22px 20px 12px;text-align:center;color:var(--mute)}.sbtn{width:auto;margin:0 auto;padding:14px 26px;border-radius:99px;border-color:var(--green);color:var(--green)}
.ctile{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;font-size:24px;background:var(--surf2);flex:none}
.banner{height:140px;background:linear-gradient(135deg,transparent 38%,rgba(255,255,255,.14) 38% 66%,transparent 66%),linear-gradient(45deg,rgba(0,0,0,.18) 28%,transparent 28%),linear-gradient(135deg,#22c55e,#117a45)}
.gh2{padding:0 20px 6px}.gav{display:block;width:fit-content;margin-top:-40px}.gav .tile{border:4px solid var(--bg);box-sizing:content-box}
.gname{margin:10px 0 2px;font:800 30px/1.15 var(--display)}.gbal{font:800 19px var(--display);margin:2px 0 4px}
.lnk{color:var(--green);font-weight:700;text-decoration:underline}
.pills{display:flex;gap:10px;overflow-x:auto;padding:14px 16px 10px;scrollbar-width:none}.pills::-webkit-scrollbar{display:none}
.pill{flex:none;padding:12px 22px;border-radius:99px;border:2px solid var(--line);font-weight:700;font-size:16px;color:var(--ink)}
.pill.on{background:var(--green);border-color:var(--green);color:var(--on)}
.ac{display:flex;gap:16px;align-items:flex-start;width:100%;padding:16px;text-align:left}.ac.new{background:rgba(34,197,94,.13)}
.aic{position:relative;flex:none;width:52px;height:52px;margin-right:4px}.aic .ctile{width:52px;height:52px;border-radius:10px}
.abg{position:absolute;right:-10px;bottom:-10px;line-height:0;border-radius:50%;border:3px solid var(--bg)}.abg .av{width:28px;height:28px;font-size:12px}
.acx{flex:1;min-width:0;display:block}.at{font-size:17px;line-height:1.35}.at b{font-weight:800}.ao{font:800 19px var(--display);margin:2px 0}
.fowe{display:flex;justify-content:center;align-items:center;gap:10px;width:100%;font:800 19px var(--display);padding:6px 0}
.chev{width:9px;height:9px;border:solid var(--mute);border-width:0 2px 2px 0;transform:rotate(45deg);margin-bottom:4px;transition:transform .15s}.chev.up{transform:rotate(225deg);margin:4px 0 0}
.fbrk{border-left:3px solid var(--line);padding:2px 0 2px 14px;margin:8px 0 4px;line-height:1.8;font-size:16px}
.dtop::after{display:none}
.dh{display:flex;gap:14px;align-items:flex-start;padding:6px 0 12px}.dh .ctile{width:64px;height:64px;font-size:30px;border-radius:16px}
.dh h2{margin:0;font:800 22px var(--display)}.dh .big{font:800 34px var(--display);margin:2px 0 8px}
.gchip{display:inline-flex;align-items:center;gap:8px;padding:4px 14px 4px 4px;border:1.5px solid var(--line);border-radius:14px;font-weight:700}.gchip .tile{width:34px;height:34px;border-radius:9px;font-size:15px}
.dsec{border-top:1px solid var(--line);margin:16px -16px 0;padding:18px 16px 4px}.mhh{font:800 15px var(--display);margin-bottom:12px}
.pay{display:flex;align-items:center;gap:14px;font:800 20px var(--display)}.pay .av{width:56px;height:56px;font-size:22px}
.ptree{margin:0 0 12px 27px;border-left:1.5px solid var(--line)}.ptr{display:flex;align-items:center;gap:12px;padding:8px 0;color:var(--mute);font-size:17px}
.ptr::before{content:"";width:18px;border-top:1.5px solid var(--line)}.ptr .av{width:36px;height:36px;font-size:15px}
.tr{display:flex;align-items:center;gap:12px;margin:10px 0}.tr>span:first-child{width:34px}.tb{flex:1}.tb i{display:block;height:22px;border-radius:3px;background:var(--ink);opacity:.85}.tv{min-width:76px;text-align:right;font-weight:700}
.cm{display:flex;gap:12px;padding:8px 0}.cm .av{width:36px;height:36px;font-size:15px}.cb{min-width:0;overflow-wrap:anywhere}
.cin{position:sticky;bottom:0;z-index:3;display:flex;gap:8px;align-items:center;margin:14px -16px 0;padding:10px 16px calc(10px + var(--sab));background:var(--bg);border-top:1px solid var(--line)}
.cin .in{margin:0;flex:1;border-radius:99px;padding:12px 18px}.csend{width:48px;padding:12px 0;border-radius:50%;flex:none}


.hero{position:relative;overflow:hidden;margin:8px 16px 22px;padding:22px 22px 20px;border-radius:28px;background:var(--surf);border:1px solid var(--line);box-shadow:var(--shadow);--glow:rgba(34,197,94,.16)}
.hero.is-neg{--glow:rgba(255,127,95,.16)}
.hero::before{content:"";position:absolute;right:-70px;top:-90px;width:260px;height:260px;border-radius:50%;background:radial-gradient(closest-side,var(--glow),transparent);pointer-events:none}
.hero>*{position:relative}
.hero .hi{padding:0;font-size:15px;font-weight:700;color:var(--mute)}
.hero .big{font:800 48px/1.05 var(--display);letter-spacing:-.035em;margin:10px 0 4px}
.hero .cap{display:flex;align-items:center;font-size:15px;font-weight:700;color:var(--mute)}
.chk{display:inline-grid;place-items:center;width:20px;height:20px;margin-right:8px;border-radius:50%;background:var(--green);color:var(--on);font-size:12px;font-weight:800}
body::before{content:"";position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);background:var(--bg);z-index:6}
.bar{background:var(--bg);background:color-mix(in srgb,var(--bg) 92%,transparent)}
.tabs{border-top-color:var(--line);background:var(--bg);background:color-mix(in srgb,var(--bg) 94%,transparent)}
.tabs{left:0;right:0;bottom:0;max-width:none;margin:0;border:0;border-top:1px solid var(--line);border-radius:0;box-shadow:none;background:var(--bg);background:color-mix(in srgb,var(--bg) 90%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.tabs div{max-width:560px;margin:0 auto;padding:8px 8px calc(6px + env(safe-area-inset-bottom,0px))}
.tabs svg{width:64px;height:32px;padding:4px 20px}
.fab{bottom:calc(88px + env(safe-area-inset-bottom,0px))}
.fab2{bottom:calc(154px + env(safe-area-inset-bottom,0px));background:var(--surf);color:var(--ink);border:1px solid var(--line);box-shadow:var(--shadow)}
:root[data-theme="dark"] .fab{box-shadow:0 8px 22px rgba(34,197,94,.22),0 2px 6px rgba(0,0,0,.5)}
`;
{const st=document.createElement("style");st.id="sw-css";st.textContent=THEMECSS;document.head.appendChild(st)}
const COLORS=["#16a34a","#ea580c","#2563eb","#9333ea","#0891b2","#be185d"];
const $=id=>document.getElementById(id);
let U=null,groups=[],X={},unsubs={},unG=null,started=null,signing=false,lockY=null;
let V={ready:false,mode:"login",tab:"groups",gid:null,sheet:null,draft:null,toast:null,err:"",email:"",sn:"",sp:"",sphoto:"",rid:null,join:false};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=c=>"$"+(Math.abs(c)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const nm=(g,u)=>(g.members&&g.members[u])||"Former member";
const col=u=>COLORS[[...u].reduce((a,c)=>a+c.charCodeAt(0),0)%COLORS.length];
const avU=(n,p,u,c="")=>p?`<img class="av ${c}" src="${esc(p)}" alt="">`:`<span class="av ${c}" style="background:${col(u)}" aria-hidden="true">${esc((n||"?")[0].toUpperCase())}</span>`;
const av=(g,u)=>avU(nm(g,u),g.photos&&g.photos[u],u);
const gcur=()=>groups.find(g=>g.id===V.gid);
const inGroup=()=>{const c=V.gid&&gcur();return !!c&&!c.direct};
const closeSheet=()=>{const c=gcur();if(c&&c.direct)V.gid=null;V.sheet=null;V.prc=null;if(V.cun){V.cun();V.cun=null}};
const cents=s=>{let t=String(s);if(/^\s*\d*,\d{1,2}\s*$/.test(t))t=t.replace(",",".");const n=parseFloat(t.replace(/[^0-9.]/g,""));return isNaN(n)?0:Math.round(n*100)};
const num=s=>parseFloat(String(s).replace(",","."))||0;
const cleanNum=s=>{let v=String(s).replace(/[^0-9.,]/g,"");const i=v.indexOf(".");return i<0?v:v.slice(0,i+1)+v.slice(i+1).replace(/[^0-9]/g,"").slice(0,2)};
const normPhone=s=>String(s||"").replace(/[^\d+]/g,"");
const mon=t=>new Date(t).toLocaleString("en-US",{month:"long",year:"numeric"});
const NOTICE="We are working on this. It will be fixed in the next update.";
const errMsg=e=>({"auth/invalid-credential":"Email or password is wrong.","auth/email-already-in-use":"That email already has an account. Log in instead.","auth/weak-password":"Use at least 6 characters for the password.","auth/invalid-email":"Enter a valid email address.","auth/too-many-requests":"Too many attempts. Wait a minute and try again.","auth/network-request-failed":"No connection. Check your internet and try again.","unavailable":"No connection. Check your internet and try again."}[e&&e.code]||NOTICE);
const title=(g,e)=>e.kind==="payment"?`${nm(g,e.payer)} paid ${nm(g,Object.keys(e.split)[0])}`:e.desc;
const userDoc=()=>({name:U.name,email:U.email,phone:U.phone||"",photo:U.photo||""});
const prof=()=>({["members."+U.uid]:U.name,["photos."+U.uid]:U.photo||"",["phones."+U.uid]:U.phone||""});

const tile=(g,c="")=>g.photo?`<img class="tile ${c}" src="${esc(g.photo)}" alt="">`:`<span class="tile ${c}" style="background:${col(g.id)}">${esc((g.name||"?")[0].toUpperCase())}</span>`;
const IC={groups:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',friends:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',activity:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',account:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.17 18.85a7 7 0 0 1 11.66 0"/>',plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',back:'<polyline points="15 18 9 12 15 6"/>',share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',sun:'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',userplus:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>'};
const ic=n=>`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const ago=t=>{const d=Date.now()-t,m=Math.floor(d/6e4),h=Math.floor(d/36e5);if(!(d>=0)||m<1)return"just now";if(m<60)return m+(m===1?" minute":" minutes")+" ago";if(h<24)return h+(h===1?" hour":" hours")+" ago";const x=new Date(t);if(d<6*864e5)return x.toLocaleDateString("en-US",{weekday:"long"})+" at "+x.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});return x.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})};
const fabs=()=>`<input id="rp" type="file" accept="image/*" capture="environment" hidden><button class="fab fab2" data-act="fabreceipt">📷 Split receipt</button><button class="fab" data-act="fab${"add"}">${ic("plus")} Add expense</button>`;
const tbtn=()=>{const d=document.documentElement.dataset.theme==="dark";return `<button data-act="theme" data-t="${d?"light":"dark"}" aria-label="Switch to ${d?"light":"dark"} mode">${ic(d?"sun":"moon")}</button>`};
let deferred=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const canInstall=()=>!standalone()&&(!!deferred||isIOS());
const instBtn=c=>canInstall()?`<button class="${c}" data-act="install" style="margin-top:14px">Install app</button>`:"";
const instRow=()=>canInstall()?`<button class="row" data-act="install"><span class="tile" style="background:var(--green);color:var(--on)">${ic("plus")}</span><span class="grow"><b>Install Split in Half</b><span class="sub">Add it to your home screen</span></span></button>`:"";
const ymd=t=>new Date(t-new Date(t).getTimezoneOffset()*6e4).toISOString().slice(0,10);
function newDraft(g){const sel={};g.memberIds.forEach(m=>sel[m]=true);return{desc:"",amount:"",payer:U.uid,mode:"equal",sel,vals:{},receipt:(()=>{const r=V.prc||null;V.prc=null;return r})(),cat:"Miscellaneous",date:ymd(Date.now()),note:"",eid:null}}
function editDraft(g,e){const sel={},vals={},v=Object.values(e.split),eq=v.length>0&&Math.max(...v)-Math.min(...v)<=1;
 g.memberIds.forEach(m=>{sel[m]=m in e.split;if(m in e.split)vals[m]=(e.split[m]/100).toFixed(2)});
 return{desc:e.desc,amount:(e.amount/100).toFixed(2),payer:e.payer,mode:eq?"equal":"exact",sel,vals,receipt:e.receipt||null,cat:e.cat||"Miscellaneous",date:ymd(e.t),note:e.note||"",eid:e.id}}
const CATS=[["Groceries","🛒"],["Food & Dining","🍽️"],["Rent","🏠"],["Utilities","💡"],["Transport","🚗"],["Shopping","🛍️"],["Entertainment","🎬"],["Travel","✈️"],["Health","💊"],["Miscellaneous","🧾"]];
const catIc=c=>(CATS.find(x=>x[0]===c)||["","🧾"])[1];
function pairBal(g,k){let b=0;(X[g.id]||[]).forEach(e=>{if(e.payer===U.uid)b+=e.split[k]||0;else if(e.payer===k)b-=e.split[U.uid]||0});return b}
function friendBal(){const b={},i={};const reg=(g,k)=>{if(!i[k])i[k]={n:nm(g,k),p:g.photos&&g.photos[k]}};
 groups.forEach(g=>{g.memberIds.forEach(k=>{if(k!==U.uid){reg(g,k);b[k]=b[k]||0}});
  (X[g.id]||[]).forEach(e=>{if(e.payer===U.uid){for(const k in e.split)if(k!==U.uid){reg(g,k);b[k]=(b[k]||0)+e.split[k]}}
   else if(e.split[U.uid]){reg(g,e.payer);b[e.payer]=(b[e.payer]||0)-e.split[U.uid]}})});
 return Object.keys(i).map(k=>({k,...i[k],v:b[k]||0})).sort((a,c)=>Math.abs(c.v)-Math.abs(a.v))}
const setTheme=t=>{document.documentElement.dataset.theme=t;try{localStorage.setItem("sih.theme",t)}catch(e){}const m=document.querySelector("meta[name=theme-color]");if(m)m.content=t==="dark"?"#0b0f0d":"#f2f5f2"};
setTheme(document.documentElement.dataset.theme||"dark");
function ask(msg){return new Promise(res=>{
 const o=document.createElement("div");o.className="scrim center";o.setAttribute("role","alertdialog");o.setAttribute("aria-modal","true");
 o.innerHTML=`<div class="dlg"><p>${esc(msg)}</p><div class="dbtn"><button class="btn line" data-k="0">Cancel</button><button class="btn org" data-k="1">${/^Leave/.test(msg)?"Leave":"Delete"}</button></div></div>`;
 const kd=e=>{if(e.key==="Escape"){e.stopPropagation();done(false)}};
 const done=v=>{o.remove();document.removeEventListener("keydown",kd,true);res(v)};
 o.addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(b)done(b.dataset.k==="1");else if(e.target===o)done(false)});
 document.addEventListener("keydown",kd,true);document.body.appendChild(o);o.querySelector("[data-k='0']").focus()})}
try{const j=new URLSearchParams(location.search).get("join");if(j){localStorage.setItem("halves.join",j);V.join=true;history.replaceState(null,"",location.pathname)}else V.join=!!localStorage.getItem("halves.join")}catch(e){}

function net(g){const n={};g.memberIds.forEach(m=>n[m]=0);
(X[g.id]||[]).forEach(e=>{n[e.payer]=(n[e.payer]||0)+e.amount;for(const k in e.split)n[k]=(n[k]||0)-e.split[k]});return n}
function debts(g){const n=net(g),cr=[],db=[];
for(const k in n){if(n[k]>0)cr.push([k,n[k]]);else if(n[k]<0)db.push([k,-n[k]])}
cr.sort((a,b)=>b[1]-a[1]);db.sort((a,b)=>b[1]-a[1]);const out=[];let i=0,j=0;
while(i<cr.length&&j<db.length){const a=Math.min(cr[i][1],db[j][1]);out.push({from:db[j][0],to:cr[i][0],amt:a});
cr[i][1]-=a;db[j][1]-=a;if(!cr[i][1])i++;if(!db[j][1])j++}return out}

onAuthStateChanged(auth,async u=>{
 if(!u){U=null;started=null;cleanup();V.ready=true;V.gid=null;V.sheet=null;V.draft=null;return render()}
 U={uid:u.uid,name:u.displayName||(u.email||"you").split("@")[0],email:(u.email||"").toLowerCase(),phone:"",photo:u.photoURL||""};
 if(!signing)await start();
});
function cleanup(){if(unG)unG();unG=null;Object.values(unsubs).forEach(f=>f());unsubs={};groups=[];X={}}
async function start(){
 if(started===U.uid)return;started=U.uid;
 const profP=(async()=>{try{const s=await getDoc(doc(db,"sih_users",U.uid));
  if(s.exists()){const d=s.data();U.name=d.name||U.name;U.phone=d.phone||"";U.photo=d.photo||U.photo}
  else await setDoc(doc(db,"sih_users",U.uid),userDoc())}catch(e){console.error(e)}render()})();
 unG=onSnapshot(query(collection(db,"sih_groups"),where("memberIds","array-contains",U.uid)),snap=>{
  groups=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.t||0)-(a.t||0));
  groups.forEach(g=>{if(g.direct){const o=g.memberIds.find(m=>m!==U.uid);if(o){g.name=nm(g,o);g.photo=(g.photos&&g.photos[o])||""}}});
  groups.forEach(g=>{if(!unsubs[g.id])unsubs[g.id]=onSnapshot(collection(db,"sih_groups",g.id,"expenses"),s=>{X[g.id]=s.docs.map(d=>({id:d.id,...d.data()}));render()})});
  for(const id in unsubs)if(!groups.find(g=>g.id===id)){unsubs[id]();delete unsubs[id];delete X[id]}
  V.ready=true;render()},e=>toast(errMsg(e)));
 await profP;
 let id=null;try{id=localStorage.getItem("halves.join");localStorage.removeItem("halves.join")}catch(e){}
 V.join=false;
 if(id)try{await updateDoc(doc(db,"sih_groups",id),{memberIds:arrayUnion(U.uid),...prof()});V.gid=id;V.tab="groups";toast("You joined the group")}catch(e){toast("That invite link is not valid.")}
}
async function addPerson(raw){
 raw=raw.trim();if(!raw)return"empty";const g=gcur(),isE=raw.includes("@");
 const f=await getDocs(query(collection(db,"sih_users"),where(isE?"email":"phone","==",isE?raw.toLowerCase():normPhone(raw))));
 if(f.empty)return"none";const u=f.docs[0],d=u.data();if(g.memberIds.includes(u.id))return"already";
 await updateDoc(doc(db,"sih_groups",g.id),{memberIds:arrayUnion(u.id),["members."+u.id]:d.name,["photos."+u.id]:d.photo||"",["phones."+u.id]:d.phone||""});return"added"}
async function directGroup(k){
 let g=groups.find(x=>x.direct&&x.memberIds.includes(k));if(g)return g;
 const sn=await getDoc(doc(db,"sih_users",k)),d=sn.exists()?sn.data():{},id="dm_"+[U.uid,k].sort().join("_");
 await setDoc(doc(db,"sih_groups",id),{name:"Direct",direct:true,createdBy:U.uid,memberIds:[U.uid,k],t:Date.now(),members:{[U.uid]:U.name,[k]:d.name||"Friend"},photos:{[U.uid]:U.photo||"",[k]:d.photo||""},phones:{[U.uid]:U.phone||"",[k]:d.phone||""}},{merge:true});
 for(let i=0;i<50&&!groups.find(x=>x.id===id);i++)await new Promise(r=>setTimeout(r,60));
 return groups.find(x=>x.id===id)||null}
async function shareApp(){const url=location.origin+location.pathname;try{if(navigator.share)await navigator.share({title:"Split in Half",url});else{await navigator.clipboard.writeText(url);toast("App link copied")}}catch(e){}}
async function share(){const g=gcur(),url=location.origin+location.pathname+"?join="+g.id;
 try{if(navigator.share)await navigator.share({title:"Join "+g.name+" on Split in Half",url});else{await navigator.clipboard.writeText(url);toast("Invite link copied")}}catch(e){}}
async function saveProfile(){
 await setDoc(doc(db,"sih_users",U.uid),userDoc(),{merge:true});
 try{await updateProfile(auth.currentUser,{displayName:U.name})}catch(e){}
 for(const g of groups)try{await updateDoc(doc(db,"sih_groups",g.id),prof())}catch(e){}
}
async function shrink(file,max=800,q=.55){const bm=await createImageBitmap(file),s=Math.min(1,max/Math.max(bm.width,bm.height)),c=document.createElement("canvas");
 c.width=Math.round(bm.width*s);c.height=Math.round(bm.height*s);c.getContext("2d").drawImage(bm,0,0,c.width,c.height);return c.toDataURL("image/jpeg",q)}

function lockPage(on){
 const r=document.documentElement,b=document.body;
 if(on&&lockY===null){lockY=window.scrollY||0;b.style.top=-lockY+"px";r.classList.add("lock")}
 else if(!on&&lockY!==null){const y=lockY;lockY=null;r.classList.remove("lock");b.style.top="";window.scrollTo(0,y)}
}
function fitView(){
 const v=window.visualViewport,r=document.documentElement;if(!v)return;
 r.style.setProperty("--vvh",v.height+"px");r.style.setProperty("--vvx",v.offsetLeft+"px");r.style.setProperty("--vvy",v.offsetTop+"px");
 r.classList.toggle("kb",window.innerHeight-v.height-v.offsetTop>100);
}
function centerCat(c,smooth){const on=c.querySelector(".on");if(!on)return;c.scrollTo({left:Math.max(0,on.offsetLeft-(c.clientWidth-on.offsetWidth)/2),behavior:smooth?"smooth":"auto"})}
const mctx=document.createElement("canvas").getContext("2d");
function sizeAmt(el){
 const cs=getComputedStyle(el);mctx.font=cs.fontWeight+" "+cs.fontSize+" "+cs.fontFamily;
 try{mctx.letterSpacing=cs.letterSpacing}catch(e){}
 el.style.width=Math.ceil(mctx.measureText(el.value||el.placeholder).width+3)+"px";
}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{const e=document.getElementById("ea");if(e)sizeAmt(e)});
let rq=0;function render(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;doRender()})}
function doRender(){
 let h;
 if(!V.ready)h=`<div class="splash"><svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#0b0f0d"/><path d="M256 112a144 144 0 0 0 0 288z" fill="#22c55e"/><path d="M256 112a144 144 0 0 1 0 288z" fill="#f4f4f4"/></svg></div>`;
 else if(!U)h=authView();
 else if(inGroup())h=groupPage();
 else h=V.tab==="friends"?friendsTab():V.tab==="activity"?activityTab():V.tab==="account"?accountTab():groupsTab();
 const tabs=U&&!inGroup()?`<nav class="tabs"><div>${[["groups","groups","Groups"],["friends","friends","Friends"],["activity","activity","Activity"],["account","account","Account"]].map(([k,i,l])=>`<button data-act="tab" data-t="${k}" class="${V.tab===k?"on":""}">${ic(i)}${l}</button>`).join("")}</div></nav>`:"";
 const app=$("app"),ae=document.activeElement,fid=ae&&ae.id&&app.contains(ae)?ae.id:null,ss=fid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null,keep={},st=(app.querySelector(".xp")||app.querySelector(".sheet")||{}).scrollTop||0;
 app.querySelectorAll("input[id],select[id]").forEach(i=>{if(!/file|checkbox/.test(i.type))keep[i.id]=i.value});
 const xc=app.querySelector(".xp-cats"),xs=xc?xc.scrollLeft:null;
 app.innerHTML=h+tabs+(V.sheet?sheet():"")+(V.toast?`<div class="toast" role="status">${esc(V.toast)}</div>`:"");
 for(const id in keep){const el=$(id);if(el&&el.value!==keep[id])el.value=keep[id]}
 const sh=app.querySelector(".xp")||app.querySelector(".sheet");if(sh)sh.scrollTop=st;
 const nc=app.querySelector(".xp-cats");if(nc){if(xs!=null)nc.scrollLeft=xs;else centerCat(nc,false)}
 const ea0=$("ea");if(ea0)sizeAmt(ea0);
 lockPage(!!app.querySelector(".xp"));fitView();
 if(fid){const el=$(fid);if(el){el.focus({preventScroll:true});if(ss)try{el.setSelectionRange(ss[0],ss[1])}catch(e){}}}
 if(V.sheet==="expense")hint();
}
function toast(t){document.querySelectorAll(".toast").forEach(x=>x.remove());const d=document.createElement("div");d.className="toast";d.setAttribute("role","status");d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function keepAuth(){if($("an"))V.sn=$("an").value;if($("aph"))V.sp=$("aph").value;if($("ae"))V.email=$("ae").value}

function authView(){const s=V.mode==="signup";
return `<div class="auth"><div class="brand"><svg class="logo" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#0b0f0d"/><path d="M256 112a144 144 0 0 0 0 288z" fill="#22c55e"/><path d="M256 112a144 144 0 0 1 0 288z" fill="#f4f4f4"/></svg><div><h1>Split in Half</h1><div class="by">Made by Kedar</div></div></div>
<p class="lead">${V.join?"You were invited to a group. Create your profile to join.":"Share bills with friends and always know who owes what."}</p>
${instBtn("btn")}<button class="btn line gbtn" data-act="google" style="margin-top:12px"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>Continue with Google</button>
<div class="or">or use email</div>
<form id="af">${s?`<div style="text-align:center;margin-top:14px"><label for="sp" style="cursor:pointer">${avU(V.sn||"+",V.sphoto,"x","lg")}</label><input id="sp" type="file" accept="image/*" hidden><div class="sub">Add a photo (optional)</div></div>
<label class="f" for="an">Your name</label><input class="in" id="an" value="${esc(V.sn)}" autocomplete="name" required>
<label class="f" for="aph">Phone number with country code (optional)</label><input class="in" id="aph" inputmode="tel" value="${esc(V.sp)}" autocomplete="tel">`:""}
<label class="f" for="ae">Email</label><input class="in" id="ae" type="email" autocomplete="email" value="${esc(V.email)}" required>
<label class="f" for="ap">Password</label><input class="in" id="ap" type="password" minlength="6" autocomplete="${s?"new-password":"current-password"}" required>
${V.err?`<p class="neg err" role="alert">${esc(V.err)}</p>`:""}
<p style="margin:22px 0 0"><button class="btn" type="submit">${s?"Create account":"Log in"}</button></p></form>
<p style="text-align:center;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px"><button class="chip" data-act="authmode">${s?"I already have an account":"Create an account"}</button>${s?"":`<button class="chip" data-act="reset">Forgot password</button>`}</p></div>`}

const hero=(top,tot)=>`<div class="hero ${tot>0?"is-pos":tot<0?"is-neg":""}">${top?`<div class="hi">${top}</div>`:""}<div class="big ${tot>0?"pos":tot<0?"neg":""}">${fmt(tot)}</div><div class="cap">${tot===0?`<span class="chk" aria-hidden="true">✓</span>You are all settled up`:tot>0?"Overall, you are owed":"Overall, you owe"}</div></div>`;
function groupsTab(){
 let pos=0,owe=0;
 groups.filter(g=>g.direct).forEach(g=>{const n=net(g)[U.uid]||0;if(n>0)pos+=n;else owe-=n});
 const all=groups.filter(g=>!g.direct).map(g=>{const n=net(g)[U.uid]||0;if(n>0)pos+=n;else owe-=n;return{g,n,ds:debts(g).filter(d=>d.from===U.uid||d.to===U.uid)}});
 const card=({g,n,ds})=>{const m=ds.slice(0,3).map(d=>d.from===U.uid?`<span class="tl neg">You owe ${esc(nm(g,d.to))} ${fmt(d.amt)}</span>`:`<span class="tl pos">${esc(nm(g,d.from))} owes you ${fmt(d.amt)}</span>`).join("")+(ds.length>3?`<span class="tl">Plus ${ds.length-3} more balances</span>`:"");
  return `<button class="row top" data-act="open" data-id="${g.id}">${tile(g)}<span class="grow"><b class="gt">${esc(g.name)}</b>${m?`<span class="tree">${m}</span>`:`<span class="sub">settled up</span>`}</span>${n?`<span class="amt ${n>0?"pos":"neg"}"><small>${n>0?"you are owed":"you owe"}</small>${fmt(n)}</span>`:""}</button>`};
 const empty=g=>{const ex=X[g.id];return!ex||!ex.length},busy=x=>x.n||x.ds.length||empty(x.g);
 const live=all.filter(busy),done=all.filter(x=>!busy(x));
 const sh=V.showSettled!==false,rows=live.map(card).join("")+(sh?done.map(card).join(""):"")+(done.length&&(!sh||done.length>=4)?`<button class="btn line sbtn" data-act="settledtoggle" style="margin-top:6px">${sh?"Hide":"Show"} ${done.length} settled-up group${done.length===1?"":"s"}</button>`:"");
 const h=new Date().getHours(),gr=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
 return `<div class="bar"><h1>Split in Half<small>Made by Kedar</small></h1>${tbtn()}<button data-act="newgroup" aria-label="Create group">${ic("plus")}</button></div>
 ${hero(`${gr}, ${esc((U.name||"").split(" ")[0])}`,pos-owe,pos,owe)}
 ${instRow()}<div class="mh">Your groups</div>${rows||`<div class="empty">No groups yet. Create one to start splitting.</div>`}
 <div style="padding:10px 16px"><button class="btn line" data-act="newgroup">Start a new group</button></div>
 ${groups.length?`${fabs()}`:""}`}

function friendsTab(){
 const f=friendBal(),tot=f.reduce((a,x)=>a+x.v,0);
 const rows=f.map(x=>`<button class="row" data-act="friend" data-k="${x.k}">${avU(x.n,x.p,x.k)}<span class="grow"><b>${esc(x.n)}</b></span><span class="amt ${x.v>0?"pos":"neg"}">${x.v?`<small>${x.v>0?"owes you":"you owe"}</small>${fmt(x.v)}`:`<small class="sub">settled up</small>`}</span></button>`).join("");
 return `<div class="bar"><h1>Friends</h1>${tbtn()}<button data-act="addfriend" aria-label="Add a friend">${ic("userplus")}</button></div>${hero("Your friends",tot)}<div class="mh">People</div>${rows||`<div class="empty">People from your groups show up here. Tap the add-person button to add a friend.</div>`}${f.length?`${fabs()}`:""}`}

function groupPage(){
 const g=gcur(),n=net(g)[U.uid]||0,ds=debts(g),list=[...(X[g.id]||[])].sort((a,b)=>b.t-a.t);
 const dl=ds.map(d=>`<div class="row">${av(g,d.from)}<span class="grow">${d.from===U.uid?"You owe":esc(nm(g,d.from))+" owes"} <b style="display:inline">${d.to===U.uid?"you":esc(nm(g,d.to))}</b></span><span class="amt ${d.from===U.uid?"neg":d.to===U.uid?"pos":""}">${fmt(d.amt)}</span></div>`).join("");
 const q=(V.q||"").trim().toLowerCase(),shown=q?list.filter(e=>(title(g,e)+" "+(e.cat||"")+" "+nm(g,e.payer)).toLowerCase().includes(q)):list,spent=list.reduce((a,e)=>a+(e.kind==="payment"?0:e.amount),0);
 let last="";
 const ex=shown.map(e=>{const m=mon(e.t);let h="";if(m!==last){h=`<div class="mh">${m}</div>`;last=m}
  const mine=(e.payer===U.uid?e.amount:0)-(e.split[U.uid]||0),dt=new Date(e.t);
  return h+`<button class="row" data-act="detail" data-gid="${g.id}" data-id="${e.id}"><span class="d"><small>${dt.toLocaleString("en-US",{month:"short"})}</small>${dt.getDate()}</span><span class="ctile">${e.kind==="payment"?"💸":catIc(e.cat||"Miscellaneous")}</span><span class="grow"><b>${esc(title(g,e))}</b><span class="sub">${e.kind!=="payment"&&e.cat?catIc(e.cat)+" "+esc(e.cat)+" · ":""}${esc(nm(g,e.payer))} paid ${fmt(e.amount)}${e.receipt?" · receipt":""}</span></span>
  <span class="amt ${mine>0?"pos":"neg"}">${mine?`<small>${mine>0?"you lent":"you borrowed"}</small>${fmt(mine)}`:`<small class="sub">not involved</small>`}</span></button>`}).join("");
 const mem=g.memberIds.map(m=>{const me=m===U.uid;return `${me?'<div class="row">':`<button class="row" data-act="friend" data-k="${m}">`}${av(g,m)}<span class="grow"><b>${esc(nm(g,m))}${m===U.uid?" (you)":""}</b><span class="sub">${esc((g.phones&&g.phones[m])||"No phone number")}</span></span>${me?"</div>":"</button>"}`}).join("");
 return `<div class="bar"><button data-act="back" aria-label="Back">${ic("back")}</button><h1></h1><button data-act="share" aria-label="Share invite link">${ic("share")}</button><button data-act="addmember" aria-label="Add people">${ic("userplus")}</button></div>
 <div class="banner"></div><div class="gh2"><label for="gp" class="gav" style="cursor:pointer" aria-label="Change group photo">${tile(g,"lg")}</label><input id="gp" type="file" accept="image/*" hidden><h2 class="gname">${esc(g.name)}</h2><div class="${n>0?"pos":n<0?"neg":"sub"} gbal">${n===0?"You are settled up":n>0?`You are owed ${fmt(n)}`:`You owe ${fmt(n)}`}</div><div class="sub">${g.memberIds.length} ${g.memberIds.length===1?"person":"people"}${spent?` · ${fmt(spent)} spent`:""}${g.photo?` · <button class="lnk" data-act="rmgphoto">Remove photo</button>`:""}</div></div>
 <div class="pills"><button class="pill on" data-act="newexp">Add expense</button><button class="pill" data-act="settleopen">Settle up</button><button class="pill" data-act="addmember">Invite</button></div>
 ${dl?`<div class="mh">Balances</div>${dl}`:""}
 <div class="mh">Expenses</div>${list.length>4?`<div style="padding:0 16px 6px"><input class="in" id="xq" type="search" placeholder="Search expenses" value="${esc(V.q||"")}" autocomplete="off" aria-label="Search expenses" style="margin:0"></div>`:""}${ex||`<div class="empty">${q?"No matches.":"No expenses yet. Tap Add expense."}</div>`}
 <div class="mh">Members</div>${mem}
 <div style="padding:16px;display:grid;gap:10px"><button class="btn line" data-act="addmember">Add people</button><button class="btn line" data-act="leave" style="color:var(--orange);border-color:var(--orange)">Leave group</button>${g.createdBy===U.uid?`<button class="btn line" data-act="delgroup" style="color:var(--orange);border-color:var(--orange)">Delete group</button>`:""}</div>`}

function activityTab(){
 const all=[];groups.forEach(g=>(X[g.id]||[]).forEach(e=>all.push({g,e})));all.sort((x,y)=>y.e.t-x.e.t);
 const rows=all.slice(0,60).map(({g,e})=>{const pay=e.kind==="payment",mine=(e.payer===U.uid?e.amount:0)-(e.split[U.uid]||0),by=e.payer===U.uid?"You":esc(nm(g,e.payer));
  const to=pay?Object.keys(e.split)[0]:"",txt=pay?`<b>${by}</b> paid <b>${to===U.uid?"you":esc(nm(g,to))}</b>.`:`<b>${by}</b> added “<b>${esc(e.desc)}</b>”${g.direct?"":` in “<b>${esc(g.name)}</b>”`}.`;
  const mu=`<span class="sub" style="font:inherit">You are not involved</span>`;
  const ln=pay?(e.payer===U.uid?`<span class="sub" style="font:inherit">You paid ${fmt(e.amount)}</span>`:to===U.uid?`<span class="pos">You received ${fmt(e.amount)}</span>`:mu):mine<0?`<span class="neg">You owe ${fmt(mine)}</span>`:mine>0?`<span class="pos">You get back ${fmt(mine)}</span>`:mu;
  return `<button class="ac ${Date.now()-e.t<864e5?"new":""}" data-act="detail" data-gid="${g.id}" data-id="${e.id}"><span class="aic"><span class="ctile">${pay?"💸":catIc(e.cat||"Miscellaneous")}</span><span class="abg">${av(g,e.payer)}</span></span><span class="acx"><span class="at">${txt}</span><span class="ao" style="display:block">${ln}</span><span class="sub">${ago(e.t)}</span></span></button>`}).join("");
 return `<div class="bar"><h1>Recent activity</h1>${tbtn()}</div>${rows||`<div class="empty">Nothing yet. Add an expense in a group.</div>`}${groups.length?fabs():""}`}

function accountTab(){return `<div class="bar"><h1>Account</h1>${tbtn()}</div>
<div style="padding:24px 16px 8px;text-align:center"><label for="pf" style="cursor:pointer">${avU(U.name,U.photo,U.uid,"lg")}</label><input id="pf" type="file" accept="image/*" hidden><p class="sub">Tap the photo to change it</p></div>
<div style="padding:0 16px"><label class="f" for="pn">Name</label><input class="in" id="pn" value="${esc(U.name)}">
<label class="f" for="pp">Phone number with country code</label><input class="in" id="pp" inputmode="tel" value="${esc(U.phone||"")}">
<label class="f">Email</label><p style="margin:8px 0">${esc(U.email)}</p>
${instBtn("btn line")}<label class="f">Theme</label><div class="chips"><button class="chip ${document.documentElement.dataset.theme==="light"?"on":""}" data-act="theme" data-t="light">Light</button><button class="chip ${document.documentElement.dataset.theme==="dark"?"on":""}" data-act="theme" data-t="dark">Dark</button></div><p><button class="btn" data-act="saveprofile">Save profile</button></p><p><button class="btn line" data-act="logout">Log out</button></p><p class="credit">Designed &amp; made by Kedar</p></div>`}

const wrap=h=>`<div class="scrim" data-act="close"><div class="sheet" role="dialog" aria-modal="true"><button class="xbtn" data-act="close" aria-label="Close">✕</button>${h}</div></div>`;
function sheet(){
 if(V.sheet==="group")return wrap(`<h3>Group name</h3><input class="in" id="gn" autocomplete="off"><p style="margin-top:20px"><button class="btn" data-act="savegroup">Create group</button></p>`);
 if(V.sheet==="member")return wrap(`<h3>Add people</h3><label class="f" for="mn">Email or phone number (with country code)</label><input class="in" id="mn" autocomplete="off"><p style="margin-top:20px"><button class="btn" data-act="savemember">Add to group</button></p>
 <p class="sub" style="text-align:center;margin:18px 0 8px">Not on Split in Half yet? Send them the invite link. They create a profile and join.</p><button class="btn line" data-act="share">Share invite link</button>`);
 if(V.sheet==="addfriend")return wrap(`<h3>Add a friend</h3><p class="sub" style="margin:4px 0 0">Split with someone outside of any group.</p><label class="f" for="fn">Email or phone number (with country code)</label><input class="in" id="fn" autocomplete="off"><p style="margin-top:20px"><button class="btn" data-act="savefriend">Add friend</button></p><p class="sub" style="text-align:center;margin:18px 0 8px">Not on Split in Half yet? Send them the app link.</p><button class="btn line" data-act="shareapp">Share app link</button>`);
 if(V.sheet==="ios")return wrap(`<h3>Install on iPhone</h3><p class="sub" style="margin:8px 0 14px">Apple only allows adding apps to the home screen from the Share menu. It takes about 10 seconds:</p>
 <ol style="padding-left:20px;line-height:2;margin:0 0 16px"><li>Tap the <b>Share</b> button <span style="display:inline-block;vertical-align:middle">${ic("share")}</span> in Safari (in Chrome for iPhone it sits next to the address bar)</li><li>Scroll down and tap <b>Add to Home Screen</b></li><li>Tap <b>Add</b></li></ol><button class="btn" data-act="close">Got it</button>`);
 if(V.sheet==="pick"){const gs=groups.filter(g=>!g.direct),fr=friendBal(),rw='style="padding-left:0;padding-right:0"';
  return wrap(`<h3>Add expense</h3>${gs.length?`<div class="mh">With a group</div>`+gs.map(g=>`<button class="row" ${rw} data-act="pickg" data-id="${g.id}">${tile(g)}<span class="grow"><b>${esc(g.name)}</b></span></button>`).join(""):""}${fr.length?`<div class="mh">With a friend, outside any group</div>`+fr.map(x=>`<button class="row" ${rw} data-act="pickf" data-k="${x.k}">${avU(x.n,x.p,x.k)}<span class="grow"><b>${esc(x.n)}</b></span></button>`).join(""):""}`)}
 if(V.sheet==="settle"){const g=gcur(),ds=debts(g).filter(d=>d.from===U.uid||d.to===U.uid);
  return wrap(`<h3>Settle up</h3>${ds.length?ds.map(d=>`<div class="row" style="padding-left:0;padding-right:0;flex-wrap:wrap">${av(g,d.from===U.uid?d.to:d.from)}<span class="grow">${d.from===U.uid?`You owe <b style="display:inline">${esc(nm(g,d.to))}</b>`:`<b style="display:inline">${esc(nm(g,d.from))}</b> owes you`}</span><span class="amt ${d.from===U.uid?"neg":"pos"}">${fmt(d.amt)}</span><div style="display:flex;gap:8px;width:100%;align-items:center"><input class="in" inputmode="decimal" value="${(d.amt/100).toFixed(2)}" aria-label="Amount to record" style="flex:1;text-align:right"><button class="chip on" data-act="settle" data-from="${d.from}" data-to="${d.to}" data-amt="${d.amt}">Record payment</button></div></div>`).join(""):`<div class="empty">You are all settled up.</div>`}`)}
 if(V.sheet==="friend"){const f=friendBal().find(x=>x.k===V.fid);
  if(!f)return wrap(`<h3>Friend</h3><div class="empty">Nothing shared with this person yet.</div><button class="btn line" data-act="close">Close</button>`);
  const per=groups.filter(g=>!g.direct).map(g=>({g,v:pairBal(g,f.k)})).filter(p=>p.v||p.g.memberIds.includes(f.k));
  const dg=groups.find(g=>g.direct&&g.memberIds.includes(f.k)),dv=dg?pairBal(dg,f.k):0,dr=dg?`<div class="row" style="padding-left:0;padding-right:0"><span class="tile" style="background:var(--surf2);color:var(--mute)">${ic("friends")}</span><span class="grow"><b>Outside groups</b></span><span class="amt ${dv>0?"pos":dv<0?"neg":""}">${dv?`<small>${dv>0?"owes you":"you owe"}</small>${fmt(dv)}`:`<small class="sub">settled up</small>`}</span></div>`:"";
  const ex=[];groups.forEach(g=>(X[g.id]||[]).forEach(e=>{let m=0;if(e.payer===U.uid)m=e.split[f.k]||0;else if(e.payer===f.k)m=-(e.split[U.uid]||0);if(m)ex.push({g,e,m})}));
  ex.sort((a,b)=>b.e.t-a.e.t);
  const pr=per.map(p=>`<button class="row" style="padding-left:0;padding-right:0" data-act="open" data-id="${p.g.id}">${tile(p.g)}<span class="grow"><b>${esc(p.g.name)}</b></span><span class="amt ${p.v>0?"pos":p.v<0?"neg":""}">${p.v?`<small>${p.v>0?"owes you":"you owe"}</small>${fmt(p.v)}`:`<small class="sub">settled up</small>`}</span></button>`).join("");
  const er=ex.slice(0,15).map(({g,e,m})=>{const dt=new Date(e.t),pay=e.kind==="payment";return `<button class="row" style="padding-left:0;padding-right:0" data-act="detail" data-gid="${g.id}" data-id="${e.id}"><span class="d"><small>${dt.toLocaleString("en-US",{month:"short"})}</small>${dt.getDate()}</span><span class="grow"><b>${pay?"💸 ":""}${esc(title(g,e))}</b><span class="sub">${!pay&&e.cat?catIc(e.cat)+" "+esc(e.cat)+" · ":""}${esc(g.name)}</span></span><span class="amt ${m>0?"pos":"neg"}"><small>${pay?(m>0?"you paid":"they paid"):(m>0?"owes you":"you owe")}</small>${fmt(m)}</span></button>`}).join("");
  const bal=f.v===0?"You are settled up":f.v>0?`You are owed <b>${fmt(f.v)}</b> overall`:`You owe <b>${fmt(f.v)}</b> overall`;
  const lines=[...(dv?[[dv,"non-group expenses"]]:[]),...per.filter(p=>p.v).map(p=>[p.v,"“"+p.g.name+"”"])].map(([v,w])=>`<div>${v>0?`${esc(f.n)} owes you <b class="pos">${fmt(v)}</b>`:`You owe ${esc(f.n)} <b class="neg">${fmt(v)}</b>`} in ${esc(w)}</div>`).join("");
  const settle=f.v?`<label class="f" for="fa">${f.v>0?"How much did "+esc(f.n)+" pay you?":"How much did you pay "+esc(f.n)+"?"}</label><input class="in amtin" id="fa" inputmode="decimal" value="${esc(V.famt!=null?V.famt:(Math.abs(f.v)/100).toFixed(2))}"><div class="chips"><button class="chip" data-act="ffull">Full ${fmt(f.v)}</button><button class="chip" data-act="fhalf">Half</button></div><button class="btn" data-act="fsettle">${f.v>0?"Record payment received":"Record payment made"}</button>`:"";
  return wrap(`<div style="text-align:center">${avU(f.n,f.p,f.k,"lg")}<h3 style="margin:10px 0 2px">${esc(f.n)}</h3><button class="fowe ${f.v>0?"pos":f.v<0?"neg":"sub"}" data-act="fexp"><span>${bal}</span>${lines?`<span class="chev ${V.fopen?"up":""}"></span>`:""}</button>${V.fopen&&lines?`<div class="fbrk" style="text-align:left">${lines}</div>`:""}</div><div class="pills" style="padding-left:0"><button class="pill on" data-act="pickf" data-k="${f.k}">Add expense</button><button class="pill" data-act="fsettlefocus">Settle up</button></div>${settle}<div class="mh" style="margin:18px -20px 0">Groups together</div>${pr+dr||`<div class="empty">No shared groups.</div>`}<div class="mh" style="margin:0 -18px">Recent activity</div>${er||`<div class="empty">No expenses together yet.</div>`}<p style="margin-top:16px"><button class="btn line" data-act="close">Close</button></p>`)}
 if(V.sheet==="receipt"){const e=(X[V.gid]||[]).find(x=>x.id===V.rid);return wrap(`<h3>Receipt</h3>${e&&e.receipt?`<img src="${e.receipt}" alt="Receipt" style="width:100%;border-radius:8px">`:"Not found."}`)}
 if(V.sheet==="detail"){const g=groups.find(x=>x.id===V.dgid),e=g&&(X[g.id]||[]).find(x=>x.id===V.did);
  if(!e)return wrap(`<h3>Expense</h3><div class="empty">This expense no longer exists.</div><button class="btn line" data-act="close">Close</button>`);
  const cat=e.cat||"Miscellaneous",who=u=>u===U.uid?"You":nm(g,u),ex=X[g.id]||[],t0=new Date(e.t);
  const tree=Object.keys(e.split).filter(k=>e.split[k]).map(k=>`<div class="ptr">${av(g,k)}<span>${k===U.uid?"You owe":esc(nm(g,k))+" owes"} ${fmt(e.split[k])}</span></div>`).join("");
  const ms=[2,1,0].map(i=>new Date(t0.getFullYear(),t0.getMonth()-i,1)),sums=ms.map(m=>ex.filter(x=>x.kind!=="payment"&&(x.cat||"Miscellaneous")===cat&&new Date(x.t).getFullYear()===m.getFullYear()&&new Date(x.t).getMonth()===m.getMonth()).reduce((s,x)=>s+x.amount,0)),mx=Math.max(...sums,1);
  const bars=ms.map((m,i)=>`<div class="tr"><span>${m.toLocaleString("en-US",{month:"short"})}</span><span class="tb"><i style="width:${Math.max(2,Math.round(sums[i]/mx*100))}%"></i></span><span class="tv">${fmt(sums[i])}</span></div>`).join("");
  const cms=V.cerr?`<div class="hint">Comments are not available right now. We are working on it and it will be fixed in the next update.</div>`:(V.comments||[]).map(c=>`<div class="cm">${avU(c.name||"?",(g.photos&&g.photos[c.by])||"",c.by||"x")}<div class="cb"><b>${esc(c.by===U.uid?"You":c.name||"Member")}</b> <span class="sub" style="display:inline">${ago(c.t)}</span>${c.by===U.uid?`<button class="lnk" data-act="cdel" data-id="${c.id}" style="font-size:13px;margin-left:8px">Delete</button>`:""}<div>${esc(c.text)}</div></div></div>`).join("");
  return `<div class="xp" role="dialog" aria-modal="true"><div class="xp-in">
 <div class="xp-top dtop"><button class="xbtn" data-act="close" aria-label="Back">${ic("back")}</button><h3>Details</h3><span style="display:flex;gap:8px"><button class="xbtn" data-act="ddel" aria-label="Delete expense">🗑</button><button class="xbtn" data-act="dedit" aria-label="Edit expense">✎</button></span></div>
 <div class="dh"><span class="ctile">${catIc(cat)}</span><div style="min-width:0"><h2>${esc(e.desc)}</h2><div class="big">${fmt(e.amount)}</div><span class="gchip">${tile(g)}${esc(g.direct?"Non-group":g.name)}</span></div></div>
 <p class="sub" style="margin:0">Added by ${esc(who(e.by||e.payer))} on ${t0.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}${e.note?`<br>Note: ${esc(e.note)}`:""}</p>
 ${e.receipt?`<img src="${e.receipt}" alt="Receipt" style="width:100%;border-radius:12px;margin-top:14px">`:""}
 <div class="dsec"><div class="pay">${av(g,e.payer)}<span>${esc(who(e.payer))} paid ${fmt(e.amount)}</span></div><div class="ptree">${tree}</div></div>
 <div class="dsec"><div class="mhh">Spending trends for ${esc(g.direct?"non-group expenses":g.name)} · ${esc(cat)}</div>${bars}</div>
 <div class="dsec"><div class="mhh">Comments</div>${cms||`<div class="sub">No comments yet.</div>`}</div>
 ${V.cerr?"":`<div class="cin"><input class="in" id="cm" placeholder="Add a comment…" autocomplete="off" enterkeyhint="send"><button class="btn csend" data-act="csend" aria-label="Send comment">➤</button></div>`}
 </div></div>`}
 const g=gcur(),d=V.draft;
 const modes=[["equal","Equally"],["exact","Exact"],["pct","Percent"]];
 const rows=g.memberIds.map(m=>`<div class="pr"><input type="checkbox" id="c-${m}" data-act="tick" data-m="${m}" ${d.sel[m]?"checked":""}>
 <label for="c-${m}">${av(g,m)} ${esc(nm(g,m))}</label>
 ${d.mode!=="equal"?`<input class="in" inputmode="decimal" enterkeyhint="done" data-act="val" data-m="${m}" value="${esc(d.vals[m]||"")}" aria-label="${esc(nm(g,m))} share"><span class="sub">${d.mode==="pct"?"%":"$"}</span>`:`<span class="sub" data-eq="${m}"></span>`}</div>`).join("");
 return `<div class="xp" role="dialog" aria-modal="true"><div class="xp-in">
 <div class="xp-top"><button class="xbtn" data-act="close" aria-label="Close">✕</button><h3>${d.eid?"Edit expense":"New expense"}</h3></div>
 <div class="xp-amt"><span class="who">${g.direct?`${avU(g.name,g.photo,g.id)}With ${esc(g.name)}`:`In ${esc(g.name)}`}</span>
 <div class="xp-money"><span>$</span><input id="ea" inputmode="decimal" enterkeyhint="next" placeholder="0.00" value="${esc(d.amount)}" autocomplete="off" aria-label="Amount"></div>
 <input class="xp-desc" id="ed" enterkeyhint="done" autocapitalize="sentences" placeholder="What was it for?" value="${esc(d.desc)}" autocomplete="off" aria-label="Description"></div>
 <div class="xp-cats">${CATS.map(([k,i])=>`<button class="xp-cat ${d.cat===k?"on":""}" data-act="cat" data-k="${k}"><i>${i}</i>${({"Food & Dining":"Food",Entertainment:"Fun",Miscellaneous:"Other"})[k]||k}</button>`).join("")}</div>
 <div class="xp-card"><div class="xp-who"><b id="pl">Paid by</b><div class="paychips" role="radiogroup" aria-labelledby="pl">${g.memberIds.map(m=>`<button type="button" class="paychip ${d.payer===m?"on":""}" role="radio" aria-checked="${d.payer===m}" data-act="payer" data-m="${m}">${av(g,m)}<span>${esc(m===U.uid?"You":nm(g,m))}</span></button>`).join("")}</div><input type="hidden" id="ep" value="${esc(d.payer)}"></div><div class="xp-row"><label for="edt">Date</label><input id="edt" type="date" value="${d.date}"></div></div>
 <div class="xp-h">Split</div><div class="xp-card"><div style="padding:12px 12px 4px"><div class="seg">${modes.map(([k,l])=>`<button class="${d.mode===k?"on":""}" data-act="mode" data-k="${k}">${l}</button>`).join("")}</div></div><div class="plist">${rows}</div></div><div class="hint" id="hint" role="status"></div>
 <div class="xp-h">Extras</div><div class="xp-card"><div class="xp-row"><b>Receipt</b>${d.receipt?`<span style="display:flex;gap:10px;align-items:center"><img src="${d.receipt}" alt="Receipt" style="height:40px;border-radius:8px"><button class="chip" data-act="rmreceipt">Remove</button></span>`:`<label class="chip" for="er" style="cursor:pointer">📷 Attach</label>`}</div><div class="xp-row"><label for="en">Note</label><input class="xp-note" id="en" placeholder="Optional" value="${esc(d.note)}" autocomplete="off"></div></div>
 <input id="er" type="file" accept="image/*" hidden>
 ${d.eid?`<button class="btn line" data-act="delexp" style="margin-top:22px;color:var(--owe);border-color:var(--owe)">Delete expense</button>`:""}
 <div class="xp-foot"><button class="btn" data-act="saveexp">${d.eid?"Save changes":"Save expense"}</button></div>
 </div></div>`;
}
function hint(){
 const d=V.draft,g=gcur(),el=$("hint");if(!el||!d)return;
 const tot=cents(d.amount),names=g.memberIds.filter(m=>d.sel[m]);let msg,st="";
 if(d.mode==="equal"){const b=Math.floor(tot/(names.length||1));
  document.querySelectorAll("[data-eq]").forEach(s=>{s.textContent=d.sel[s.dataset.eq]?fmt(b):""});
  msg=names.length?`${fmt(b)} each across ${names.length} ${names.length===1?"person":"people"}`:"Pick at least one person.";st=!names.length?"bad":tot>0?"ok":""}
 else if(d.mode==="exact"){const s=names.reduce((a,m)=>a+cents(d.vals[m]),0);msg=s===tot?"Amounts add up.":`${fmt(tot-s)} ${tot-s>0?"left to assign":"over"}`;st=s===tot?(tot>0?"ok":""):(s>tot||s>0?"bad":"")}
 else{const s=names.reduce((a,m)=>a+num(d.vals[m]),0),ok=Math.abs(s-100)<.001;msg=ok?"Percentages add up to 100.":`${(100-s).toFixed(1)}% ${100-s>0?"left to assign":"over"}`;st=ok?"ok":(s>0?"bad":"")}
 el.textContent=msg;el.className="hint "+st;
}
function syncDraft(){
 const d=V.draft;if(!d||V.sheet!=="expense")return;
 if($("ed"))d.desc=$("ed").value;if($("ea"))d.amount=$("ea").value;if($("ep"))d.payer=$("ep").value;if($("edt"))d.date=$("edt").value;if($("en"))d.note=$("en").value;
 document.querySelectorAll("[data-act=tick]").forEach(c=>d.sel[c.dataset.m]=c.checked);
 document.querySelectorAll("[data-act=val]").forEach(i=>d.vals[i.dataset.m]=i.value);
}
async function saveExp(){
 const d=V.draft,g=gcur(),tot=cents(d.amount),names=g.memberIds.filter(m=>d.sel[m]);
 if(!d.desc.trim())return toast("Add a description for this expense.");
 if(tot<=0)return toast("Enter an amount greater than zero.");
 if(!names.length)return toast("Pick at least one person to split with.");
 const split={};
 if(d.mode==="equal"){const b=Math.floor(tot/names.length);let r=tot-b*names.length;names.forEach(m=>{split[m]=b+(r-->0?1:0)})}
 else if(d.mode==="exact"){let s=0;names.forEach(m=>{split[m]=cents(d.vals[m]);s+=split[m]});if(s!==tot)return toast("Amounts must add up to the total.")}
 else{let p=0,s=0;names.forEach(m=>{const v=num(d.vals[m]);p+=v;split[m]=Math.floor(tot*v/100);s+=split[m]});
  if(Math.abs(p-100)>.001)return toast("Percentages must add up to 100.");split[names[0]]+=tot-s}
 const data={desc:d.desc.trim(),amount:tot,payer:d.payer,split,t:d.date?new Date(d.date+"T12:00:00").getTime():Date.now(),by:U.uid,note:d.note||""};
 data.receipt=d.receipt||"";data.cat=d.cat||"Miscellaneous";
 if(g.direct)V.gid=null;V.sheet=null;V.draft=null;render();
 try{if(d.eid)await updateDoc(doc(db,"sih_groups",g.id,"expenses",d.eid),data);else await addDoc(collection(db,"sih_groups",g.id,"expenses"),data);toast("Expense saved")}catch(e){toast(errMsg(e))}
}

document.addEventListener("submit",async ev=>{
 ev.preventDefault();if(ev.target.id!=="af")return;
 keepAuth();const e=V.email.trim().toLowerCase(),p=$("ap").value;
 try{
  if(V.mode==="signup"){signing=true;const n=V.sn.trim()||e.split("@")[0];
   const c=await createUserWithEmailAndPassword(auth,e,p);await updateProfile(c.user,{displayName:n});
   U={uid:c.user.uid,name:n,email:e,phone:normPhone(V.sp),photo:V.sphoto};
   await setDoc(doc(db,"sih_users",U.uid),userDoc());signing=false;await start();V.err="";render()}
  else{await signInWithEmailAndPassword(auth,e,p);V.err=""}
 }catch(x){signing=false;V.err=errMsg(x);render()}
});
document.addEventListener("click",async ev=>{
 const t=ev.target.closest("[data-act]");if(!t)return;const a=t.dataset.act;
 if(a==="close"){if(t.classList.contains("scrim")&&ev.target!==t)return;closeSheet();return render()}
 if(a==="tick"||a==="val")return;
 try{
 if(a==="google"){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){if(!/popup-closed|cancelled-popup/.test(e.code)){V.err=errMsg(e);render()}}return}
 if(a==="authmode"){keepAuth();V.mode=V.mode==="login"?"signup":"login";V.err="";return render()}
 if(a==="reset"){keepAuth();if(!V.email)return toast("Type your email above first.");await sendPasswordResetEmail(auth,V.email.trim());return toast("Password reset email sent")}
 if(a==="logout"){return signOut(auth)}
 if(a==="install"){if(deferred){deferred.prompt();try{await deferred.userChoice}catch(e){}deferred=null;return render()}V.sheet="ios";return render()}
 if(a==="tab"){V.tab=t.dataset.t;window.scrollTo(0,0);return render()}
 if(a==="theme"){setTheme(t.dataset.t);return render()}
 if(a==="open"){V.q="";V.gid=t.dataset.id;V.sheet=null;window.scrollTo(0,0);return render()}
 if(a==="back"){V.q="";V.gid=null;window.scrollTo(0,0);return render()}
 if(a==="settledtoggle"){V.showSettled=V.showSettled===false;return render()}
 if(a==="detail"){const g=groups.find(x=>x.id===t.dataset.gid),e=g&&(X[g.id]||[]).find(x=>x.id===t.dataset.id);if(!g||!e)return;
  if(e.kind==="payment"){if(await ask("Delete this payment?"))await deleteDoc(doc(db,"sih_groups",g.id,"expenses",e.id));return}
  if(V.cun)V.cun();V.dgid=g.id;V.did=e.id;V.comments=[];V.cerr=false;V.sheet="detail";
  const subC=n=>{V.cun=onSnapshot(collection(db,"sih_groups",g.id,"expenses",e.id,"comments"),s=>{V.cerr=false;V.comments=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>x.t-y.t);render()},er=>{console.error(er&&er.code);if(n<1){setTimeout(()=>{if(V.sheet==="detail"&&V.did===e.id)subC(n+1)},2500)}else{V.cerr=true;render()}})};subC(0);
  return render()}
 if(a==="dedit"){const g=groups.find(x=>x.id===V.dgid),e=g&&(X[g.id]||[]).find(x=>x.id===V.did);if(!e)return;if(V.cun){V.cun();V.cun=null}V.gid=g.id;V.draft=editDraft(g,e);V.sheet="expense";return render()}
 if(a==="ddel"){if(!await ask("Delete this expense?"))return;const gid=V.dgid,id=V.did;closeSheet();render();await deleteDoc(doc(db,"sih_groups",gid,"expenses",id));return toast("Expense deleted")}
 if(a==="csend"){const i=$("cm"),tx=i&&i.value.trim();if(!tx||V.busyc)return;V.busyc=true;try{await addDoc(collection(db,"sih_groups",V.dgid,"expenses",V.did,"comments"),{text:tx.slice(0,500),by:U.uid,name:U.name,t:Date.now()});const j=$("cm");if(j)j.value=""}catch(e){toast(errMsg(e))}finally{V.busyc=false}return}
 if(a==="cdel"){await deleteDoc(doc(db,"sih_groups",V.dgid,"expenses",V.did,"comments",t.dataset.id));return}
 if(a==="fexp"){V.fopen=!V.fopen;return render()}
 if(a==="fsettlefocus"){const i=$("fa");if(i)i.scrollIntoView({block:"center"});return}
 if(a==="fabreceipt"){const i=$("rp");if(i){i.value="";i.click()}return}
 if(a==="newgroup"){V.sheet="group";return render()}
 if(a==="addmember"){V.sheet="member";return render()}
 if(a==="share")return share();
 if(a==="receipt"){V.rid=t.dataset.id;V.sheet="receipt";return render()}
 if(a==="newexp"){V.draft=newDraft(gcur());V.sheet="expense";return render()}
 if(a==="fabadd"){const gs=groups.filter(g=>!g.direct);if(gs.length===1&&!friendBal().length){V.gid=gs[0].id;V.draft=newDraft(gs[0]);V.sheet="expense"}else V.sheet="pick";return render()}
 if(a==="pickg"){V.gid=t.dataset.id;V.draft=newDraft(gcur());V.sheet="expense";return render()}
 if(a==="pickf"){const g=await directGroup(t.dataset.k);if(!g)return toast("Could not start this expense. Try again.");V.gid=g.id;V.draft=newDraft(g);V.sheet="expense";return render()}
 if(a==="editx"){const g=groups.find(x=>x.id===t.dataset.gid),e=g&&(X[g.id]||[]).find(x=>x.id===t.dataset.id);if(!g||!e)return;
  if(e.kind==="payment"){if(await ask("Delete this payment?"))await deleteDoc(doc(db,"sih_groups",g.id,"expenses",e.id));return}
  V.gid=g.id;V.draft=editDraft(g,e);V.sheet="expense";return render()}
 if(a==="addfriend"){V.sheet="addfriend";return render()}
 if(a==="shareapp")return shareApp();
 if(a==="savefriend"){const raw=$("fn").value.trim();if(!raw)return toast("Enter an email or phone number.");
  const isE=raw.includes("@"),f=await getDocs(query(collection(db,"sih_users"),where(isE?"email":"phone","==",isE?raw.toLowerCase():normPhone(raw))));
  if(f.empty)return toast("No Split in Half account found. Share the app link instead.");
  const u=f.docs[0];if(u.id===U.uid)return toast("That is your own account.");
  const g=await directGroup(u.id);if(!g)return toast("Could not add this friend. Try again.");
  V.sheet=null;V.tab="friends";render();return toast((u.data().name||"Friend")+" added")}
 if(a==="friend"){V.fid=t.dataset.k;V.famt=null;V.fopen=false;V.sheet="friend";return render()}
 if(a==="payer"){syncDraft();V.draft.payer=t.dataset.m;$("ep").value=t.dataset.m;t.parentElement.querySelectorAll(".paychip").forEach(b=>{const on=b===t;b.classList.toggle("on",on);b.setAttribute("aria-checked",on)});return}
 if(a==="cat"){syncDraft();V.draft.cat=t.dataset.k;const c=t.parentElement;c.querySelectorAll(".xp-cat").forEach(b=>b.classList.toggle("on",b===t));centerCat(c,true);return}
 if(a==="ffull"||a==="fhalf"){const f=friendBal().find(x=>x.k===V.fid);if(!f||!$("fa"))return;V.famt=((a==="ffull"?Math.abs(f.v):Math.floor(Math.abs(f.v)/2))/100).toFixed(2);$("fa").value=V.famt;return}
 if(a==="fsettle"){if(V.busy)return;const k=V.fid,f=friendBal().find(x=>x.k===k);if(!f||!f.v)return toast("You are already settled up.");
  const amt=cents($("fa").value);if(amt<=0)return toast("Enter an amount greater than zero.");
  if(amt>Math.abs(f.v))return toast("That is more than the balance of "+fmt(f.v)+".");
  const dir=f.v>0?1:-1,parts=groups.map(g=>({g,v:pairBal(g,k)})).filter(p=>p.v*dir>0).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v));
  let left=amt;const jobs=[];
  for(const p of parts){if(left<=0)break;const x=Math.min(left,Math.abs(p.v));left-=x;
   jobs.push(addDoc(collection(db,"sih_groups",p.g.id,"expenses"),{kind:"payment",desc:"Payment",amount:x,payer:dir>0?k:U.uid,split:{[dir>0?U.uid:k]:x},t:Date.now(),by:U.uid}))}
  V.busy=true;try{await Promise.all(jobs)}finally{V.busy=false}
  V.famt=null;render();return toast("Payment recorded")}
 if(a==="rmgphoto"){await updateDoc(doc(db,"sih_groups",V.gid),{photo:""});return toast("Group photo removed")}
 if(a==="settleopen"){V.sheet="settle";return render()}
 if(a==="editexp"){const e=(X[V.gid]||[]).find(x=>x.id===t.dataset.id);if(!e)return;
  if(e.kind==="payment"){if(await ask("Delete this payment?"))await deleteDoc(doc(db,"sih_groups",V.gid,"expenses",e.id));return}
  V.draft=editDraft(gcur(),e);V.sheet="expense";return render()}
 if(a==="delexp"){if(!await ask("Delete this expense?"))return;const id=V.draft.eid,gid=V.gid;closeSheet();V.draft=null;render();await deleteDoc(doc(db,"sih_groups",gid,"expenses",id));return toast("Expense deleted")}
 if(a==="leave"){const g=gcur();if((net(g)[U.uid]||0)!==0)return toast("Settle up before leaving this group.");if(!await ask("Leave "+g.name+"?"))return;await updateDoc(doc(db,"sih_groups",g.id),{memberIds:arrayRemove(U.uid)});V.gid=null;return render()}
 if(a==="delgroup"){const g=gcur();if(!await ask("Delete "+g.name+" and all its expenses for everyone?"))return;for(const e of X[g.id]||[])await deleteDoc(doc(db,"sih_groups",g.id,"expenses",e.id));await deleteDoc(doc(db,"sih_groups",g.id));V.gid=null;return render()}
 if(a==="mode"){syncDraft();V.draft.mode=t.dataset.k;return render()}
 if(a==="rmreceipt"){syncDraft();V.draft.receipt=null;return render()}
 if(a==="saveexp"){syncDraft();return saveExp()}
 if(a==="saveprofile"){U.name=$("pn").value.trim()||U.name;U.phone=normPhone($("pp").value);await saveProfile();return toast("Profile saved")}
 if(a==="savegroup"){const n=$("gn").value.trim();if(!n)return toast("Give the group a name.");
  V.sheet=null;render();
  const r=await addDoc(collection(db,"sih_groups"),{name:n,createdBy:U.uid,memberIds:[U.uid],t:Date.now(),members:{[U.uid]:U.name},photos:{[U.uid]:U.photo||""},phones:{[U.uid]:U.phone||""}});
  await new Promise(ok=>{let n=0;const i=setInterval(()=>{if(groups.find(g=>g.id===r.id)||++n>100){clearInterval(i);ok()}},60)});
  V.gid=r.id;V.sheet="member";return render()}
 if(a==="savemember"){const r=await addPerson($("mn").value);
  if(r==="none")return toast("No Split in Half account found. Share the invite link instead.");
  if(r==="empty")return toast("Enter an email or phone number.");
  V.sheet=null;render();return toast(r==="already"?"Already in this group":"Added to the group")}
 if(a==="settle"){const mx=+t.dataset.amt,inp=t.parentElement.querySelector("input"),amt=inp?cents(inp.value):mx;if(amt<=0)return toast("Enter an amount greater than zero.");if(amt>mx)return toast("That is more than the balance of "+fmt(mx)+".");await addDoc(collection(db,"sih_groups",V.gid,"expenses"),{kind:"payment",desc:"Payment",amount:amt,payer:t.dataset.from,split:{[t.dataset.to]:amt},t:Date.now(),by:U.uid});V.sheet=null;render();return toast("Payment recorded")}
 if(a==="del"){await deleteDoc(doc(db,"sih_groups",V.gid,"expenses",t.dataset.id));return toast("Expense deleted")}
 }catch(e){toast(errMsg(e))}
});
document.addEventListener("input",ev=>{const el=ev.target;if(el.id==="xq"){V.q=el.value;render();return}if(el.id==="fa")V.famt=el.value;
 if(V.sheet==="expense"){
  const money=el.id==="ea"||el.dataset.act==="val";
  if(money){const c=cleanNum(el.value);if(c!==el.value)el.value=c;if(el.id==="ea")sizeAmt(el)}
  syncDraft();if(money)hint()}});
document.addEventListener("change",async ev=>{
 const t=ev.target;
 if(t.dataset.act==="tick"){syncDraft();hint()}
 if(!t.files||!t.files[0])return;
 try{
  if(t.id==="rp"){const r=await shrink(t.files[0]);if(r.length>600000)return toast("That photo is too large. Try a closer crop.");V.prc=r;const gs=groups.filter(g=>!g.direct);if(gs.length===1&&!friendBal().length){V.gid=gs[0].id;V.draft=newDraft(gs[0]);V.sheet="expense"}else V.sheet="pick";render();return}
  if(t.id==="er"){syncDraft();const r=await shrink(t.files[0]);if(r.length>600000)return toast("That photo is too large. Try a closer crop.");V.draft.receipt=r;render()}
  if(t.id==="gp"){const g=gcur();if(!g)return;const r=await shrink(t.files[0],320,.7);await updateDoc(doc(db,"sih_groups",g.id),{photo:r});toast("Group photo updated for everyone");t.value=""}
  if(t.id==="sp"){keepAuth();V.sphoto=await shrink(t.files[0],200,.7);render()}
  if(t.id==="pf"){U.name=$("pn").value.trim()||U.name;U.phone=normPhone($("pp").value);U.photo=await shrink(t.files[0],200,.7);render();await saveProfile();toast("Photo updated")}
 }catch(e){toast("Could not read that image.")}
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;render()});
window.addEventListener("appinstalled",()=>{deferred=null;render();toast("App installed")});
if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;navigator.serviceWorker.register("sw.js").catch(()=>{});navigator.serviceWorker.addEventListener("message",e=>{if(had&&e.data==="updated")toast("New version ready. Close and reopen the app.")})}
window.addEventListener("offline",()=>toast("You are offline. Changes sync when you reconnect."));window.addEventListener("online",()=>toast("Back online"));
render();

document.addEventListener("keydown",e=>{if(e.key==="Escape"&&V.sheet&&!document.querySelector(".scrim.center")){closeSheet();render()}});

["gesturestart","gesturechange","gestureend"].forEach(n=>document.addEventListener(n,e=>e.preventDefault()));

if(window.visualViewport)["resize","scroll"].forEach(n=>window.visualViewport.addEventListener(n,fitView));
window.addEventListener("resize",fitView);
document.addEventListener("scroll",e=>{const t=e.target;if(t&&t.classList&&t.classList.contains("xp")&&t.scrollLeft)t.scrollLeft=0},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"||V.sheet!=="expense")return;const id=e.target.id;
 if(id==="ea"){e.preventDefault();const n=$("ed");if(n)n.focus()}else if(id==="ed"||e.target.dataset.act==="val"){e.preventDefault();e.target.blur()}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="cm"){e.preventDefault();const b=document.querySelector(".csend");if(b)b.click()}});
