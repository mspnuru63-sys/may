/* ---------- 0. Ambiance sonore : musique douce + clic de clavier (WebAudio, aucun fichier audio) ---------- */
(function(){
var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
var KEY="maya-son";
function lget(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function sget(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function sset(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
var enabled=lget(KEY)!=="0",ctx=new AC();

/* circuit : master (on/off + fondu) > musicBus (baisse quand une vidéo joue) + sfxBus (clavier) */
var master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
var musicBus=ctx.createGain();musicBus.connect(master);
var sfxBus=ctx.createGain();sfxBus.gain.value=1.7;sfxBus.connect(master);

/* réverbération + écho pour l'effet « boîte à musique » */
var inp=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),verb=ctx.createConvolver();
var len=Math.floor(ctx.sampleRate*2.4),ir=ctx.createBuffer(2,len,ctx.sampleRate);
for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
verb.buffer=ir;dry.gain.value=.85;wet.gain.value=.5;
inp.connect(dry);dry.connect(musicBus);inp.connect(verb);verb.connect(wet);wet.connect(musicBus);
var dl=ctx.createDelay(1),fb=ctx.createGain(),lp=ctx.createBiquadFilter(),eo=ctx.createGain();
dl.delayTime.value=.45;fb.gain.value=.3;lp.type="lowpass";lp.frequency.value=2200;eo.gain.value=.4;
inp.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(eo);eo.connect(musicBus);

function mf(m){return 440*Math.pow(2,(m-69)/12)}
function tone(m,t,dur,vol){ /* note de boîte à musique */
  var o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),g2=ctx.createGain();
  o.type="sine";o.frequency.value=mf(m);o2.type="sine";o2.frequency.value=mf(m)*2;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.setTargetAtTime(0,t+.012,dur/4);
  g2.gain.setValueAtTime(.3,t);g2.gain.setTargetAtTime(0,t+.01,dur/12);
  o.connect(g);o2.connect(g2);g2.connect(g);g.connect(inp);
  o.start(t);o2.start(t);o.stop(t+dur+.3);o2.stop(t+dur+.3);
}
function pad(m,t,dur,vol){ /* nappe douce */
  var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=mf(m);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.45);g.gain.linearRampToValueAtTime(0,t+dur+.6);
  o.connect(g);g.connect(inp);o.start(t);o.stop(t+dur+.7);
}
/* berceuse originale en valse : 8 mesures qui bouclent (Do - Lam - Fa - Sol - Do - Mim - Fa - Sol) */
var BEAT=.9,BAR=BEAT*3;
var CH=[[60,64,67],[57,60,64],[53,57,60],[55,59,62],[60,64,67],[52,55,59],[53,57,60],[55,59,62]];
var ME=[[[0,88,1],[1,84,1],[2,79,1]],[[0,81,1],[2,84,1]],[[0,84,1],[1,81,1],[2,77,1]],[[0,79,1],[2,83,1]],
        [[0,88,1],[1,86,1],[2,84,1]],[[0,83,1],[2,79,1]],[[0,81,1],[1,84,1],[2,81,1]],[[0,86,1],[2,83,1]]];
function bar(i,t){
  var c=CH[i];pad(c[0]-12,t,BAR,.07);pad(c[2]-12,t,BAR,.035);
  for(var k=0;k<3;k++)tone(c[k]+12,t+k*BEAT,2.2,.035);
  ME[i].forEach(function(n){tone(n[1],t+n[0]*BEAT,2.6,.085)});
}
var bi=(parseInt(sget("maya-bar"),10)||0)%8,next=0;
function tick(){
  if(ctx.state!=="running"||!enabled)return;
  var now=ctx.currentTime;if(!next||next<now)next=now+.15;
  while(next<now+1.6){bar(bi,next);next+=BAR;bi=(bi+1)%8;sset("maya-bar",bi)}
}
setInterval(tick,300);

function fade(s){var t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(enabled?.55:0,t+s)}
function duck(on){var t=ctx.currentTime;musicBus.gain.cancelScheduledValues(t);musicBus.gain.setValueAtTime(musicBus.gain.value,t);musicBus.gain.linearRampToValueAtTime(on?0:1,t+.6)}
fade(3);

/* son de clavier : clic sec + petit « tac » grave */
var nb=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.06),ctx.sampleRate),nd=nb.getChannelData(0),last=0;
for(var j=0;j<nd.length;j++)nd[j]=Math.random()*2-1;
function key(ch){
  if(!enabled||ctx.state!=="running")return;
  var t=ctx.currentTime;if(t-last<.045)return;last=t;
  var sp=ch===" ",s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=nb;f.type="bandpass";f.frequency.value=(sp?900:1800)+Math.random()*1400;f.Q.value=.9;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((sp?.26:.2)*(.8+Math.random()*.4),t+.002);g.gain.exponentialRampToValueAtTime(.0008,t+.045);
  s.connect(f);f.connect(g);g.connect(sfxBus);s.start(t);s.stop(t+.06);
  var o=ctx.createOscillator(),og=ctx.createGain();o.type="sine";
  o.frequency.setValueAtTime(sp?110:170+Math.random()*50,t);o.frequency.exponentialRampToValueAtTime(70,t+.05);
  og.gain.setValueAtTime(.16,t);og.gain.exponentialRampToValueAtTime(.0008,t+.06);
  o.connect(og);og.connect(sfxBus);o.start(t);o.stop(t+.07);
}
window.MayaSound={key:key};

