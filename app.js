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
    var n=nodes[ni];ci++;n[0].nodeValue=n[1].slice(0,ci);
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