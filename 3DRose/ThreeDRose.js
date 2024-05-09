import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {ImprovedNoise} from "three/examples/jsm/math/ImprovedNoise.js";
import { GUI } from 'dat.gui';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Camera setup
const camScale = 0.5;  // Smaller scale for a closer view
const aspectRatio = window.innerWidth / window.innerHeight;
const frustumSize = 10;  // Adjust this value as needed for your scene size

const left = frustumSize * aspectRatio / -2 * camScale;
const right = frustumSize * aspectRatio / 2 * camScale;
const top = frustumSize / 2 * camScale;
const bottom = frustumSize / -2 * camScale;
const near = 0.1;  // Closer near clipping plane
const far = 2000;  // Sufficiently distant far clipping plane

const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
camera.position.set(0, 0, 500);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('threeDScene').appendChild(renderer.domElement);

// Create cubes
const particlesCount = 27; // 3*3*3
const cubeSize = 4;
const step = Math.cbrt(particlesCount);
const gridSpacing = cubeSize / step;
const cubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
cubeGeometry.center();
// const originalMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//const hoverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const materialTop = new THREE.MeshBasicMaterial({ color: 0xdcdcdc }); // White gray
const materialMiddle = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue
const materialBottom = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black

// Groups for different layers
const groupTop = new THREE.Group();
const groupMiddle = new THREE.Group();
const groupBottom = new THREE.Group();

// Add groups to the scene
scene.add(groupTop);
scene.add(groupMiddle);
scene.add(groupBottom);

// Cube creation and grouping
const cubes = []; // Array to hold all cubes for potential individual manipulation
const halfStep = (step - 1) / 2;
for (let x = 0; x < step; x++) {
    for (let y = 0; y < step; y++) {
        for (let z = 0; z < step; z++) {
            let material;
            let group;

            if (y === 2) { // Top layer
                material = materialTop;
                group = groupTop;
            } else if (y === 1) { // Middle layer
                material = materialMiddle;
                group = groupMiddle;
            } else { // Bottom layer
                material = materialBottom;
                group = groupBottom;
            }

            const cube = new THREE.Mesh(cubeGeometry, material);
            cube.position.set(
                (x - halfStep) * gridSpacing,
                (y - halfStep) * gridSpacing,
                (z - halfStep) * gridSpacing
            );
            cube.targetScale = 1;  // Target scale for smooth transition
            group.add(cube); // Add cube to the appropriate group
            cubes.push(cube); // Add cube to the array for potential individual manipulation
        }
    }
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.1;

const raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
const mouse = new THREE.Vector2();
let hitPoint = new THREE.Vector3();
let hasHit = false; // Flag to check if there was a hit

window.addEventListener('mousemove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        hitPoint.copy(intersects[0].point);
        hasHit = true;
    } else {
        hasHit = false;
    }
});

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = camera.top - camera.bottom; // Retain the original frustum height

    // Adjust frustum dimensions to maintain the same scale
    camera.left = -frustumHeight * aspect / 2;
    camera.right = frustumHeight * aspect / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();