/* navigateurs : le son démarre au premier toucher si le chargement seul ne suffit pas */
var evs=["pointerdown","touchend","click","keydown"];
function unlock(){if(!enabled)return;ctx.resume().then(function(){if(ctx.state==="running")evs.forEach(function(e){removeEventListener(e,unlock,true)})}).catch(function(){})}
evs.forEach(function(e){addEventListener(e,unlock,true)});
ctx.resume().catch(function(){});
document.addEventListener("visibilitychange",function(){if(document.hidden)ctx.suspend();else if(enabled)ctx.resume().catch(function(){})});
/* la musique s'efface quand une vidéo avec son se lance */
document.addEventListener("play",function(e){if(e.target.tagName==="VIDEO"&&!e.target.muted)duck(true)},true);
["pause","ended"].forEach(function(ev){document.addEventListener(ev,function(e){if(e.target.tagName==="VIDEO"&&!e.target.muted)duck(false)},true)});

/* bouton son + petite bulle d'aide */
var st=document.createElement("style");
st.textContent=".snd{position:fixed;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));z-index:60;width:46px;height:46px;border-radius:50%;border:1px solid rgba(201,139,151,.5);background:rgba(251,246,243,.92);color:#c98b97;font:600 22px/1 Georgia,serif;cursor:pointer;box-shadow:0 8px 22px rgba(80,50,55,.2);display:flex;align-items:center;justify-content:center;transition:transform .25s}.snd:hover{transform:scale(1.07)}.snd.off{color:#8a7a7e;opacity:.8}.snd.off::after{content:'';position:absolute;width:28px;height:2px;background:currentColor;transform:rotate(-45deg);border-radius:2px}"
 +".snd-hint{position:fixed;left:70px;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 12px);z-index:60;padding:9px 14px;border-radius:99px;background:rgba(59,47,51,.92);color:#fff;font:400 12px/1.2 system-ui,sans-serif;letter-spacing:.04em;opacity:0;transform:translateX(-6px);transition:.4s;pointer-events:none}.snd-hint.on{opacity:1;transform:none}";
document.head.appendChild(st);
var btn=document.createElement("button"),hint=document.createElement("div");
btn.className="snd";btn.type="button";btn.textContent="\u266A";
hint.className="snd-hint";hint.textContent="\u266A Touchez l\u2019écran pour activer la musique";
function paint(){btn.classList.toggle("off",!enabled);btn.setAttribute("aria-pressed",enabled);btn.setAttribute("aria-label",enabled?"Couper le son":"Activer le son")}
btn.onclick=function(){enabled=!enabled;lset(KEY,enabled?"1":"0");paint();if(enabled)ctx.resume().catch(function(){});fade(.6)};
paint();document.body.appendChild(btn);document.body.appendChild(hint);
setTimeout(function(){if(enabled&&ctx.state!=="running")hint.classList.add("on")},1200);
ctx.onstatechange=function(){if(ctx.state==="running")hint.classList.remove("on")};
})();

