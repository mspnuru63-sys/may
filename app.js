(function(){
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("on");io.unobserve(e.target)}})},{threshold:.08});
document.querySelectorAll(".reveal").forEach(function(el){io.observe(el)});
var lb=document.getElementById("lb");if(!lb)return;
var imgs=[].slice.call(document.querySelectorAll(".gallery img")),im=lb.querySelector("img"),ct=lb.querySelector(".ct"),i=0,sx=0;
function show(k){i=(k+imgs.length)%imgs.length;im.src=imgs[i].src;im.alt=imgs[i].alt;ct.textContent=(i+1)+" / "+imgs.length}
function open(k){show(k);lb.hidden=false;document.body.style.overflow="hidden"}
function close(){lb.hidden=true;document.body.style.overflow=""}
imgs.forEach(function(m,k){m.parentNode.addEventListener("click",function(){open(k)})});
lb.querySelector(".x").onclick=close;lb.querySelector(".p").onclick=function(){show(i-1)};lb.querySelector(".n").onclick=function(){show(i+1)};
lb.addEventListener("click",function(e){if(e.target===lb)close()});
document.addEventListener("keydown",function(e){if(lb.hidden)return;if(e.key==="Escape")close();if(e.key==="ArrowLeft")show(i-1);if(e.key==="ArrowRight")show(i+1)});
lb.addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});
lb.addEventListener("touchend",function(e){var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)show(d>0?i-1:i+1)});
})();