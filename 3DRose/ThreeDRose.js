import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {ImprovedNoise} from "three/examples/jsm/math/ImprovedNoise.js";
//import { GUI } from 'dat.gui';
import { gsap } from 'https://cdn.skypack.dev/gsap';
import waterVertexShader from './waterVertex.glsl'
import waterFragmentShader from './waterFragmentShader.glsl'

let isLoaded = false; // Flag to indicate loading completion
let renderer, scene, camera, controls, renderTarget, depthMaterial, clock;
let step, cubeGeometry;
let groupTop, groupMiddle, groupBottom;
let materialTop, materialMiddle, materialBottom;
let cubes = [];

// Camera setup
let camScale = 0.8;  // Smaller scale for a closer view
let aspectRatio = window.innerWidth / window.innerHeight;
let frustumSize = 12;  // Adjust this value as needed for your scene size

let left = frustumSize * aspectRatio / -2 * camScale;
let right = frustumSize * aspectRatio / 2 * camScale;
let top = frustumSize / 2 * camScale;
let bottom = frustumSize / -2 * camScale;
let near = 0.1;  // Closer near clipping plane
let far = 2000;  // Sufficiently distant far clipping plane

let raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
let mouse = new THREE.Vector2();
let mouseMoved = false;
let hitPoint = new THREE.Vector3();
let hasHit = false; // Flag to check if there was a hit

// Initialize the first delay
let initialDelay = 0;

let lastTime = performance.now();
const textureLoader = new THREE.TextureLoader();
const textures = {};

function onLoad(callback) {
    let textureLoadCount = 0;

    function onTextureLoaded(texture, key) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        textures[key] = texture;
        textureLoadCount++;
        if (textureLoadCount === 2) {
            callback(textures);
        }
    }

    textureLoader.load('../images/waterCh1.png', function (texture) {
        onTextureLoaded(texture, 'iChannel0');
    });

    textureLoader.load('../images/waterCh2.png', function (texture) {
        onTextureLoaded(texture, 'iChannel1');
    });
}

// Ensure textures are loaded before anything else runs
onLoad(function (textures) {
    init();
    initCloudMat();
    initWaterMat(textures);
    initCubes();
    animate();

    // Animate each group one after another, starting with the bottom
    initialDelay = animateGroup(groupBottom, initialDelay);
    initialDelay = animateGroup(groupMiddle, initialDelay);
    animateGroup(groupTop, initialDelay);

    moveCameraWithDelay(new THREE.Vector3(0, 0, 50), 1.35, 1); // Move camera after 5 seconds
    camera.lookAt(scene.position);
});

function init() {

    clock = new THREE.Clock();

    // Scene setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaOutput = true;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    //camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, 50, 0);

    document.getElementById('threeDScene').appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 0.1;
}

function initCloudMat() {
    // Cloud Texture
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

    // Cloud Material setup
    const cloudVertexShader = /* glsl */`
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
    const cloudFragmentShader = /* glsl */`
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
    materialTop = new THREE.RawShaderMaterial( {
        glslVersion: THREE.GLSL3,
        uniforms: {
            base: { value: new THREE.Color( 0x798aa0 ) },
            map: { value: texture },
            cameraPos: { value: new THREE.Vector3() },
            threshold: { value: 0 },
            opacity: { value: 0 },
            range: { value: 1 },
            steps: { value: 102 },
            frame: { value: 0 }
        },
        vertexShader: cloudVertexShader,
        fragmentShader: cloudFragmentShader,
        side: THREE.BackSide,
        transparent: true
    } );
    materialTop.customTag = 'customShader';

    /*// GUI
    const parameters = {
        threshold: 0,
        opacity: 0,
        range: 1,
        steps: 102
    };

    // Update GUI info to mesh
    function update() {

        materialTop.uniforms.threshold.value = parameters.threshold;
        materialTop.uniforms.opacity.value = parameters.opacity;
        materialTop.uniforms.range.value = parameters.range;
        materialTop.uniforms.steps.value = parameters.steps;

    }

    // Create GUI
    const gui = new GUI();
    gui.add( parameters, 'threshold', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'opacity', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'range', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'steps', 0, 200, 1 ).onChange( update );*/
}