(function(){
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches,started=false,t0=Date.now();

/* ---------- 1. Fin du chargement + écriture des textes ---------- */
var targets=[].slice.call(document.querySelectorAll("[data-type],.hero h1,.hero .full,.dedi,.chhead h1,.tag,.chapters h2"));
targets.forEach(function(el){el.style.minHeight=el.offsetHeight+"px";el.style.visibility="hidden"});

function typeEl(el,done){
  var nodes=[],w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  while(w.nextNode())nodes.push([w.currentNode,w.currentNode.nodeValue]);
  nodes.forEach(function(n){n[0].nodeValue=""});
  el.style.visibility="visible";el.classList.add("typing");
  var ni=0,ci=0,sp=el.classList.contains("dedi")?24:el.tagName==="H1"?55:38;
  (function step(){
    if(ni>=nodes.length){el.classList.remove("typing");el.style.minHeight="";return done()}
    var n=nodes[ni];ci++;n[0].nodeValue=n[1].slice(0,ci);if(window.MayaSound)MayaSound.key(n[1].charAt(ci-1));
    if(ci>=n[1].length){ni++;ci=0}
    setTimeout(step,sp);
  })();
}
function typeAll(){
  if(rm){targets.forEach(function(el){el.style.visibility="visible"});return}
  var k=0;(function next(){if(k>=targets.length)return;typeEl(targets[k++],function(){setTimeout(next,160)})})();
}
function ready(){
  if(started)return;started=true;
  document.body.classList.add("ready");
  setTimeout(typeAll,450);
}
window.addEventListener("load",function(){setTimeout(ready,300)});
setTimeout(ready,5000);

/* ---------- 2. Apparition au scroll (en cascade) ---------- */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("on");io.unobserve(e.target)}})},{threshold:.08});
document.querySelectorAll(".reveal").forEach(function(el,k){el.style.transitionDelay=(k%4)*90+"ms";io.observe(el)});

/* ---------- 3. Lightbox photos + vidéos ---------- */
var lb=document.getElementById("lb");if(!lb)return;
var items=[].slice.call(document.querySelectorAll(".gallery img,.gallery video")),
    im=lb.querySelector("img"),ct=lb.querySelector(".ct"),i=0,sx=0,
    vd=document.createElement("video");
vd.controls=true;vd.playsInline=true;vd.hidden=true;im.parentNode.insertBefore(vd,im.nextSibling);
items.forEach(function(m){if(m.tagName==="VIDEO")m.parentNode.classList.add("vid")});

function show(k){
  i=(k+items.length)%items.length;var m=items[i];vd.pause();
  if(m.tagName==="VIDEO"){im.hidden=true;vd.hidden=false;vd.src=m.currentSrc||m.src;vd.poster=m.poster||"";vd.play().catch(function(){})}
  else{vd.hidden=true;im.hidden=false;im.src=m.src;im.alt=m.alt}
  ct.textContent=(i+1)+" / "+items.length;
}
function open(k){show(k);lb.hidden=false;document.body.style.overflow="hidden"}
function close(){vd.pause();lb.hidden=true;document.body.style.overflow=""}
items.forEach(function(m,k){m.parentNode.addEventListener("click",function(){open(k)})});
lb.querySelector(".x").onclick=close;
lb.querySelector(".p").onclick=function(){show(i-1)};
lb.querySelector(".n").onclick=function(){show(i+1)};
lb.addEventListener("click",function(e){if(e.target===lb)close()});
document.addEventListener("keydown",function(e){if(lb.hidden)return;if(e.key==="Escape")close();if(e.key==="ArrowLeft")show(i-1);if(e.key==="ArrowRight")show(i+1)});
lb.addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});
lb.addEventListener("touchend",function(e){var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)show(d>0?i-1:i+1)});
})();