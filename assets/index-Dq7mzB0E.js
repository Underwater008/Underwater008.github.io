import{S as z,P as M,W as C,a as S}from"./three.module-DQzacYpc.js";import{G as W,O as k}from"./GLTFLoader-CQPCB_ls.js";const w=localStorage.getItem("firstVisit")===null,h=new z,t=new M(75,window.innerWidth/window.innerHeight,.1,1e3),l=new C;l.setSize(window.innerWidth,window.innerHeight);l.setClearColor(0,0);document.body.appendChild(l.domElement);const H=new W,f=new k(t,l.domElement);f.enablePan=!1;let y=0,s;H.load("./3DModels/cozy_campfire_-_shape_key_animation/scene.gltf",e=>{s=e.scene,h.add(s),s.position.x=-5;const n=new S(13450048,2,50);s.add(n),s.traverse(i=>{i.isMesh&&i.material.emissiveMap&&(i.material.emissiveIntensity=200)}),L()},void 0,e=>{console.error(e)});t.position.x=30;t.position.y=60;t.position.z=80;t.position;function I(){requestAnimationFrame(I),f.update(),l.render(h,t),console.log(t.position)}I();function v(){t.aspect=window.innerWidth/window.innerHeight,t.updateProjectionMatrix(),l.setSize(window.innerWidth,window.innerHeight)}window.addEventListener("resize",v,!1);v();function g(e,n,i){s&&TweenMax.to(s.rotation,1,{x:e,y:n,z:i})}const _=document.getElementById("reset-btn"),A=document.getElementById("blogs-btn"),D=document.getElementById("About-btn"),O=document.getElementById("homo-ludens");_.addEventListener("click",()=>{p(),g(0,0,0),TweenMax.to(t.position,1,{x:30,y:60,z:80})});A.addEventListener("click",()=>{window.open("https://www.x1ao.art/","_self")});const r=document.getElementById("about-xiao-info");D.addEventListener("click",()=>{if(r.style.opacity!="0"){TweenMax.to(t.position,1,{x:18,y:4.7,z:-34.7});return}p(),r.style.display="block",TweenMax.to(t.position,1,{x:18,y:4.7,z:-34.7}),setTimeout(()=>{r.style.opacity="1"},800)});const m=document.getElementById("homo-ludens-info");O.addEventListener("click",()=>{if(m.style.opacity!="0"){TweenMax.to(t.position,2,{x:-7.6,y:2.58,z:2.37,ease:Power2.easeInOut}),g(0,4*Math.PI/4,0);return}p(),m.style.display="block",TweenMax.to(t.position,2,{x:-7.6,y:2.58,z:2.37,ease:Power2.easeInOut}),g(0,4*Math.PI/4,0),setTimeout(()=>{m.style.opacity="1"},1500)});function p(){m.style.opacity="0",r.style.opacity="0",m.style.display="none",r.style.display="none"}const j=document.getElementById("loading-screen"),G=document.getElementById("loading-text"),d=document.getElementById("job-title"),R=document.getElementById("progress"),c=["Gamer","a Programmer","a Technical Artist","a Homo Ludens","XIAO"];let x=1,u=0;w?V():d.innerText=c[c.length-1];function E(){document.querySelectorAll(".transfadein").forEach(n=>{n.style.opacity="1",n.style.transform="translateY(0)"})}function L(){y++,B(),y>=x&&(!w||u>=c.length)&&setTimeout(()=>{G.style.opacity="0",R.style.opacity="0",document.getElementById("content-container").style.opacity="1",j.style.zIndex="-1",E(),localStorage.setItem("firstVisit","false")},1e3)}function B(){const e=document.querySelector("#progress");parseInt(window.getComputedStyle(e).getPropertyValue("width"));const n=Math.round((y+u)/(x+(w?c.length:0))*100);e.style.width=n+"%"}function V(){let e=setInterval(()=>{u++,u>=c.length?(clearInterval(e),L()):(d.classList.add("fade-out"),setTimeout(()=>{d.textContent=c[u],d.classList.remove("fade-out"),d.classList.add("fade-in"),setTimeout(()=>{d.classList.remove("fade-in")},500),setTimeout(()=>{B()},1e3)},500))},1500)}const o=document.getElementById("drawing-canvas"),a=o.getContext("2d");let b=[];function T(){const e=document.createElement("canvas");e.width=o.width,e.height=o.height,e.getContext("2d").drawImage(o,0,0),o.width=window.innerWidth,o.height=window.innerHeight,a.drawImage(e,0,0)}T();window.addEventListener("resize",T);function P(e,n){a.beginPath(),a.arc(e,n,2,0,Math.PI*2),a.fill(),b.push({x:e,y:n})}function X(){for(const e of b)a.beginPath(),a.arc(e.x,e.y,2,0,Math.PI*2),a.fill()}o.addEventListener("mousemove",e=>{P(e.clientX,e.clientY)});o.addEventListener("touchmove",e=>{e.preventDefault();const n=e.touches[0].clientX-o.getBoundingClientRect().left,i=e.touches[0].clientY-o.getBoundingClientRect().top;P(n,i)});window.addEventListener("resize",()=>{X()});{const e=document.getElementById("loading-screen");e.style.display="none",document.getElementById("content-container").style.opacity="1",E()}