function initWaterMat() {

    // Create material with the shader
    materialMiddle = new THREE.ShaderMaterial({
        uniforms: {
            iTime: { value: 0.0 },
            iChannel0: { value: textures.iChannel0 },
            iChannel1: { value: textures.iChannel1 },
            maxOpacity: { value: 1 },
            opacity: { value: 0. }
        },
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        transparent: true // Ensure the material is set to transparent if you need opacity
    });
    materialMiddle.customTag = 'customShader';
}

function initCubes() {
    //materialTop = new THREE.MeshBasicMaterial({ color: 0xdcdcdc, transparent: true, opacity: 0 });
    //materialMiddle = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0 });
    materialBottom = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });

    // Groups for different layers
    groupTop = new THREE.Group();
    groupMiddle = new THREE.Group();
    groupBottom = new THREE.Group();

    // Add groups to the scene
    scene.add(groupTop);
    scene.add(groupMiddle);
    scene.add(groupBottom);

    // Top Layer Create
    //createLayer(3, 1, 1, 0.5, groupTop, materialTop);
    createLayer(4, 1, 0.8, 0.5, groupTop, materialTop);
    createLayer(4, 1, 0.8, 0.5, groupMiddle, materialMiddle);
    createLayer(4, 1, 0.8, 0.5, groupBottom, materialBottom);

    //createLayer(7, 2, 0.356, 0.25, groupBottom, materialBottom, 0.);

    function createLayer(X,Y, cubeLength, cubeSpacing, layerGroup, layerMaterial) {
        //layer creation and grouping
        step = X;
        const halfStep = Math.ceil((step - 1) / 2);
        const totalSpacing = cubeLength + cubeSpacing;  // Total distance between the centers of adjacent cubes
        for (let i = 0; i < Y; i++) {
            for (let _x = 0; _x < step; _x++) {
                for (let _y = 0; _y < step; _y++) {
                    cubeGeometry = new THREE.BoxGeometry(cubeLength, cubeLength, cubeLength, 32, 32, 32); // Small Cube
                    let cubeMaterial = layerMaterial.clone(); // Correctly clone the material for each cube
                    //let cubeMaterial = layerMaterial; // Correctly clone the material for each cube
                    cubeMaterial.customTag = layerMaterial.customTag;

                    let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

                    // Change cube scale here
                    cube.position.set(
                    (_x - halfStep) * totalSpacing,  // Updated to include the cube size in spacing
                        i * (totalSpacing + 0.01),
                        // (i * totalSpacing) - levelSpacing,  // Correct y positioning using the specific offset
                        // ((y - 1)/2)  * levelSpacing,  // Assuming cubes are spaced in Y direction as well
                    (_y - halfStep) * totalSpacing   // Updated for Z direction
                    );
                    layerGroup.add(cube); // Add cube to the appropriate group
                    cubes.push(cube); // Add cube to the array for potential individual manipulation
                }
            }
        }
    }
    groupTop.position.set(0.5, 1.8, 0.5)
    groupMiddle.position.set(0.5, 0, 0.5)
    groupBottom.position.set(0.5, -1.8, 0.5)
}

window.addEventListener('mousemove', (event) => {

    mouseMoved = true;

    let rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        hitPoint.copy(intersects[0].point);
        hasHit = true;
        // Get the intersected object
        //const intersectedCube = intersects[0].object;

        // Print cube world position
        // const worldPosition = new THREE.Vector3();
        // intersectedCube.getWorldPosition(worldPosition);
        // console.log(`World Position - X: ${worldPosition.x.toFixed(2)}, Y: ${worldPosition.y.toFixed(2)}, Z: ${worldPosition.z.toFixed(2)}`);

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

function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) * 0.001; // Convert to seconds
    lastTime = currentTime;

    // Update time uniform for each cube
    groupMiddle.children.forEach(cube => {
        cube.material.uniforms.iTime.value += deltaTime;
    });


    updateRaycast();

    // Update each cube in the topGroup
    groupTop.children.forEach(cube => {
        cube.material.uniforms.cameraPos.value.copy(camera.position);
        // cube.rotation.y = -performance.now() / 7500;
        cube.material.uniforms.frame.value++;
    });

    renderer.render(scene, camera);
    controls.update();
}

