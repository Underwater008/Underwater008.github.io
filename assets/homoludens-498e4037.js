import"./styles-5a3fce9e.js";import{G as d,O as m,a as l}from"./GLTFLoader-d59c2c18.js";function c(){document.querySelectorAll(".transfadein").forEach(t=>{t.style.opacity="1",t.style.transform="translateY(0)"})}c();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setClearColor(0,0);document.body.appendChild(renderer.domElement);const y=new d,o=new m(myCamera,renderer.domElement);o.enablePan=!1;let e;y.load("./3DModels/cozy_campfire_-_shape_key_animation/scene.gltf",n=>{e=n.scene,scene.add(e),e.position.x=-5;const t=new l(13450048,2,50);e.add(t),myCamera.position.x=30,myCamera.position.y=60,myCamera.position.z=80,e.traverse(i=>{i.isMesh&&i.material.emissiveMap&&(i.material.emissiveIntensity=200)}),itemLoaded()},void 0,n=>{console.error(n)});function a(){requestAnimationFrame(a),o.update(),renderer.render(scene,myCamera)}a();function r(){myCamera.aspect=window.innerWidth/window.innerHeight,myCamera.updateProjectionMatrix(),renderer.setSize(window.innerWidth,window.innerHeight)}window.addEventListener("resize",r,!1);r();function s(n,t,i){e&&TweenMax.to(e.rotation,1,{x:n,y:t,z:i})}const w=document.getElementById("reset-btn"),p=document.getElementById("blogs-btn"),f=document.getElementById("About-btn");w.addEventListener("click",()=>{resetLandingPage(),s(0,0,0),TweenMax.to(myCamera.position,1,{x:30,y:60,z:80})});p.addEventListener("click",()=>{window.open("./xiaoblogs.html","_self")});f.addEventListener("click",()=>{resetLandingPage(),s(0,4*Math.PI/4,0),TweenMax.to(myCamera.position,1,{x:0,y:0,z:5})});