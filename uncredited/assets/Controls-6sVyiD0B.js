import{g as _,C as N}from"./main-CQ1PkxFz.js";import{d as R,e as T}from"./SkyFolder-DI37wwg4.js";function L(e,t){const a=t.addFolder("Audio",{expanded:!1});return a.addSlider("Volume",{value:e.audioManager.getVolume(),min:0,max:1,step:.05,onChange:n=>e.audioManager.setVolume(n)}),a.addCheckbox("Muted",{value:e.audioManager.isMuted(),onChange:n=>e.audioManager.setMuted(n)}),a}function M(e,t){const a=t.addFolder("Blood Rain",{expanded:!1}),n=e.params.demo.bloodRain,s=(o,r,i,d,l)=>{a.addSlider(o,{object:n,key:r,min:i,max:d,step:l,onChange:c=>{e.app.applyBloodRainSettings({[r]:c})}})};return a.addCheckbox("Dev Force Rain",{object:n,key:"devEnabled",onChange:o=>{e.app.setBloodRainDevEnabled(o)}}),s("Intensity","intensity",0,1,.05),s("Area Radius","areaRadius",25,220,5),s("Fall Speed","fallSpeed",.25,2.5,.05),s("Glow","glowIntensity",.2,4,.05),s("Ripple Size","rippleSize",.25,3,.05),s("Splash Amount","splashAmount",0,3,.1),a}function O(e,t){const a=t.addFolder("Boat",{expanded:!1}),n=e.shipController,s=e.params.demo.boat,o=e.params.demo.boatVisual,r=(i,d,l,c,p)=>{a.addSlider(i,{object:n,key:d,min:l,max:c,step:p,onChange:m=>{s[d]=m}})};return a.addCheckbox("Mask Enabled",{binding:()=>{const i=e.app.models.shipWaterMask;return i?e.water.masking.has(i):!1},onChange:i=>{e.app.setBoatMaskEnabled(i)}}),a.addSlider("Boat Size",{value:e.params.demo.boatSize,min:4,max:30,step:.5,binding:()=>e.params.demo.boatSize,onChange:i=>e.app.setBoatSize(i)}),a.addColor("Glow Color",{object:o,key:"glowColor",onChange:i=>{e.app.applyBoatVisualSettings({glowColor:i})}}),a.addSlider("Glow Intensity",{object:o,key:"glowIntensity",min:0,max:5,step:.05,onChange:i=>{e.app.applyBoatVisualSettings({glowIntensity:i})}}),a.addColor("Line Color",{object:o,key:"lineColor",onChange:i=>{e.app.applyBoatVisualSettings({lineColor:i})}}),a.addSlider("Line Thickness",{object:o,key:"lineThickness",min:.2,max:4,step:.1,onChange:i=>{e.app.applyBoatVisualSettings({lineThickness:i})}}),r("Thrust","thrust",1,50,1),r("Drag","drag",.1,8,.05),r("Max Speed","maxSpeed",4,100,1),r("Reverse Max Speed","reverseMaxSpeed",1,50,1),r("Turn Rate","turnRate",.1,8,.05),r("Rudder Rate","rudderRate",.5,20,.1),r("Rudder Return","rudderReturn",.5,20,.1),r("Throttle Rate","throttleRate",.2,10,.1),a}function B(e,t){const a=t.addFolder("Camera",{expanded:!1}),n=a.addSelect("Mode",{binding:()=>e.cameraController.mode,options:[{label:"Free Camera (1)",value:"freeCamera"},{label:"Flight Camera (2)",value:"flightCamera"},{label:"Third Person (3)",value:"thirdPerson"}],onChange:s=>{e.cameraController.setMode(s)}});return e.cameraController.onModeChange(s=>{n.setValueSilent(s)}),a.addCheckbox("Camera Tracking",{binding:()=>e.water.cameraTracking,onChange:s=>{e.water.cameraTracking=s}}),a}function W(e,t){const a=t.addFolder("Debug",{expanded:!1}),n=localStorage.getItem("forceWebGL")==="true";return e.params.debug.forceWebGL=n,a.addCheckbox("Force WebGL",{value:n,binding:()=>e.params.debug.forceWebGL,onChange:s=>{e.params.debug.forceWebGL=s,localStorage.setItem("forceWebGL",String(s)),window.location.reload()}}),a}function V(e,t){const a=t.addFolder("Heart Beacon",{expanded:!0}),n=e.params.demo.heartVisual;return a.addColor("Fill Color",{object:n,key:"fillColor",onChange:s=>{e.app.applyHeartVisualSettings({fillColor:s})}}),a.addColor("Emissive Color",{object:n,key:"emissiveColor",onChange:s=>{e.app.applyHeartVisualSettings({emissiveColor:s})}}),a.addSlider("Glow Intensity",{object:n,key:"glowIntensity",min:0,max:30,step:.1,onChange:s=>{e.app.applyHeartVisualSettings({glowIntensity:s})}}),a.addColor("Line Color",{object:n,key:"lineColor",onChange:s=>{e.app.applyHeartVisualSettings({lineColor:s})}}),a.addSlider("Line Thickness",{object:n,key:"lineThickness",min:.2,max:4,step:.1,onChange:s=>{e.app.applyHeartVisualSettings({lineThickness:s})}}),a}function A(e,t){const a=t.addFolder("Performance",{expanded:!1});return e.app.shipHUD.setVisible(e.performanceParams.showMonitor),a.addCheckbox("Show Monitor",{value:e.performanceParams.showMonitor,onChange:n=>{e.performanceParams.showMonitor=n,e.app.shipHUD.setVisible(n)}}),a.addCheckbox("Dynamic Resolution",{value:e.performanceParams.dynamicResolution,onChange:n=>{e.performanceParams.dynamicResolution=n,n||e.app.setPixelRatio(1)}}),a.addSlider("Target FPS",{value:e.performanceParams.targetFps,min:30,max:120,step:5,onChange:n=>{e.performanceParams.targetFps=n}}),a.addSlider("Min Pixel Ratio",{value:e.performanceParams.minPixelRatio,min:.25,max:1,step:.05,onChange:n=>{e.performanceParams.minPixelRatio=n}}),a.addSlider("Max Pixel Ratio",{value:e.performanceParams.maxPixelRatio,min:.5,max:Math.min(window.devicePixelRatio,4),step:.1,onChange:n=>{e.performanceParams.maxPixelRatio=n}}),a}function g(e){const t=e.params.buoyancy.ship,a=e.app.shipBuoyancyId;a>=0&&e.water.buoyancy.updateObjectConfig(a,{heightOffset:t.heightOffset,rotationInfluence:t.tiltAmount,heightSmoothing:t.heightSmoothing,rotationSmoothing:t.tiltSmoothing})}function b(e){const t=e.params.buoyancy.buoy;for(const a of e.app.islandBuoyIds)e.water.buoyancy.updateObjectConfig(a,{heightOffset:t.heightOffset,rotationInfluence:t.tiltAmount,heightSmoothing:t.heightSmoothing,rotationSmoothing:t.tiltSmoothing})}function G(e,t){const a=e.app.models,n=e.water,s=e.params;s.buoyancy.ship.enabled=t,s.buoyancy.buoy.enabled=t,a.shipModel.visible=t;for(const o of a.islandBuoys)o.visible=t;a.shipWaterMask&&(t?n.masking.has(a.shipWaterMask)||n.masking.add(a.shipWaterMask):n.masking.remove(a.shipWaterMask))}function H(e,t){const a=t.addFolder("Buoyancy",{expanded:!1});a.addCheckbox("Show Objects",{binding:()=>e.params.buoyancy.ship.enabled,onChange:o=>{G(e,o)}}),a.addCheckbox("Show Sample Points",{binding:()=>e.params.buoyancy.ship.showSamplePoints,onChange:o=>{e.params.buoyancy.ship.showSamplePoints=o,e.params.buoyancy.buoy.showSamplePoints=o,e.app.buoyancyDebugVisualizer.setEnabled(o)}});const n=a.addFolder("Buoy",{expanded:!1});n.addCheckbox("Multi-Point Sampling",{binding:()=>e.params.buoyancy.buoy.multiPoint,onChange:o=>{e.params.buoyancy.buoy.multiPoint=o;for(const r of e.app.islandBuoyIds)e.water.buoyancy.updateObjectConfig(r,{multiPoint:o})}}),n.addSlider("Height Offset",{min:-5,max:5,step:.1,binding:()=>e.params.buoyancy.buoy.heightOffset,onChange:o=>{e.params.buoyancy.buoy.heightOffset=o,b(e)}}),n.addSlider("Tilt Amount",{min:0,max:1,step:.01,binding:()=>e.params.buoyancy.buoy.tiltAmount,onChange:o=>{e.params.buoyancy.buoy.tiltAmount=o,b(e)}}),n.addSlider("Height Smoothing",{min:0,max:1,step:.01,binding:()=>e.params.buoyancy.buoy.heightSmoothing,onChange:o=>{e.params.buoyancy.buoy.heightSmoothing=o,b(e)}}),n.addSlider("Tilt Smoothing",{min:0,max:1,step:.01,binding:()=>e.params.buoyancy.buoy.tiltSmoothing,onChange:o=>{e.params.buoyancy.buoy.tiltSmoothing=o,b(e)}});const s=a.addFolder("Ship",{expanded:!1});return s.addCheckbox("Multi-Point Sampling",{binding:()=>e.params.buoyancy.ship.multiPoint,onChange:o=>{e.params.buoyancy.ship.multiPoint=o;const r=e.app.shipBuoyancyId;r>=0&&e.water.buoyancy.updateObjectConfig(r,{multiPoint:o})}}),s.addSlider("Height Offset",{min:-10,max:10,step:.1,binding:()=>e.params.buoyancy.ship.heightOffset,onChange:o=>{e.params.buoyancy.ship.heightOffset=o,g(e)}}),s.addSlider("Tilt Amount",{min:0,max:1,step:.01,binding:()=>e.params.buoyancy.ship.tiltAmount,onChange:o=>{e.params.buoyancy.ship.tiltAmount=o,g(e)}}),s.addSlider("Height Smoothing",{min:0,max:1,step:.01,binding:()=>e.params.buoyancy.ship.heightSmoothing,onChange:o=>{e.params.buoyancy.ship.heightSmoothing=o,g(e)}}),s.addSlider("Tilt Smoothing",{min:.02,max:2,step:.01,binding:()=>e.params.buoyancy.ship.tiltSmoothing,onChange:o=>{e.params.buoyancy.ship.tiltSmoothing=o,g(e)}}),a}function J(e,t){const a=t.addFolder("Colors",{expanded:!1});return a.addColor("Shallow Color",{object:e.water.color,key:"shallowWaterColor"}),a.addColor("Deep Color",{object:e.water.color,key:"deepWaterColor"}),a.addColor("Transmission Color",{object:e.water.color,key:"transmissionColor"}),a.addSlider("Alpha",{min:0,max:1,step:.05,object:e.water.color,key:"alpha"}),a.addSlider("Color Depth (m)",{min:1,max:200,step:1,object:e.water.color,key:"depthFalloff"}),a}const f=[{label:"Foam 1",value:"foam1.jpg"},{label:"Foam 2",value:"foam2.jpg"},{label:"Foam 3",value:"foam3.jpg"},{label:"Foam 4",value:"foam4.jpg"}];function U(e,t){const a=t.addFolder("Foam",{expanded:!1}),n=a.addFolder("Shoreline",{expanded:!1});n.addCheckbox("Enabled",{object:e.water.foam.shoreline,key:"enabled"}),n.addColor("Color",{object:e.water.foam.shoreline,key:"color"}),n.addSelect("Texture",{object:e.params.foam.shoreline,key:"texture",options:f,onChange:()=>{e.app.setShorelineFoamTexture(e.params.foam.shoreline.texture)}}),n.addSlider("Opacity",{min:0,max:1,step:.05,object:e.water.foam.shoreline,key:"opacity"}),n.addSlider("Size",{min:1,max:500,step:1,object:e.water.foam.shoreline,key:"size"}),n.addSlider("Coverage",{min:0,max:1,step:.01,object:e.water.foam.shoreline,key:"coverage"}),n.addSlider("Range",{min:1,max:200,step:1,object:e.water.foam.shoreline,key:"range"});const s=a.addFolder("Surface",{expanded:!1});s.addCheckbox("Enabled",{object:e.water.foam.surface,key:"enabled"}),s.addColor("Color",{object:e.water.foam.surface,key:"color"}),s.addSelect("Texture",{object:e.params.foam.surface,key:"texture",options:f,onChange:()=>{e.app.setSurfaceFoamTexture(e.params.foam.surface.texture)}}),s.addSlider("Opacity",{min:0,max:1,step:.05,object:e.water.foam.surface,key:"opacity"}),s.addSlider("Size",{min:1,max:500,step:1,object:e.water.foam.surface,key:"size"}),s.addSlider("Coverage",{min:0,max:1,step:.01,object:e.water.foam.surface,key:"coverage"});const o=a.addFolder("Boat Wake",{expanded:!1});o.addCheckbox("Enabled",{object:e.water.wake.foam,key:"enabled"}),o.addColor("Color",{object:e.water.wake.foam,key:"color"}),o.addSelect("Texture",{object:e.params.foam.wake,key:"texture",options:f,onChange:()=>{e.app.setWakeFoamTexture(e.params.foam.wake.texture)}}),o.addSlider("Opacity",{min:0,max:1,step:.05,object:e.water.wake.foam,key:"opacity"}),o.addSlider("Size",{min:1,max:500,step:1,object:e.water.wake.foam,key:"size"}),o.addSlider("Coverage",{min:0,max:1,step:.01,object:e.water.wake.foam,key:"coverage"}),o.addSlider("Stamp Scale",{min:.1,max:5,step:.1,object:e.water.wake,key:"stampScale"}),o.addSlider("Decay Rate",{min:.01,max:.5,step:.01,object:e.water.wake,key:"decayRate"});const r=a.addFolder("Wave Crest",{expanded:!1});r.addCheckbox("Enabled",{object:e.water.foam.waves,key:"enabled"}),r.addColor("Color",{object:e.water.foam.waves,key:"color"}),r.addSelect("Texture",{object:e.params.foam.waves,key:"texture",options:f,onChange:()=>{e.app.setWaveFoamTexture(e.params.foam.waves.texture)}}),r.addSlider("Opacity",{min:0,max:1,step:.05,object:e.water.foam.waves,key:"opacity"}),r.addSlider("Size",{min:1,max:500,step:1,object:e.water.foam.waves,key:"size"}),r.addSlider("Coverage",{min:0,max:1,step:.01,object:e.water.foam.waves,key:"coverage"}),r.addSlider("Peak Intensity",{min:0,max:1,step:.05,object:e.water.foam.waves,key:"peakIntensity"}),r.addSlider("Crest Coverage",{min:0,max:1,step:.05,object:e.water.foam.waves,key:"crestCoverage"}),r.addSlider("Wind Stretch",{min:0,max:2,step:.01,object:e.water.foam.waves,key:"windStretch"}),r.addSlider("Wind Bias",{min:0,max:1,step:.05,object:e.water.foam.waves,key:"windBias"});const i=r.addFolder("Advanced",{expanded:!1});return i.addSlider("Wave Weight",{min:0,max:1,step:.05,object:e.water.foam.waves,key:"waveWeight"}),i.addSlider("Ripple Weight",{min:0,max:1,step:.05,object:e.water.foam.waves,key:"rippleWeight"}),a}function q(e,t){const a=t.addFolder("Geometry",{expanded:!1});function n(){const{baseSize:l,levels:c}=e.params.clipmap;return Array.from({length:c},(m,u)=>l*Math.pow(2,u)).join(", ")+"m"}function s(){const{baseSize:l,levels:c}=e.params.clipmap;return`${(l*Math.pow(2,c-1)).toLocaleString()}m`}const o=a.addDisplay("Level Sizes",{value:n()}),r=a.addDisplay("Total Size",{value:s()});function i(){o.value=n(),r.value=s()}a.addSelect("Mesh Resolution",{binding:()=>e.params.clipmap.segments,options:[{label:"16",value:16},{label:"32",value:32},{label:"64",value:64},{label:"128",value:128},{label:"256",value:256}],onChange:l=>{e.params.clipmap.segments=l,e.water.rebuildGeometry(e.params.clipmap)}});const d=a.addFolder("Advanced",{expanded:!1});return d.addSlider("LOD Levels",{min:1,max:6,step:1,binding:()=>e.params.clipmap.levels,onChange:l=>{e.params.clipmap.levels=l,e.water.rebuildGeometry(e.params.clipmap),i()}}),d.addSlider("Base Size (m)",{min:100,max:1e3,step:100,binding:()=>e.params.clipmap.baseSize,onChange:l=>{e.params.clipmap.baseSize=l,e.water.rebuildGeometry(e.params.clipmap),i()}}),a}function $(e,t){const a=t.addFolder("Reflections",{expanded:!1}),n=a.addFolder("Fresnel",{expanded:!1});n.addSlider("Power",{min:.1,max:10,step:.1,object:e.water.fresnel,key:"power"}),n.addSlider("Normal Strength",{min:0,max:1,step:.01,object:e.water.fresnel,key:"normalStrength"}),n.addSlider("Fade Start (m)",{min:0,max:2e3,step:10,object:e.water.fresnel,key:"fadeStart"}),n.addSlider("Fade Power",{min:.1,max:10,step:.1,object:e.water.fresnel,key:"fadePower"});const s=a.addFolder("Screen-Space Reflections",{expanded:!1});return s.addCheckbox("Enabled",{object:e.water.ssr,key:"enabled"}),s.addSlider("Strength",{min:0,max:1,step:.01,object:e.water.ssr,key:"strength"}),a}function Q(e,t){const a=t.addFolder("Subsurface Scattering",{expanded:!1});return a.addCheckbox("Enabled",{object:e.water.sss,key:"enabled"}),a.addSlider("Intensity",{min:0,max:2,step:.01,object:e.water.sss,key:"intensity"}),a.addSlider("Power",{min:.05,max:3,step:.01,object:e.water.sss,key:"power"}),a}function x(e,t){const a=_(e.params.waves.fft.cascades);if(t<a.length){const n=a[t],s={...n,scale:n.scale/e.params.waves.fft.frequency,amplitudeScale:n.amplitudeScale*e.params.waves.fft.amplitude};e.water.updateCascadeConfig(t,s)}}function C(e){const t=_(e.params.waves.fft.cascades);for(let a=0;a<t.length;a++){const n=t[a],s={...n,scale:n.scale/e.params.waves.fft.frequency,amplitudeScale:n.amplitudeScale*e.params.waves.fft.amplitude};e.water.updateCascadeConfig(a,s)}}function X(e,t){const a=t.addFolder("Waves",{expanded:!1});Y(e,a),K(e,a)}function Y(e,t){t.addSlider("Wind Speed",{min:1,max:50,step:.1,object:e.params.waves.fft,key:"windSpeed",onChange:()=>{e.water.waves.update(e.params.waves.fft)}}),t.addSlider("Wind Direction",{min:0,max:360,step:1,binding:()=>e.params.waves.fft.windDirection*180/Math.PI,onChange:a=>{e.params.waves.fft.windDirection=a*Math.PI/180,e.water.waves.update(e.params.waves.fft)}}),t.addSlider("Choppiness",{min:0,max:3,step:.01,object:e.params.waves.fft,key:"choppiness",onChange:()=>{e.water.waves.update(e.params.waves.fft)}}),t.addSlider("Speed",{min:0,max:10,step:.1,object:e.params.waves.fft,key:"animationSpeed",onChange:()=>{e.water.waves.update(e.params.waves.fft)}}),t.addSlider("Amplitude",{min:0,max:2,step:.01,object:e.params.waves.fft,key:"amplitude",onChange:()=>{e.water.waves.update(e.params.waves.fft),C(e)}}),t.addSlider("Frequency",{min:.1,max:10,step:.01,object:e.params.waves.fft,key:"frequency",onChange:()=>{C(e)}}),t.addSlider("Spread",{min:1,max:25,step:.5,object:e.params.waves.fft,key:"directionalSpreading",onChange:()=>{e.water.waves.update(e.params.waves.fft)}}),t.addSlider("Standing Wave Ratio",{min:0,max:1,step:.01,object:e.params.waves.fft,key:"standingWaveRatio",onChange:()=>{e.water.waves.update(e.params.waves.fft)}}),Z(e,t)}function K(e,t){const a=t.addFolder("Swells",{expanded:!1});a.addSlider("Wavelength",{min:10,max:2e3,step:1,object:e.water.gerstner,key:"wavelength"}),a.addSlider("Amplitude",{min:0,max:10,step:.01,object:e.water.gerstner,key:"amplitude"}),a.addSlider("Wavelength Dispersion",{min:1,max:3,step:.01,object:e.water.gerstner,key:"wavelengthSpread"}),a.addSlider("Direction Dispersion",{min:0,max:2,step:.01,object:e.water.gerstner,key:"directionalSpread"})}function Z(e,t){const a=t.addFolder("Ripples",{expanded:!1});a.addSlider("Scale",{min:100,max:1e3,step:1,object:e.params.waves.fft.cascades.ripples,key:"scale",onChange:()=>{x(e,1)}}),a.addSlider("Amplitude",{min:0,max:1,step:.01,object:e.params.waves.fft.cascades.ripples,key:"amplitudeScale",onChange:()=>{x(e,1)}});const n=t.addFolder("Waves",{expanded:!1});n.addSlider("Scale",{min:100,max:1e4,step:1,object:e.params.waves.fft.cascades.waves,key:"scale",onChange:()=>{x(e,0)}}),n.addSlider("Amplitude",{min:0,max:1,step:.01,object:e.params.waves.fft.cascades.waves,key:"amplitudeScale",onChange:()=>{x(e,0)}})}function ee(e,t){const a=()=>{e.water.floor.updateCausticsConfig(e.params.oceanFloor.caustics)},n=t.addFolder("Caustics",{expanded:!1});n.addCheckbox("Enabled",{object:e.params.oceanFloor.caustics,key:"enabled",onChange:a}),n.addSlider("Intensity",{min:0,max:5,step:.1,object:e.params.oceanFloor.caustics,key:"intensity",onChange:a}),n.addSlider("Depth Attenuation",{min:0,max:2,step:.1,object:e.params.oceanFloor.caustics,key:"depthAttenuation",onChange:a}),n.addSlider("Sample Epsilon",{min:.5,max:10,step:.5,object:e.params.oceanFloor.caustics,key:"sampleEpsilon",onChange:a})}function te(e,t,a){const n=t.addFolder("Clip Plane",{expanded:!1});return n.addSlider("Distance",{min:.1,max:100,step:.1,object:e.water,key:"clipPlaneDistance"}),n}function ae(e,t){const a=()=>{const s=e.params.postProcessing.underwater;e.water.underwater.distortionUniforms.update({enabled:s.distortionEnabled,intensity:s.distortionIntensity,speed:s.distortionSpeed,scale:s.distortionScale})},n=t.addFolder("Distortion",{expanded:!1});n.addCheckbox("Enabled",{object:e.params.postProcessing.underwater,key:"distortionEnabled",onChange:a}),n.addSlider("Intensity",{min:0,max:.1,step:.001,object:e.params.postProcessing.underwater,key:"distortionIntensity",onChange:a}),n.addSlider("Scale",{min:1,max:10,step:.5,object:e.params.postProcessing.underwater,key:"distortionScale",onChange:a}),n.addSlider("Speed",{min:0,max:2,step:.1,object:e.params.postProcessing.underwater,key:"distortionSpeed",onChange:a})}function ne(e,t){const a=t.addFolder("Fog",{expanded:!1}),n=e.water.underwater;a.addSlider("Density",{min:0,max:.01,step:1e-4,object:e.params.postProcessing.underwater,key:"fogDensity",onChange:()=>{n.fogUniforms.density.value=e.params.postProcessing.underwater.fogDensity}})}function se(e,t){const a=t.addFolder("Meniscus",{expanded:!1});return a.addSlider("Highlight Sharpness",{min:1,max:10,step:.1,object:e.water.waterline,key:"highlightSharpness"}),a.addSlider("Highlight Strength",{min:0,max:2,step:.01,object:e.water.waterline,key:"highlightStrength"}),a.addSlider("Normal Strength",{min:0,max:1,step:.01,object:e.water.waterline,key:"normalStrength"}),a.addSlider("Smoothness",{min:0,max:1,step:.01,object:e.water.waterline,key:"smoothness"}),a.addSlider("Thickness",{min:0,max:5,step:.01,object:e.water.waterline,key:"thickness"}),a}function oe(e,t){const a=t.addFolder("Particles",{expanded:!1});a.addCheckbox("Enabled",{binding:()=>e.water.particles.enabled,onChange:n=>{e.params.postProcessing.underwaterParticles.enabled=n,e.water.particles.enabled=n}}),a.addColor("Color",{binding:()=>e.params.postProcessing.underwaterParticles.color,onChange:n=>{e.params.postProcessing.underwaterParticles.color=n,e.water.particles.updateParams({color:n})}}),a.addSlider("Count",{min:0,max:2500,step:10,binding:()=>e.params.postProcessing.underwaterParticles.count,onChange:n=>{e.params.postProcessing.underwaterParticles.count=n,e.water.particles.updateParams({count:n})}}),a.addSlider("Far Distance",{min:100,max:1e3,step:1,binding:()=>e.params.postProcessing.underwaterParticles.farDistance,onChange:n=>{e.params.postProcessing.underwaterParticles.farDistance=n,e.water.particles.updateParams({farDistance:n})}}),a.addSlider("Max Size",{min:.1,max:2,step:.05,binding:()=>e.params.postProcessing.underwaterParticles.maxSize,onChange:n=>{e.params.postProcessing.underwaterParticles.maxSize=n,e.water.particles.updateParams({maxSize:n})}}),a.addSlider("Min Size",{min:.01,max:1,step:.01,binding:()=>e.params.postProcessing.underwaterParticles.minSize,onChange:n=>{e.params.postProcessing.underwaterParticles.minSize=n,e.water.particles.updateParams({minSize:n})}}),a.addSlider("Near Distance",{min:1,max:100,step:1,binding:()=>e.params.postProcessing.underwaterParticles.nearDistance,onChange:n=>{e.params.postProcessing.underwaterParticles.nearDistance=n,e.water.particles.updateParams({nearDistance:n})}}),a.addSlider("Opacity",{min:0,max:1,step:.05,binding:()=>e.params.postProcessing.underwaterParticles.opacity,onChange:n=>{e.params.postProcessing.underwaterParticles.opacity=n,e.water.particles.updateParams({opacity:n})}})}function re(e,t){const a=()=>{const s=e.water.floor,o=e.params.oceanFloor;s.updateDisplacementConfig({blendSoftness:o.blendSoftness,blendThreshold:o.blendThreshold,displacementScale:o.displacementScale,displacementStrength:o.displacementStrength,lacunarity:o.lacunarity,normalScale:o.normalScale,persistence:o.persistence,textureDisplacementStrength:o.textureDisplacementStrength})},n=t.addFolder("Sea Floor",{expanded:!1});n.addSlider("Blend Softness",{min:.05,max:1,step:.05,object:e.params.oceanFloor,key:"blendSoftness",onChange:a}),n.addSlider("Blend Threshold",{min:0,max:1,step:.05,object:e.params.oceanFloor,key:"blendThreshold",onChange:a}),n.addSlider("Lacunarity",{min:1,max:4,step:.1,object:e.params.oceanFloor,key:"lacunarity",onChange:a}),n.addSelect("Mesh Resolution",{object:e.params.oceanFloor,key:"meshResolution",options:[{label:"16",value:16},{label:"32",value:32},{label:"64",value:64},{label:"128",value:128}],onChange:async()=>{await e.water.recreateOceanFloor(e.params.oceanFloor)}}),n.addSlider("Persistence",{min:.1,max:1,step:.05,object:e.params.oceanFloor,key:"persistence",onChange:a}),n.addSlider("Terrain Height",{min:0,max:20,step:.5,object:e.params.oceanFloor,key:"displacementStrength",onChange:a}),n.addSlider("Terrain Scale",{min:50,max:500,step:10,object:e.params.oceanFloor,key:"displacementScale",onChange:a}),n.addSlider("Texture Displacement",{min:0,max:2,step:.05,object:e.params.oceanFloor,key:"textureDisplacementStrength",onChange:a})}function ie(e,t){const a=t.addFolder("Sun Shafts",{expanded:!1});return a.addCheckbox("Enabled",{object:e.water.sunShafts,key:"enabled"}),a.addSlider("Fade In",{min:0,max:1,step:.05,object:e.water.sunShafts,key:"fadeIn"}),a.addSlider("Falloff",{min:.5,max:3,step:.1,object:e.water.sunShafts,key:"falloff"}),a.addSlider("Intensity",{min:0,max:1,step:.05,object:e.water.sunShafts,key:"intensity"}),a.addSlider("Softness",{min:0,max:1,step:.05,object:e.water.sunShafts,key:"softness"}),a}function le(e,t){const a=t.addFolder("Surface Glow",{expanded:!1});a.addColor("Color",{object:e.water.underwaterSurfaceGlow,key:"color"}),a.addCheckbox("Enabled",{object:e.water.underwaterSurfaceGlow,key:"enabled"}),a.addSlider("Focus Power",{min:1,max:100,step:.1,object:e.water.underwaterSurfaceGlow,key:"focusPower"}),a.addSlider("Intensity",{min:0,max:10,step:.01,object:e.water.underwaterSurfaceGlow,key:"intensity"})}function de(e,t){const a=()=>{const s=e.water.floor,o=e.params.oceanFloor;s.updateDisplacementConfig({blendSoftness:o.blendSoftness,blendThreshold:o.blendThreshold,displacementScale:o.displacementScale,displacementStrength:o.displacementStrength,lacunarity:o.lacunarity,normalScale:o.normalScale,persistence:o.persistence,textureDisplacementStrength:o.textureDisplacementStrength})},n=t.addFolder("Terrain",{expanded:!1});n.addSlider("Depth (m)",{min:5,max:100,step:1,object:e.params.oceanFloor,key:"depth",onChange:()=>{e.water.color.waterDepth=e.params.oceanFloor.depth,e.water.floor.setDepth(e.params.oceanFloor.depth),a()}}),n.addCheckbox("Enabled",{object:e.params.oceanFloor,key:"enabled",onChange:()=>{e.water.floor.setVisible(e.params.oceanFloor.enabled),e.params.caustics.enabled=e.params.oceanFloor.enabled}})}const ce=`
.sui-panel,
.sui-panel * {
  box-sizing: border-box;
}

.sui-panel {
  position: fixed;
  background: rgba(26, 26, 26, 0.95);
  border-radius: 6px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  color: #e0e0e0;
  width: 280px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.sui-panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid #333;
  background: rgba(40, 40, 40, 0.5);
  border-radius: 6px 6px 0 0;
}

.sui-panel-title-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.sui-panel-version {
  font-size: 10px;
  font-weight: 400;
  color: #888;
}

.sui-panel-collapse {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
  transition: background 0.15s, color 0.15s;
}

.sui-panel-collapse:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.sui-panel.collapsed .sui-panel-content {
  display: none;
}

.sui-panel.collapsed {
  border-radius: 6px;
}

.sui-folder {
  border-bottom: 1px solid #2a2a2a;
}

.sui-folder:last-child {
  border-bottom: none;
}

.sui-folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.sui-folder-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sui-folder-title {
  font-weight: 500;
}

.sui-chevron {
  font-size: 8px;
  color: #888;
  transition: transform 0.2s;
}

.sui-folder.collapsed .sui-chevron {
  transform: rotate(-90deg);
}

.sui-folder.collapsed .sui-folder-content {
  display: none;
}

.sui-folder.hidden {
  display: none;
}

.sui-folder.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.sui-folder.disabled .sui-folder-header {
  cursor: not-allowed;
}

.sui-folder-content {
  margin-left: 4px;
}

/* Nested folders - level 1 */
.sui-folder .sui-folder {
  border-bottom: none;
  border-left: 2px solid rgba(74, 158, 255, 0.3);
}

.sui-folder .sui-folder > .sui-folder-header {
  background: rgba(255, 255, 255, 0.03);
}

.sui-folder .sui-folder > .sui-folder-header:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sui-folder .sui-folder .sui-folder-title {
  color: #bbb;
}

/* Nested folders - level 2 */
.sui-folder .sui-folder .sui-folder > .sui-folder-header {
  background: rgba(255, 255, 255, 0.05);
}

.sui-folder .sui-folder .sui-folder > .sui-folder-header:hover {
  background: rgba(255, 255, 255, 0.10);
}

.sui-folder .sui-folder .sui-folder .sui-folder-title {
  color: #aaa;
}

.sui-control {
  display: flex;
  align-items: center;
  padding: 4px 8px 4px 12px;
  gap: 8px;
  min-height: 26px;
  border-left: 2px solid rgba(74, 158, 255, 0.3);
}

.sui-control.hidden {
  display: none;
}

.sui-label {
  flex: 0 0 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #bbb;
}

.sui-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

/* Slider */
.sui-slider {
  flex: 1;
  min-width: 0;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #444;
  border-radius: 2px;
  cursor: pointer;
}

.sui-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #4a9eff;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}

.sui-slider::-webkit-slider-thumb:hover {
  background: #6ab0ff;
}

.sui-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #4a9eff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.sui-number-input {
  width: 44px;
  flex-shrink: 0;
  padding: 3px 4px;
  background: #333;
  border: 1px solid #444;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 10px;
  text-align: right;
  -moz-appearance: textfield;
}

.sui-number-input::-webkit-outer-spin-button,
.sui-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.sui-number-input:focus {
  outline: none;
  border-color: #4a9eff;
}

/* Checkbox */
.sui-checkbox-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.sui-checkbox {
  width: 14px;
  height: 14px;
  accent-color: #4a9eff;
  cursor: pointer;
}

/* Color picker */
.sui-color-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sui-color-input {
  width: 32px;
  height: 20px;
  padding: 0;
  border: 1px solid #444;
  border-radius: 3px;
  cursor: pointer;
  background: none;
}

.sui-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.sui-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.sui-color-hex {
  width: 60px;
  padding: 3px 5px;
  background: #333;
  border: 1px solid #444;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 10px;
  font-family: monospace;
}

.sui-color-hex:focus {
  outline: none;
  border-color: #4a9eff;
}

/* Select */
.sui-select {
  flex: 1;
  padding: 4px 6px;
  background: #333;
  border: 1px solid #444;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 11px;
  cursor: pointer;
}

.sui-select:focus {
  outline: none;
  border-color: #4a9eff;
}

/* Button */
.sui-button {
  flex: 1;
  padding: 6px 12px;
  background: #3a3a3a;
  border: 1px solid #444;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}

.sui-button:hover {
  background: #4a4a4a;
}

.sui-button:active {
  background: #333;
}

/* Display (read-only) */
.sui-display {
  flex: 1;
  padding: 3px 5px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 3px;
  color: #999;
  font-size: 10px;
}

/* Separator */
.sui-separator {
  height: 1px;
  background: #333;
  margin: 6px 12px;
}

/* Scrollbar styling */
.sui-panel::-webkit-scrollbar {
  width: 6px;
}

.sui-panel::-webkit-scrollbar-track {
  background: transparent;
}

.sui-panel::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.sui-panel::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* ── Mobile: bottom-sheet panel ── */
@media (max-width: 768px) {
  .sui-panel {
    top: auto !important;
    right: 0 !important;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: 50vh;
    border-radius: 12px 12px 0 0;
    transform: translateY(0);
    transition: transform 0.3s ease-out, max-height 0.3s ease-out;
    -webkit-overflow-scrolling: touch;
  }

  .sui-panel.collapsed {
    max-height: none;
    transform: translateY(calc(100% - 44px));
    border-radius: 12px 12px 0 0;
    overflow: hidden;
  }

  .sui-panel-title {
    padding: 12px 16px;
    font-size: 13px;
    border-radius: 12px 12px 0 0;
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(40, 40, 40, 0.98);
    touch-action: manipulation;
  }

  .sui-panel-title::before {
    content: "";
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 4px;
    background: #555;
    border-radius: 2px;
  }

  .sui-panel-collapse {
    font-size: 12px;
    padding: 4px 10px;
  }

  .sui-folder-header {
    padding: 10px 14px;
    min-height: 44px;
  }

  .sui-control {
    padding: 6px 10px 6px 14px;
    min-height: 44px;
    gap: 10px;
  }

  .sui-slider {
    height: 6px;
  }

  .sui-slider::-webkit-slider-thumb {
    width: 20px;
    height: 20px;
  }

  .sui-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
  }

  .sui-number-input {
    width: 50px;
    padding: 6px;
    font-size: 13px;
  }

  .sui-checkbox {
    width: 20px;
    height: 20px;
  }

  .sui-select {
    padding: 8px 8px;
    font-size: 13px;
  }

  .sui-button {
    padding: 10px 14px;
    font-size: 13px;
  }

  .sui-label {
    font-size: 12px;
  }

  .sui-color-input {
    width: 36px;
    height: 28px;
  }

  .sui-color-hex {
    padding: 6px;
    font-size: 12px;
  }
}
`;let k=!1;function pe(){if(k)return;const e=document.createElement("style");e.textContent=ce,document.head.appendChild(e),k=!0}class j{element;slider;numberInput;_value;_onChange;_silent=!1;_binding;_object;_key;constructor(t,a){this._binding=a.binding,this._object=a.object,this._key=a.key;const n=this._object&&this._key?this._object[this._key]:void 0;this._value=typeof n=="number"&&Number.isFinite(n)?n:a.value??this._binding?.()??a.min,this._onChange=a.onChange;const s=a.step??.01;this.element=document.createElement("div"),this.element.className="sui-control";const o=document.createElement("span");o.className="sui-label",o.textContent=t,o.title=t;const r=document.createElement("div");r.className="sui-input-wrapper",this.slider=document.createElement("input"),this.slider.type="range",this.slider.className="sui-slider",this.slider.min=String(a.min),this.slider.max=String(a.max),this.slider.step=String(s),this.slider.value=String(this._value),this.updateTrackFill(),this.numberInput=document.createElement("input"),this.numberInput.type="number",this.numberInput.className="sui-number-input",this.numberInput.min=String(a.min),this.numberInput.max=String(a.max),this.numberInput.step=String(s),this.numberInput.value=this.formatValue(this._value,s),this.slider.addEventListener("input",()=>{this.handleInput(this.slider.valueAsNumber)}),this.numberInput.addEventListener("change",()=>{let i=this.numberInput.valueAsNumber;isNaN(i)&&(i=a.min),i=Math.max(a.min,Math.min(a.max,i)),this.handleInput(i)}),r.append(this.slider,this.numberInput),this.element.append(o,r)}formatValue(t,a){const n=a<1?Math.ceil(-Math.log10(a)):0;return t.toFixed(n)}handleInput(t){this._value=t,this.slider.value=String(t);const a=parseFloat(this.slider.step);this.numberInput.value=this.formatValue(t,a),this.updateTrackFill(),this._silent||(this._object&&this._key&&(this._object[this._key]=t),this._onChange&&this._onChange(t))}updateTrackFill(){const t=parseFloat(this.slider.min),a=parseFloat(this.slider.max),n=(this._value-t)/(a-t)*100;this.slider.style.background=`linear-gradient(to right, #5a8ab8 ${n}%, #3a3a3a ${n}%)`}get value(){return this._value}set value(t){this.handleInput(t)}setValueSilent(t){this._silent=!0,this.value=t,this._silent=!1}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}refresh(){if(this._object&&this._key){const t=this._object[this._key];typeof t=="number"&&Number.isFinite(t)&&this.setValueSilent(t)}else this._binding&&this.setValueSilent(this._binding())}}class F{element;checkbox;_value;_onChange;_silent=!1;_binding;_object;_key;constructor(t,a){this._binding=a.binding,this._object=a.object,this._key=a.key,this._value=this._object&&this._key?this._object[this._key]:a.value??this._binding?.()??!1,this._onChange=a.onChange,this.element=document.createElement("div"),this.element.className="sui-control";const n=document.createElement("span");n.className="sui-label",n.textContent=t,n.title=t;const s=document.createElement("div");s.className="sui-checkbox-wrapper",this.checkbox=document.createElement("input"),this.checkbox.type="checkbox",this.checkbox.className="sui-checkbox",this.checkbox.checked=this._value,this.checkbox.addEventListener("change",()=>{this.handleInput(this.checkbox.checked)}),s.append(this.checkbox),this.element.append(n,s)}handleInput(t){this._value=t,this.checkbox.checked=t,this._silent||(this._object&&this._key&&(this._object[this._key]=t),this._onChange&&this._onChange(t))}get value(){return this._value}set value(t){this.handleInput(t)}setValueSilent(t){this._silent=!0,this.value=t,this._silent=!1}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}refresh(){this._object&&this._key?this.setValueSilent(this._object[this._key]):this._binding&&this.setValueSilent(this._binding())}}function v(e){return e instanceof N?"#"+e.getHexString():String(e)}class P{element;colorInput;hexInput;_value;_onChange;_silent=!1;_binding;_object;_key;constructor(t,a){this._binding=a.binding,this._object=a.object,this._key=a.key,this._value=this._object&&this._key?v(this._object[this._key]):a.value??this._binding?.()??"#000000",this._onChange=a.onChange,this.element=document.createElement("div"),this.element.className="sui-control";const n=document.createElement("span");n.className="sui-label",n.textContent=t,n.title=t;const s=document.createElement("div");s.className="sui-color-wrapper",this.colorInput=document.createElement("input"),this.colorInput.type="color",this.colorInput.className="sui-color-input",this.colorInput.value=this._value,this.hexInput=document.createElement("input"),this.hexInput.type="text",this.hexInput.className="sui-color-hex",this.hexInput.value=this._value,this.hexInput.maxLength=7,this.colorInput.addEventListener("input",()=>{this.handleInput(this.colorInput.value)}),this.hexInput.addEventListener("change",()=>{let o=this.hexInput.value.trim();o.startsWith("#")||(o="#"+o),/^#[0-9a-fA-F]{6}$/.test(o)?this.handleInput(o.toLowerCase()):this.hexInput.value=this._value}),s.append(this.colorInput,this.hexInput),this.element.append(n,s)}handleInput(t){this._value=t,this.colorInput.value=t,this.hexInput.value=t,this._silent||(this._object&&this._key&&(this._object[this._key]=t),this._onChange&&this._onChange(t))}get value(){return this._value}set value(t){this.handleInput(t)}setValueSilent(t){this._silent=!0,this.value=t,this._silent=!1}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}refresh(){this._object&&this._key?this.setValueSilent(v(this._object[this._key])):this._binding&&this.setValueSilent(this._binding())}}class E{element;select;_value;_onChange;_silent=!1;_dirty=!1;_options;_binding;_object;_key;constructor(t,a){this._binding=a.binding,this._object=a.object,this._key=a.key,this._options=a.options,this._value=this._object&&this._key?this._object[this._key]:a.value??this._binding?.()??this._options[0]?.value??"",this._onChange=a.onChange,this.element=document.createElement("div"),this.element.className="sui-control";const n=document.createElement("span");n.className="sui-label",n.textContent=t,n.title=t;const s=document.createElement("div");s.className="sui-input-wrapper",this.select=document.createElement("select"),this.select.className="sui-select";for(const o of a.options){const r=document.createElement("option");r.value=String(o.value),r.textContent=o.label,o.value===this._value&&(r.selected=!0),this.select.appendChild(r)}this.select.addEventListener("change",()=>{const o=this._options.find(r=>String(r.value)===this.select.value);o&&this.handleInput(o.value)}),s.append(this.select),this.element.append(n,s)}handleInput(t){this._value=t,this.select.value=String(t),this._silent||(this._object&&this._key&&(this._object[this._key]=t),this._onChange&&this._onChange(t))}get value(){return this._value}set value(t){this.handleInput(t)}setValueSilent(t){this._silent=!0,this.value=t,this._silent=!1}markDirty(){if(this._dirty)return;this._dirty=!0;const t=this.select.options[this.select.selectedIndex];t&&(t.textContent=t.textContent+" *")}clearDirty(){if(this._dirty){this._dirty=!1;for(const t of this.select.options)t.textContent?.endsWith(" *")&&(t.textContent=t.textContent.slice(0,-2))}}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}refresh(){this._object&&this._key?this.setValueSilent(this._object[this._key]):this._binding&&this.setValueSilent(this._binding())}}class I{element;button;constructor(t,a={}){this.element=document.createElement("div"),this.element.className="sui-control",this.button=document.createElement("button"),this.button.className="sui-button",this.button.textContent=t,a.onClick&&this.button.addEventListener("click",a.onClick),this.element.append(this.button)}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}}class z{element;display;_value;constructor(t,a){this._value=a.value,this.element=document.createElement("div"),this.element.className="sui-control";const n=document.createElement("span");n.className="sui-label",n.textContent=t,n.title=t;const s=document.createElement("div");s.className="sui-input-wrapper",this.display=document.createElement("span"),this.display.className="sui-display",this.display.textContent=this._value,s.append(this.display),this.element.append(n,s)}get value(){return this._value}set value(t){this._value=t,this.display.textContent=t}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}}class D{element;constructor(){this.element=document.createElement("div"),this.element.className="sui-separator"}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}}class w{element;content;chevron;_expanded;children=[];_onControlChange;constructor(t,a={}){this._expanded=a.expanded??!0,this._onControlChange=a.onControlChange,this.element=document.createElement("div"),this.element.className="sui-folder",this._expanded||this.element.classList.add("collapsed");const n=document.createElement("div");n.className="sui-folder-header";const s=document.createElement("span");s.className="sui-folder-title",s.textContent=t,this.chevron=document.createElement("span"),this.chevron.className="sui-chevron",this.chevron.textContent="▼",n.append(s,this.chevron),n.addEventListener("click",()=>this.toggle()),this.content=document.createElement("div"),this.content.className="sui-folder-content",this.element.append(n,this.content)}toggle(){this._expanded=!this._expanded,this.element.classList.toggle("collapsed",!this._expanded)}get expanded(){return this._expanded}set expanded(t){this._expanded=t,this.element.classList.toggle("collapsed",!t)}get hidden(){return this.element.classList.contains("hidden")}set hidden(t){this.element.classList.toggle("hidden",t)}get disabled(){return this.element.classList.contains("disabled")}set disabled(t){this.element.classList.toggle("disabled",t)}addFolder(t,a){const n=new w(t,{...a,onControlChange:a?.onControlChange??this._onControlChange});return this.content.appendChild(n.element),this.children.push(n),n}addSlider(t,a){const n=a.onChange,s=this._onControlChange,o=new j(t,{...a,onChange:n?r=>{n(r),s?.()}:s?()=>s():void 0});return this.content.appendChild(o.element),this.children.push(o),o}addCheckbox(t,a){const n=a.onChange,s=this._onControlChange,o=new F(t,{...a,onChange:n?r=>{n(r),s?.()}:s?()=>s():void 0});return this.content.appendChild(o.element),this.children.push(o),o}addColor(t,a){const n=a.onChange,s=this._onControlChange,o=new P(t,{...a,onChange:n?r=>{n(r),s?.()}:s?()=>s():void 0});return this.content.appendChild(o.element),this.children.push(o),o}addSelect(t,a){const n=a.onChange,s=this._onControlChange,o=new E(t,{...a,onChange:n?r=>{n(r),s?.()}:s?()=>s():void 0});return this.content.appendChild(o.element),this.children.push(o),o}addButton(t,a){const n=new I(t,a);return this.content.appendChild(n.element),n}addDisplay(t,a){const n=new z(t,a);return this.content.appendChild(n.element),n}addSeparator(){const t=new D;return this.content.appendChild(t.element),t}refresh(){for(const t of this.children)t.refresh()}}class he{element;content;children=[];constructor(t={}){pe(),this.element=document.createElement("div"),this.element.className="sui-panel";const a=t.position??{top:10,right:10};if(a.top!==void 0&&(this.element.style.top=`${a.top}px`),a.right!==void 0&&(this.element.style.right=`${a.right}px`),a.bottom!==void 0&&(this.element.style.bottom=`${a.bottom}px`),a.left!==void 0&&(this.element.style.left=`${a.left}px`),t.title){const s=document.createElement("div");s.className="sui-panel-title";const o=document.createElement("div");o.className="sui-panel-title-text";const r=document.createElement("span");if(r.textContent=t.title,o.appendChild(r),t.version){const l=document.createElement("span");l.className="sui-panel-version",l.textContent=`v${t.version}`,o.appendChild(l)}s.appendChild(o);const i=document.createElement("button");i.className="sui-panel-collapse",i.textContent="▼";const d=()=>{const l=this.element.classList.toggle("collapsed");i.textContent=l?"▶":"▼"};s.style.cursor="pointer",s.addEventListener("click",d),this.element.appendChild(s)}this.content=document.createElement("div"),this.content.className="sui-panel-content",this.element.appendChild(this.content),(t.container??document.body).appendChild(this.element)}addFolder(t,a){const n=new w(t,a);return this.content.appendChild(n.element),this.children.push(n),n}addSlider(t,a){const n=new j(t,a);return this.content.appendChild(n.element),this.children.push(n),n}addCheckbox(t,a){const n=new F(t,a);return this.content.appendChild(n.element),this.children.push(n),n}addColor(t,a){const n=new P(t,a);return this.content.appendChild(n.element),this.children.push(n),n}addSelect(t,a){const n=new E(t,a);return this.content.appendChild(n.element),this.children.push(n),n}addButton(t,a){const n=new I(t,a);return this.content.appendChild(n.element),n}addDisplay(t,a){const n=new z(t,a);return this.content.appendChild(n.element),n}addSeparator(){const t=new D;return this.content.appendChild(t.element),t}refresh(){for(const t of this.children)t.refresh()}dispose(){this.element.remove()}}function h(e){return"#"+e.getHexString()}function S(e){const t=e.water,a=e.params,n=e.shipController,s=e.app.models.boatVisual,o=e.app.models.heartGlow;return{caustics:JSON.parse(JSON.stringify(a.caustics)),clipmap:JSON.parse(JSON.stringify(a.clipmap)),color:{alpha:t.color.alpha,deepWaterColor:h(t.color.deepWaterColor),depthFalloff:t.color.depthFalloff,shallowWaterColor:h(t.color.shallowWaterColor),transmissionColor:h(t.color.transmissionColor)},foam:{surface:{enabled:t.foam.surface.enabled,opacity:t.foam.surface.opacity,color:h(t.foam.surface.color),size:t.foam.surface.size,coverage:t.foam.surface.coverage,texture:a.foam.surface.texture},waves:{enabled:t.foam.waves.enabled,opacity:t.foam.waves.opacity,color:h(t.foam.waves.color),size:t.foam.waves.size,coverage:t.foam.waves.coverage,peakIntensity:t.foam.waves.peakIntensity,windStretch:t.foam.waves.windStretch,crestCoverage:t.foam.waves.crestCoverage,windBias:t.foam.waves.windBias,waveWeight:t.foam.waves.waveWeight,rippleWeight:t.foam.waves.rippleWeight,texture:a.foam.waves.texture},shoreline:{enabled:t.foam.shoreline.enabled,opacity:t.foam.shoreline.opacity,size:t.foam.shoreline.size,coverage:t.foam.shoreline.coverage,range:t.foam.shoreline.range,color:h(t.foam.shoreline.color),texture:a.foam.shoreline.texture},wake:{enabled:t.wake.foam.enabled,decayRate:t.wake.decayRate,opacity:t.wake.foam.opacity,color:h(t.wake.foam.color),size:t.wake.foam.size,coverage:t.wake.foam.coverage,stampScale:t.wake.stampScale,texture:a.foam.wake.texture}},fog:{enabled:t.fog.enabled,fadePower:t.fog.fadePower,fadeStart:t.fog.fadeStart},fresnel:{surface:{power:t.fresnel.power,normalStrength:t.fresnel.normalStrength,fadeStart:t.fresnel.fadeStart,fadePower:t.fresnel.fadePower},underwater:JSON.parse(JSON.stringify(a.fresnel.underwater))},oceanFloor:JSON.parse(JSON.stringify(a.oceanFloor)),postProcessing:JSON.parse(JSON.stringify(a.postProcessing)),sky:JSON.parse(JSON.stringify(a.sky)),sparkle:{enabled:t.sparkle.enabled,fadeDistance:t.sparkle.fadeDistance,intensity:t.sparkle.intensity,minDistance:t.sparkle.minDistance,power:t.sparkle.power},ssr:{enabled:t.ssr.enabled,strength:t.ssr.strength},sss:{enabled:t.sss.enabled,intensity:t.sss.intensity,power:t.sss.power},waves:{fft:JSON.parse(JSON.stringify(a.waves.fft)),gerstner:{wavelength:t.gerstner.wavelength,amplitude:t.gerstner.amplitude,wavelengthSpread:t.gerstner.wavelengthSpread,directionalSpread:t.gerstner.directionalSpread}},demo:{boat:{drag:n.drag,maxSpeed:n.maxSpeed,reverseMaxSpeed:n.reverseMaxSpeed,rudderRate:n.rudderRate,rudderReturn:n.rudderReturn,throttleRate:n.throttleRate,thrust:n.thrust,turnRate:n.turnRate},boatVisual:{glowColor:h(s.emissiveColor.value),glowIntensity:s.emissiveIntensity.value,lineColor:h(s.lineMaterial.color),lineThickness:s.lineMaterial.linewidth},boatSize:a.demo.boatSize,bloodRain:JSON.parse(JSON.stringify(a.demo.bloodRain)),heartVisual:{fillColor:h(o.fillColor.value),emissiveColor:h(o.emissiveColor.value),glowIntensity:o.emissiveIntensity.value,lineColor:h(o.lineMaterial.color),lineThickness:o.lineMaterial.linewidth}}}}function ge(e,t){const a=new he({title:t??"Three.js Water Pro",version:"2.1.2",container:document.body,position:{top:10,right:10}}),n=a.addSelect("Preset",{value:"choppy",options:[{label:"Arctic",value:"arctic"},{label:"Choppy",value:"choppy"},{label:"Foggy",value:"foggy"},{label:"Hurricane",value:"hurricane"},{label:"Moonlit",value:"moonlit"},{label:"Sea of Thieves",value:"seaOfThieves"},{label:"Storm",value:"storm"},{label:"Sunset",value:"sunset"},{label:"Tranquil",value:"tranquil"},{label:"Tropical",value:"tropical"}],onChange:async c=>{n.clearDirty(),await e.applyPreset(c),a.refresh()}}),s=a.addSelect("Quality",{value:e.performanceParams.quality,options:[{label:"Low",value:"low"},{label:"Medium",value:"medium"},{label:"High",value:"high"},{label:"Ultra",value:"ultra"}],onChange:async c=>{s.clearDirty(),e.performanceParams.quality=c,await e.updateQualityLevel(),a.refresh()}});a.addSeparator();const o=()=>{n.markDirty(),s.markDirty()},r=a.addFolder("Sky",{expanded:!1,onControlChange:o});R(e,r);const i=a.addFolder("Surface",{expanded:!0,onControlChange:o});H(e,i),J(e,i),U(e,i),q(e,i),$(e,i),Q(e,i),X(e,i);const d=a.addFolder("Underwater",{expanded:!0,onControlChange:o});d.addCheckbox("Enabled",{object:e.water.underwater,key:"enabled",onChange:c=>{const p=c;e.app.setFishVisible(p),e.app.setGrassVisible(p),e.app.setRocksVisible(p),e.app.setSeaweedVisible(p)}}),ee(e,d),te(e,d,e.isWebGL),ae(e,d),ne(e,d),se(e,d),oe(e,d),re(e,d),ie(e,d),le(e,d),de(e,d);const l=a.addFolder("Demo",{expanded:!0});return L(e,l),O(e,l),M(e,l),V(e,l),B(e,l),W(e,l),A(e,l),T(e,l),a.addSeparator(),a.addButton("Save Settings",{onClick:()=>{const c=S(e);e.app.saveSettings(c)}}),a.addButton("Print Settings to Console",{onClick:()=>{const c=S(e),p=JSON.stringify(c,null,2);console.log("=== ART SCENE SETTINGS ==="),console.log(p),console.log("=============================")}}),a.addButton("Download Settings",{onClick:()=>{const c=S(e),p=JSON.stringify(c,null,2),m=new Blob([p],{type:"application/json"}),u=URL.createObjectURL(m),y=document.createElement("a");y.href=u,y.download="art-scene-settings.json",y.click(),URL.revokeObjectURL(u)}}),a}export{ge as createUI};