function updateRaycast(){

    if (!mouseMoved) {
        return; // Skip raycasting if content is not yet loaded
    }

    const maxScale = 2; // Maximum scale for the hovered cube
    const influenceRadius = 3; // Radius within which other cubes will be affected
    const falloffRate = 0; // Controls the rate at which the scale effect diminishes

    raycaster.setFromCamera(mouse, camera); // Update raycaster position
    const intersects = raycaster.intersectObjects(cubes);

    let hoveredCube = null;
    if (intersects.length > 0) {
        hoveredCube = intersects[0].object;
        hitPoint.copy(intersects[0].point);
        hasHit = true;
    } else {
        hasHit = false;
    }

    cubes.forEach(cube => {
        // Set a default scale or refer back to some initial value, such as 1
        const defaultScale = new THREE.Vector3(1, 1, 1); // Assuming default scale is 1
        if (hasHit && cube === hoveredCube) {
            const distance = cube.position.distanceTo(hitPoint);
            if (distance < influenceRadius) {
                // Calculate scale based on distance using an exponential falloff
                const scaleValue = maxScale * Math.exp(-falloffRate * distance);
                cube.targetScale = new THREE.Vector3(scaleValue, scaleValue, scaleValue);
            } else {
                cube.targetScale = defaultScale;
            }
        } else {
            cube.targetScale = defaultScale;
        }

        // Smoothly interpolate towards the target scale
        cube.scale.lerp(cube.targetScale, 0.1);
    });
}

function animateGroup(group, delayStart) {
    let delay = delayStart;
    const delayIncrement = 0.02; // Delay increment between non-overlapping groups in seconds
    const cubeDelayIncrement = 0.01; // Delay increment between cubes within the same group

    // Extract cubes from the group
    const cubes = group.children;

    // Group cubes by their X and Z position to handle overlapping
    const positionMap = new Map();
    cubes.forEach(cube => {
        const key = `${cube.position.x}:${cube.position.z}`;
        if (!positionMap.has(key)) {
            positionMap.set(key, []);
        }
        positionMap.get(key).push(cube);
    });

    // Sort groups by X position for the wave effect (adjust sorting for different directions)
    const sortedGroups = Array.from(positionMap.values()).sort((a, b) => a[0].position.x - b[0].position.x);

    // Animate each group
    sortedGroups.forEach(group => {
        let groupDelay = delay; // Initialize group-specific delay
        group.forEach(cube => {
            const animationProps = {
                opacity: 1,
                duration: 0.2,
                delay: groupDelay,
                ease: "power1.inOut"
            };

            if (cube.material.customTag === 'customShader') {
                // Ensure uniforms are correctly updated and GUI refreshed if necessary
                gsap.to(cube.material.uniforms.opacity, {
                    value: 1,
                    duration: 0.2,
                    delay: groupDelay,
                    ease: "power1.inOut",
                    onUpdate: () => cube.material.needsUpdate = true // Make sure the shader updates
                });
            } else {
                gsap.to(cube.material, animationProps);
            }

            groupDelay += cubeDelayIncrement; // Increase delay for each cube within the group
        });

        delay += delayIncrement; // Increase delay for the next non-overlapping group
    });

    return delay; // Return the last used delay
}

/**
 * Moves the camera to a specified position over a given duration after a specified delay.
 * @param {THREE.Vector3} targetPosition - The target position to move the camera to.
 * @param {number} duration - The duration in seconds over which to move the camera.
 * @param {number} delay - The delay in seconds before the camera starts moving.
 */
function moveCameraWithDelay(targetPosition, duration, delay) {
    setTimeout(() => {
        gsap.to(camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: duration,
            ease: "power1.inOut",
            onUpdate: function() {
                // Update the camera's matrix or controls if necessary
                if (controls) controls.update();
            },
            onComplete: function() {
                console.log('Camera move complete.');
                isLoaded = true;
            }
        });
    }, delay * 1000); // Convert delay to milliseconds
}