function init() {

    // Texture
    const size = 128;
    const data = new Uint8Array( size * size * size );

    let i = 0;
    const scale = 0.05;
    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();

    for ( let z = 0; z < size; z ++ ) {

        for ( let y = 0; y < size; y ++ ) {

            for ( let x = 0; x < size; x ++ ) {

                const d = 1.0 - vector.set( x, y, z ).subScalar( size / 2 ).divideScalar( size ).length();
                data[ i ] = ( 128 + 128 * perlin.noise( x * scale / 1.5, y * scale, z * scale / 1.5 ) ) * d * d;
                i ++;

            }

        }

    }

    const texture = new THREE.Data3DTexture( data, size, size, size );
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    // Material

    const vertexShader = /* glsl */`
					in vec3 position;

					uniform mat4 modelMatrix;
					uniform mat4 modelViewMatrix;
					uniform mat4 projectionMatrix;
					uniform vec3 cameraPos;

					out vec3 vOrigin;
					out vec3 vDirection;

					void main() {
						vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

						vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
						vDirection = position - vOrigin;

						gl_Position = projectionMatrix * mvPosition;
					}
				`;

    const fragmentShader = /* glsl */`
					precision highp float;
					precision highp sampler3D;

					uniform mat4 modelViewMatrix;
					uniform mat4 projectionMatrix;

					in vec3 vOrigin;
					in vec3 vDirection;

					out vec4 color;

					uniform vec3 base;
					uniform sampler3D map;

					uniform float threshold;
					uniform float range;
					uniform float opacity;
					uniform float steps;
					uniform float frame;

					uint wang_hash(uint seed)
					{
							seed = (seed ^ 61u) ^ (seed >> 16u);
							seed *= 9u;
							seed = seed ^ (seed >> 4u);
							seed *= 0x27d4eb2du;
							seed = seed ^ (seed >> 15u);
							return seed;
					}

					float randomFloat(inout uint seed)
					{
							return float(wang_hash(seed)) / 4294967296.;
					}

					vec2 hitBox( vec3 orig, vec3 dir ) {
						const vec3 box_min = vec3( - 0.5 );
						const vec3 box_max = vec3( 0.5 );
						vec3 inv_dir = 1.0 / dir;
						vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
						vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
						vec3 tmin = min( tmin_tmp, tmax_tmp );
						vec3 tmax = max( tmin_tmp, tmax_tmp );
						float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
						float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
						return vec2( t0, t1 );
					}

					float sample1( vec3 p ) {
						return texture( map, p ).r;
					}

					float shading( vec3 coord ) {
						float step = 0.01;
						return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
					}

					vec4 linearToSRGB( in vec4 value ) {
						return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
					}

					void main(){
						vec3 rayDir = normalize( vDirection );
						vec2 bounds = hitBox( vOrigin, rayDir );

						if ( bounds.x > bounds.y ) discard;

						bounds.x = max( bounds.x, 0.0 );

						vec3 p = vOrigin + bounds.x * rayDir;
						vec3 inc = 1.0 / abs( rayDir );
						float delta = min( inc.x, min( inc.y, inc.z ) );
						delta /= steps;

						// Jitter

						// Nice little seed from
						// https://blog.demofox.org/2020/05/25/casual-shadertoy-path-tracing-1-basic-camera-diffuse-emissive/
						uint seed = uint( gl_FragCoord.x ) * uint( 1973 ) + uint( gl_FragCoord.y ) * uint( 9277 ) + uint( frame ) * uint( 26699 );
						vec3 size = vec3( textureSize( map, 0 ) );
						float randNum = randomFloat( seed ) * 2.0 - 1.0;
						p += rayDir * randNum * ( 1.0 / size );

						//

						vec4 ac = vec4( base, 0.0 );

						for ( float t = bounds.x; t < bounds.y; t += delta ) {

							float d = sample1( p + 0.5 );

							d = smoothstep( threshold - range, threshold + range, d ) * opacity;

							float col = shading( p + 0.5 ) * 3.0 + ( ( p.x + p.y ) * 0.25 ) + 0.2;

							ac.rgb += ( 1.0 - ac.a ) * d * col;

							ac.a += ( 1.0 - ac.a ) * d;

							if ( ac.a >= 0.95 ) break;

							p += rayDir * delta;

						}

						color = linearToSRGB( ac );

						if ( color.a == 0.0 ) discard;

					}
				`;

    const cloudMaterial = new THREE.RawShaderMaterial( {
        glslVersion: THREE.GLSL3,
        uniforms: {
            base: { value: new THREE.Color( 0x798aa0 ) },
            map: { value: texture },
            cameraPos: { value: new THREE.Vector3() },
            threshold: { value: 0.25 },
            opacity: { value: 0.25 },
            range: { value: 0.1 },
            steps: { value: 100 },
            frame: { value: 0 }
        },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        transparent: true
    } );
    //

    const parameters = {
        threshold: 0.25,
        opacity: 0.25,
        range: 0.1,
        steps: 100
    };

    function update() {

        cloudMaterial.uniforms.threshold.value = parameters.threshold;
        cloudMaterial.uniforms.opacity.value = parameters.opacity;
        cloudMaterial.uniforms.range.value = parameters.range;
        cloudMaterial.uniforms.steps.value = parameters.steps;

    }

    const gui = new GUI();
    gui.add( parameters, 'threshold', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'opacity', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'range', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'steps', 0, 200, 1 ).onChange( update );

    for (let i = 0; i < groupTop.children.length; i++) {
        groupTop.children[i].material = cloudMaterial;
    }

}

function animate() {
    requestAnimationFrame(animate);

    const maxScale = 2; // Maximum scale for the hovered cube
    const influenceRadius = 3; // Radius within which other cubes will be affected
    const falloffRate = 0.5; // Controls the rate at which the scale effect diminishes

    cubes.forEach(cube => {
        if (hasHit) {
            const distance = cube.position.distanceTo(hitPoint);
            if (distance < influenceRadius) {
                // Calculate scale based on distance using an exponential falloff
                const scale = maxScale * Math.exp(-falloffRate * distance);
                cube.targetScale = Math.max(1, scale);
            } else {
                cube.targetScale = 1; // Outside of influence radius, revert to original size
            }
        } else {
            cube.targetScale = 1; // No hit, all cubes revert to original size
        }

        // Smoothly interpolate towards the target scale
        cube.scale.lerp(new THREE.Vector3(cube.targetScale, cube.targetScale, cube.targetScale), 0.1);
    });

    // Update each cube in the topGroup
    groupTop.children.forEach(cube => {
        cube.material.uniforms.cameraPos.value.copy(camera.position);
        cube.rotation.y = -performance.now() / 7500;
        cube.material.uniforms.frame.value++;
    });

    renderer.render(scene, camera);
    controls.update();
}

animate();