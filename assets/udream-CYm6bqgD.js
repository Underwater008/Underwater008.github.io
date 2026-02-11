import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{a9 as J,h as S,ap as _e,aq as ne,ar as $,a4 as B,am as Ee,aa as le,V as K,as as ce,at as W,al as ze,au as I,av as N,g as Ae,aw as Me,w as fe,H as Ue,ai as Le,J as Be,aj as Ce,ax as De,M as Te,ay as ue,an as Pe}from"./three.module-aEEDt9MZ.js";import{g as j}from"./index-DjKJqAo0.js";const ie=new J,T=new S;class pe extends _e{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],i=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(i),this.setAttribute("position",new ne(e,3)),this.setAttribute("uv",new ne(n,2))}applyMatrix4(e){const n=this.attributes.instanceStart,i=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(e),i.applyMatrix4(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const i=new $(n,6,1);return this.setAttribute("instanceStart",new B(i,3,0)),this.setAttribute("instanceEnd",new B(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const i=new $(n,6,1);return this.setAttribute("instanceColorStart",new B(i,3,0)),this.setAttribute("instanceColorEnd",new B(i,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new Ee(e.geometry)),this}fromLineSegments(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new J);const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;e!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(e),ie.setFromBufferAttribute(n),this.boundingBox.union(ie))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new le),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(e!==void 0&&n!==void 0){const i=this.boundingSphere.center;this.boundingBox.getCenter(i);let t=0;for(let r=0,a=e.count;r<a;r++)T.fromBufferAttribute(e,r),t=Math.max(t,i.distanceToSquared(T)),T.fromBufferAttribute(n,r),t=Math.max(t,i.distanceToSquared(T));this.boundingSphere.radius=Math.sqrt(t),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}W.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new K(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};I.line={uniforms:ce.merge([W.common,W.fog,W.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			float alpha = opacity;

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};class Q extends ze{constructor(e){super({type:"LineMaterial",uniforms:ce.clone(I.line.uniforms),vertexShader:I.line.vertexShader,fragmentShader:I.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}const se=new S,oe=new S,l=new N,c=new N,g=new N,V=new S,k=new Ae,f=new Me,re=new S,P=new J,O=new le,w=new N;let y,U;function ae(s,e,n){return w.set(0,0,-e,1).applyMatrix4(s.projectionMatrix),w.multiplyScalar(1/w.w),w.x=U/n.width,w.y=U/n.height,w.applyMatrix4(s.projectionMatrixInverse),w.multiplyScalar(1/w.w),Math.abs(Math.max(w.x,w.y))}function Oe(s,e){const n=s.matrixWorld,i=s.geometry,t=i.attributes.instanceStart,r=i.attributes.instanceEnd,a=Math.min(i.instanceCount,t.count);for(let o=0,d=a;o<d;o++){f.start.fromBufferAttribute(t,o),f.end.fromBufferAttribute(r,o),f.applyMatrix4(n);const p=new S,u=new S;y.distanceSqToSegment(f.start,f.end,u,p),u.distanceTo(p)<U*.5&&e.push({point:u,pointOnLine:p,distance:y.origin.distanceTo(u),object:s,face:null,faceIndex:o,uv:null,uv1:null})}}function We(s,e,n){const i=e.projectionMatrix,r=s.material.resolution,a=s.matrixWorld,o=s.geometry,d=o.attributes.instanceStart,p=o.attributes.instanceEnd,u=Math.min(o.instanceCount,d.count),h=-e.near;y.at(1,g),g.w=1,g.applyMatrix4(e.matrixWorldInverse),g.applyMatrix4(i),g.multiplyScalar(1/g.w),g.x*=r.x/2,g.y*=r.y/2,g.z=0,V.copy(g),k.multiplyMatrices(e.matrixWorldInverse,a);for(let E=0,xe=u;E<xe;E++){if(l.fromBufferAttribute(d,E),c.fromBufferAttribute(p,E),l.w=1,c.w=1,l.applyMatrix4(k),c.applyMatrix4(k),l.z>h&&c.z>h)continue;if(l.z>h){const L=l.z-c.z,z=(l.z-h)/L;l.lerp(c,z)}else if(c.z>h){const L=c.z-l.z,z=(c.z-h)/L;c.lerp(l,z)}l.applyMatrix4(i),c.applyMatrix4(i),l.multiplyScalar(1/l.w),c.multiplyScalar(1/c.w),l.x*=r.x/2,l.y*=r.y/2,c.x*=r.x/2,c.y*=r.y/2,f.start.copy(l),f.start.z=0,f.end.copy(c),f.end.z=0;const ee=f.closestPointToPointParameter(V,!0);f.at(ee,re);const te=Ue.lerp(l.z,c.z,ee),Se=te>=-1&&te<=1,be=V.distanceTo(re)<U*.5;if(Se&&be){f.start.fromBufferAttribute(d,E),f.end.fromBufferAttribute(p,E),f.start.applyMatrix4(a),f.end.applyMatrix4(a);const L=new S,z=new S;y.distanceSqToSegment(f.start,f.end,z,L),n.push({point:z,pointOnLine:L,distance:y.origin.distanceTo(z),object:s,face:null,faceIndex:E,uv:null,uv1:null})}}}class Ie extends fe{constructor(e=new pe,n=new Q({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,i=e.attributes.instanceEnd,t=new Float32Array(2*n.count);for(let a=0,o=0,d=n.count;a<d;a++,o+=2)se.fromBufferAttribute(n,a),oe.fromBufferAttribute(i,a),t[o]=o===0?0:t[o-1],t[o+1]=t[o]+se.distanceTo(oe);const r=new $(t,2,1);return e.setAttribute("instanceDistanceStart",new B(r,1,0)),e.setAttribute("instanceDistanceEnd",new B(r,1,1)),this}raycast(e,n){const i=this.material.worldUnits,t=e.camera;t===null&&!i&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const r=e.params.Line2!==void 0&&e.params.Line2.threshold||0;y=e.ray;const a=this.matrixWorld,o=this.geometry,d=this.material;U=d.linewidth+r,o.boundingSphere===null&&o.computeBoundingSphere(),O.copy(o.boundingSphere).applyMatrix4(a);let p;if(i)p=U*.5;else{const h=Math.max(t.near,O.distanceToPoint(y.origin));p=ae(t,h,d.resolution)}if(O.radius+=p,y.intersectsSphere(O)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),P.copy(o.boundingBox).applyMatrix4(a);let u;if(i)u=U*.5;else{const h=Math.max(t.near,P.distanceToPoint(y.origin));u=ae(t,h,d.resolution)}P.expandByScalar(u),y.intersectsBox(P)!==!1&&(i?Oe(this,n):We(this,t,n))}}class he extends pe{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const n=e.length-3,i=new Float32Array(2*n);for(let t=0;t<n;t+=3)i[2*t]=e[t],i[2*t+1]=e[t+1],i[2*t+2]=e[t+2],i[2*t+3]=e[t+3],i[2*t+4]=e[t+4],i[2*t+5]=e[t+5];return super.setPositions(i),this}setColors(e){const n=e.length-3,i=new Float32Array(2*n);for(let t=0;t<n;t+=3)i[2*t]=e[t],i[2*t+1]=e[t+1],i[2*t+2]=e[t+2],i[2*t+3]=e[t+3],i[2*t+4]=e[t+4],i[2*t+5]=e[t+5];return super.setColors(i),this}fromLine(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}}class je extends Ie{constructor(e=new he,n=new Q({color:Math.random()*16777215})){super(e,n),this.isLine2=!0,this.type="Line2"}}const Z=new Le;let A=window.innerWidth,m=window.innerHeight,M=A/m;const v=m,b=new Be(v*M/-2,v*M/2,v/2,v/-2,-1e3,1e3);b.position.z=1;const D=new Ce({antialias:!0});D.setSize(A,m);D.setClearColor(16777215,1);document.body.appendChild(D.domElement);const x=document.getElementById("background-video"),He=new De(x),Ge=new Te({map:He}),Re=new ue(v*M,v),H=new fe(Re,Ge);H.position.z=-1;Z.add(H);function me(){const s=document.createElement("canvas"),e=s.getContext("2d");s.width=x.videoWidth,s.height=x.videoHeight;function n(){e.drawImage(x,0,0,s.width,s.height);const t=e.getImageData(0,0,s.width,s.height).data;let r=null;for(let a=0;a<s.height;a++){for(let o=0;o<s.width;o++){const d=(a*s.width+o)*4,p=t[d],u=t[d+1],h=t[d+2];if(p<10&&u<10&&h<10){if(r={x:o,y:a},r.x===0)return;r.x===923&&(r.x+=1);break}}if(r)break}if(r){const{x:a,y:o}=r,d=a/s.width*2-1,p=-(o/s.height)*2+1,u=new S(d,p,0).unproject(b);_.position.x=u.x,console.log(`Black pixel found at (${a}, ${o}), positioned at (${u.x}, ${u.y}) in world coordinates`)}else console.log("No black pixel found")}x.addEventListener("timeupdate",n),x.addEventListener("seeked",n),n()}x.addEventListener("loadeddata",()=>{x.currentTime=1.7,me()});const ve=new Q({color:0,linewidth:4,resolution:new K(A,m)}),G=[],R=100;let X=m/(2*R)*1.5,Y=m/1.5;for(let s=0;s<=R;s++)G.push(0,Y-s*X,0);const F=new he;F.setPositions(G);const _=new je(F,ve);Z.add(_);const de=new Pe,q=new K;let C=!1,ge=!1;function we(){!C&&!ge&&j.to(_.position,{y:"-=80",yoyo:!0,repeat:-1,ease:"sine.inOut",duration:3})}we();function Fe(){j.killTweensOf(_.position),j.to(_.position,{y:0,duration:.5})}function Ne(){j.to(_.position,{y:m,duration:2,onComplete:function(){_.visible=!1}})}document.addEventListener("mousemove",s=>{const e=D.domElement.getBoundingClientRect();q.x=(s.clientX-e.left)/e.width*2-1,q.y=-(s.clientY-e.top)/e.height*2+1,de.setFromCamera(q,b),de.intersectObject(_).length>0?C||(C=!0,document.body.style.cursor="pointer",Fe()):C&&(C=!1,document.body.style.cursor="default",we())});document.addEventListener("click",s=>{C&&(ge=!0,Ne(),x.play(),x.muted=!1)});window.addEventListener("resize",()=>{A=window.innerWidth,m=window.innerHeight,M=A/m,b.left=v*M/-2,b.right=v*M/2,b.top=v/2,b.bottom=v/-2,b.updateProjectionMatrix(),D.setSize(A,m),H.geometry.dispose(),H.geometry=new ue(v*M,v),ve.resolution.set(A,m),X=m/(2*R),Y=m/1.5;for(let s=0;s<=R;s++)G[3*s+1]=Y-s*X;F.setPositions(G),F.attributes.position.needsUpdate=!0,me()});function ye(){requestAnimationFrame(ye),D.render(Z,b)}ye();
