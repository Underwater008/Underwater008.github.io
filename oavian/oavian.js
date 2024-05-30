import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {BufferAttribute, BufferGeometry, MeshBasicMaterial, Points, PointsMaterial, Vector3} from "three";
import {randFloat} from "three/src/math/MathUtils";
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';


import waterPlainVertexShader from './waterPlainVertexShader.glsl'
import waterPlainFragmentShader from './waterPlainFragmentShader.glsl'
import birdsVertexShader from './birdsVertexShader.glsl'
import birdsFragmentShader from './birdsFragmentShader.glsl'


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set background to black
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );

camera.position.set(-2.7, 1, 4);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth damping
controls.dampingFactor = 0.05; // Set damping factor for smoothness
// controls.screenSpacePanning = false;
// controls.minDistance = 100;
// controls.maxDistance = 500;
// controls.maxPolarAngle = Math.PI / 2;
controls.update();

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
directionalLight.position.set(0, 10, 10);

// Create ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // white light with 50% intensity
scene.add(ambientLight);

let sky, sun;

let crane
// Loader for importing the GLB model
const loader = new GLTFLoader();
let mixer
/*loader.load('../3DModels/crane.glb', function(gltf) {
    crane = gltf.scene; // The imported model becomes part of the scene

    // Optionally traverse the model and set each mesh to cast and receive shadows
    crane.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.geometry) {
            //console.log(gltf.children[ 0 ]);
        }
    });

    // Animation setup
    if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(crane);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });
    }

    //crane.position.y = 3

    scene.add(crane);

    const clock = new THREE.Clock(); // Needed for animation mixer update

    function updateCrane(){

        if (crane) {
            requestAnimationFrame(updateCrane);

            crane.position.y = Math.sin(performance.now()/2000)

            const delta = clock.getDelta(); // Get the delta time for smooth animations
            if (mixer) mixer.update(delta); // Update the animation mixer if it exists
        }
    }
    updateCrane()

}, undefined, function(error) {
    console.error('An error happened while loading the model:', error);
});*/

function setReflector(){
    // reflectors/mirrors

    let geometry, material;
    geometry = new THREE.CircleGeometry( 999, 64 );
    const customShader = Reflector.ReflectorShader;

    customShader.vertexShader = waterPlainVertexShader
    customShader.fragmentShader = waterPlainFragmentShader

    const dudvMap = new THREE.TextureLoader().load( '../images/waterdudv.jpg', function () {


        dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;
        customShader.uniforms.tDudv = {value: dudvMap};
        customShader.uniforms.time = {value: 0};

        const groundMirror = new Reflector( geometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x000000,
        } );
        groundMirror.position.y = 0;
        groundMirror.rotateX( - Math.PI / 2 );
        scene.add( groundMirror );

        function updateWaterPlain(){
            requestAnimationFrame(updateWaterPlain);

            groundMirror.material.uniforms.time.value += 0.01
        }

        updateWaterPlain();

    } );



}

function animate() {
    requestAnimationFrame( animate );

    controls.update();

    renderer.render( scene, camera );
}

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 450000 );

    scene.add( sky );

    sun = new THREE.Vector3();

    /// GUI

    const effectController = {
        turbidity: 2.1,
        rayleigh: 0,
        mieCoefficient: 0.002,
        mieDirectionalG: 0.988,
        elevation: 0,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = effectController.turbidity;
        uniforms[ 'rayleigh' ].value = effectController.rayleigh;
        uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        uniforms[ 'sunPosition' ].value.copy( sun );

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render( scene, camera );

    }

    const gui = new GUI();

    gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
    gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
    gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
    gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
    gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
    gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
    gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

    guiChanged();

}

function init() {

    const helper = new THREE.GridHelper( 10000, 2, 0xffffff, 0xffffff );
    //scene.add( helper );
    const axesHelper = new THREE.AxesHelper( 5 );
    //scene.add( axesHelper );

    renderer.toneMappingExposure = 0.5;
    document.body.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render );
    //controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = false;
    controls.enablePan = false;

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    renderer.setSize( window.innerWidth, window.innerHeight );
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    render();

}

function render() {

    renderer.render( scene, camera );

}

function setStars(){
    const geometry = new BufferGeometry()

    const vertices = []
    const range = 200
    for (let i = 0; i < 1000; i++) {

        const point = new Vector3(randFloat(-range, range), randFloat(10, 200), randFloat(-range, range))
        vertices.push(...point);

    }

    geometry.setAttribute('position', new BufferAttribute( new Float32Array(vertices), 3 ));
    const material = new PointsMaterial({ color: 0xffffff })
    const  mesh = new Points(geometry, material);

    scene.add(mesh)
}

init()

initSky();

setStars()

setReflector()

animate();

makeBirds()


function makeBirds(){
    /* TEXTURE WIDTH FOR SIMULATION */
    const WIDTH = 64;
    const BIRDS = WIDTH * WIDTH;

    /* BAKE ANIMATION INTO TEXTURE and CREATE GEOMETRY FROM BASE MODEL */
    const BirdGeometry = new THREE.BufferGeometry();
    let textureAnimation, durationAnimation, birdMesh, materialShader, indicesPerBird;

    function nextPowerOf2( n ) {

        return Math.pow( 2, Math.ceil( Math.log( n ) / Math.log( 2 ) ) );

    }

    Math.lerp = function ( value1, value2, amount ) {

        amount = Math.max( Math.min( amount, 1 ), 0 );
        return value1 + ( value2 - value1 ) * amount;

    };

    let gltfs = [ '../3DModels/crane.glb'];
    const colors = [ 0xccFFFF, 0xffdeff ];
    const sizes = [ 30.2, 0.1 ];
    const selectModel = Math.floor( Math.random() * gltfs.length );
    new GLTFLoader().load( '../3DModels/crane2.glb', function ( gltf ) {

        const animations = gltf.animations;
        durationAnimation = Math.round( animations[ 0 ].duration * 60 );
        let birdGeo
        gltf.scene.traverse(function(child) {

            if (child.geometry) {
                birdGeo = child.geometry;
                console.log( gltf.scene );

                //if model does not have 'position' attribute re-export it from blender with export attributes selected
                if (!child.geometry.getAttribute('position')) {
                    console.error("The position attribute is missing in the geometry");
                    return;
                }

                const positionArray = birdGeo.getAttribute('position').array;
                const count = birdGeo.getAttribute('position').count;

                // Check if the color attribute exists
                if (!birdGeo.getAttribute('color')) {
                    const colors = new Float32Array(count * 3);

                    if (child.material.map) {
                        // Extract colors from texture
                        const texture = child.material.map.image;
                        const canvas = document.createElement('canvas');
                        canvas.width = texture.width;
                        canvas.height = texture.height;
                        const context = canvas.getContext('2d');
                        context.drawImage(texture, 0, 0);
                        const imageData = context.getImageData(0, 0, texture.width, texture.height).data;

                        for (let i = 0; i < count; i++) {
                            const u = (birdGeo.attributes.uv.array[i * 2] * texture.width) | 0;
                            const v = (birdGeo.attributes.uv.array[i * 2 + 1] * texture.height) | 0;
                            const index = (v * texture.width + u) * 4;

                            colors[i * 3] = imageData[index] / 255;      // R component
                            colors[i * 3 + 1] = imageData[index + 1] / 255; // G component
                            colors[i * 3 + 2] = imageData[index + 2] / 255; // B component
                        }
                    } else if (child.material.color) {
                        // Use the color from the material if it exists
                        const materialColor = child.material.color;
                        for (let i = 0; i < count; i++) {
                            colors[i * 3] = materialColor.r;
                            colors[i * 3 + 1] = materialColor.g;
                            colors[i * 3 + 2] = materialColor.b;
                        }
                    } else {
                        // Default to white if no colors are available
                        for (let i = 0; i < count; i++) {
                            colors[i * 3] = 1;     // R component
                            colors[i * 3 + 1] = 1; // G component
                            colors[i * 3 + 2] = 1; // B component
                        }
                    }

                    birdGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                }

                colors.needsUpdate = true;


                const morphAttributes = birdGeo.morphAttributes.position;
                const tHeight = nextPowerOf2( durationAnimation );
                const tWidth = nextPowerOf2( birdGeo.getAttribute( 'position' ).count );
                indicesPerBird = birdGeo.index.count;
                const tData = new Float32Array( 4 * tWidth * tHeight );

                for ( let i = 0; i < tWidth; i ++ ) {

                    for ( let j = 0; j < tHeight; j ++ ) {

                        const offset = j * tWidth * 4;

                        const curMorph = Math.floor( j / durationAnimation * morphAttributes.length );
                        const nextMorph = ( Math.floor( j / durationAnimation * morphAttributes.length ) + 1 ) % morphAttributes.length;
                        const lerpAmount = j / durationAnimation * morphAttributes.length % 1;

                        if ( j < durationAnimation ) {

                            let d0, d1;

                            d0 = morphAttributes[ curMorph ].array[ i * 3 ];
                            d1 = morphAttributes[ nextMorph ].array[ i * 3 ];

                            if ( d0 !== undefined && d1 !== undefined ) tData[ offset + i * 4 ] = Math.lerp( d0, d1, lerpAmount );

                            d0 = morphAttributes[ curMorph ].array[ i * 3 + 1 ];
                            d1 = morphAttributes[ nextMorph ].array[ i * 3 + 1 ];

                            if ( d0 !== undefined && d1 !== undefined ) tData[ offset + i * 4 + 1 ] = Math.lerp( d0, d1, lerpAmount );

                            d0 = morphAttributes[ curMorph ].array[ i * 3 + 2 ];
                            d1 = morphAttributes[ nextMorph ].array[ i * 3 + 2 ];

                            if ( d0 !== undefined && d1 !== undefined ) tData[ offset + i * 4 + 2 ] = Math.lerp( d0, d1, lerpAmount );

                            tData[ offset + i * 4 + 3 ] = 1;

                        }

                    }

                }

                textureAnimation = new THREE.DataTexture( tData, tWidth, tHeight, THREE.RGBAFormat, THREE.FloatType );
                textureAnimation.needsUpdate = true;

                const vertices = [], color = [], reference = [], seeds = [], indices = [];
                const totalVertices = birdGeo.getAttribute( 'position' ).count * 3 * BIRDS;
                for ( let i = 0; i < totalVertices; i ++ ) {

                    const bIndex = i % ( Math.floor(birdGeo.getAttribute( 'position' ).count) * 3 );
                    //console.log(bIndex)

                    vertices.push( birdGeo.getAttribute( 'position' ).array[ bIndex ] );
                    color.push( birdGeo.getAttribute( 'color' ).array[ bIndex ] );

                }

                let r = Math.random();
                for ( let i = 0; i < birdGeo.getAttribute( 'position' ).count * BIRDS; i ++ ) {

                    const bIndex = i % ( birdGeo.getAttribute( 'position' ).count );
                    const bird = Math.floor( i / birdGeo.getAttribute( 'position' ).count );
                    if ( bIndex == 0 ) r = Math.random();
                    const j = ~ ~ bird;
                    const x = ( j % WIDTH ) / WIDTH;
                    const y = ~ ~ ( j / WIDTH ) / WIDTH;
                    reference.push( x, y, bIndex / tWidth, durationAnimation / tHeight );
                    seeds.push( bird, r, Math.random(), Math.random() );

                }

                for ( let i = 0; i < birdGeo.index.array.length * BIRDS; i ++ ) {

                    const offset = Math.floor( i / birdGeo.index.array.length ) * ( birdGeo.getAttribute( 'position' ).count );
                    indices.push( birdGeo.index.array[ i % birdGeo.index.array.length ] + offset );

                }

                BirdGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( vertices ), 3 ) );
                BirdGeometry.setAttribute( 'birdColor', new THREE.BufferAttribute( new Float32Array( color ), 3 ) );
                BirdGeometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( color ), 3 ) );
                BirdGeometry.setAttribute( 'reference', new THREE.BufferAttribute( new Float32Array( reference ), 4 ) );
                BirdGeometry.setAttribute( 'seeds', new THREE.BufferAttribute( new Float32Array( seeds ), 4 ) );

                BirdGeometry.setIndex( indices );

                setupBirds();
                animateBirds();
            }
        });


    } );

    let container, stats;
    let mouseX = 0, mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2;

    let last = performance.now();

    let gpuCompute;
    let velocityVariable;
    let positionVariable;
    let positionUniforms;
    let velocityUniforms;

    function setupBirds() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );

        scene.fog = new THREE.Fog( colors[ selectModel ], 100, 1000 );

        // LIGHTS

        const hemiLight = new THREE.HemisphereLight( colors[ selectModel ], 0xffffff, 4.5 );
        hemiLight.color.setHSL( 0.6, 1, 0.6, THREE.SRGBColorSpace );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75, THREE.SRGBColorSpace );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        initComputeRenderer();

        stats = new Stats();
        container.appendChild( stats.dom );

        container.style.touchAction = 'none';
        container.addEventListener( 'pointermove', onPointerMove );

        window.addEventListener( 'resize', onWindowResize );

        const gui = new GUI();

        const effectController = {

            separation: 20.0,
            alignment: 20.0,
            cohesion: 20.0,
            freedom: 0.75,
            size: sizes[ selectModel ],
            count: Math.floor( BIRDS / 4 )

        };

        const valuesChanger = function () {

            velocityUniforms[ 'separationDistance' ].value = effectController.separation;
            velocityUniforms[ 'alignmentDistance' ].value = effectController.alignment;
            velocityUniforms[ 'cohesionDistance' ].value = effectController.cohesion;
            velocityUniforms[ 'freedomFactor' ].value = effectController.freedom;
            if ( materialShader ) materialShader.uniforms[ 'size' ].value = effectController.size;
            BirdGeometry.setDrawRange( 0, indicesPerBird * effectController.count );

        };

        valuesChanger();

        gui.add( effectController, 'separation', 0.0, 100.0, 1.0 ).onChange( valuesChanger );
        gui.add( effectController, 'alignment', 0.0, 100, 0.001 ).onChange( valuesChanger );
        gui.add( effectController, 'cohesion', 0.0, 100, 0.025 ).onChange( valuesChanger );
        gui.add( effectController, 'size', 0, 1, 0.01 ).onChange( valuesChanger );
        gui.add( effectController, 'count', 0, BIRDS, 1 ).onChange( valuesChanger );
        gui.close();

        initBirds( effectController );

    }

    function initComputeRenderer() {

        gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );

        const dtPosition = gpuCompute.createTexture();
        const dtVelocity = gpuCompute.createTexture();
        fillPositionTexture( dtPosition );
        fillVelocityTexture( dtVelocity );

        velocityVariable = gpuCompute.addVariable( 'textureVelocity', document.getElementById( 'fragmentShaderVelocity' ).textContent, dtVelocity );
        positionVariable = gpuCompute.addVariable( 'texturePosition', document.getElementById( 'fragmentShaderPosition' ).textContent, dtPosition );

        gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
        gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );

        positionUniforms = positionVariable.material.uniforms;
        velocityUniforms = velocityVariable.material.uniforms;

        positionUniforms[ 'time' ] = { value: 0.0 };
        positionUniforms[ 'delta' ] = { value: 0.0 };
        velocityUniforms[ 'time' ] = { value: 1.0 };
        velocityUniforms[ 'delta' ] = { value: 0.0 };
        velocityUniforms[ 'testing' ] = { value: 1.0 };
        velocityUniforms[ 'separationDistance' ] = { value: 1.0 };
        velocityUniforms[ 'alignmentDistance' ] = { value: 1.0 };
        velocityUniforms[ 'cohesionDistance' ] = { value: 1.0 };
        velocityUniforms[ 'freedomFactor' ] = { value: 1.0 };
        velocityUniforms[ 'predator' ] = { value: new THREE.Vector3() };
        velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 );

        velocityVariable.wrapS = THREE.RepeatWrapping;
        velocityVariable.wrapT = THREE.RepeatWrapping;
        positionVariable.wrapS = THREE.RepeatWrapping;
        positionVariable.wrapT = THREE.RepeatWrapping;

        const error = gpuCompute.init();

        if ( error !== null ) {

            console.error( error );

        }

    }

    function initBirds( effectController ) {

        const geometry = BirdGeometry;

        const m = new THREE.MeshStandardMaterial( {
            vertexColors: true,
            flatShading: true,
            roughness: 1,
            metalness: 0
        } );

        m.onBeforeCompile = ( shader ) => {

            shader.uniforms.texturePosition = { value: null };
            shader.uniforms.textureVelocity = { value: null };
            shader.uniforms.textureAnimation = { value: textureAnimation };
            shader.uniforms.time = { value: 1.0 };
            shader.uniforms.size = { value: effectController.size };
            shader.uniforms.delta = { value: 0.0 };

            let token = '#define STANDARD';

            let insert = /* glsl */`
						attribute vec4 reference;
						attribute vec4 seeds;
						attribute vec3 birdColor;
						uniform sampler2D texturePosition;
						uniform sampler2D textureVelocity;
						uniform sampler2D textureAnimation;
						uniform float size;
						uniform float time;
					`;

            shader.vertexShader = shader.vertexShader.replace( token, token + insert );

            token = '#include <begin_vertex>';

            insert = /* glsl */`
						vec4 tmpPos = texture2D( texturePosition, reference.xy );

						vec3 pos = tmpPos.xyz;
						vec3 velocity = normalize(texture2D( textureVelocity, reference.xy ).xyz);
						vec3 aniPos = texture2D( textureAnimation, vec2( reference.z, mod( time + ( seeds.x ) * ( ( 0.0004 + seeds.y / 10000.0) + normalize( velocity ) / 20000.0 ), reference.w ) ) ).xyz;
						vec3 newPosition = position;

						newPosition = mat3( modelMatrix ) * ( newPosition + aniPos );
						newPosition *= size + seeds.y * size * 0.2;

						velocity.z *= -1.;
						float xz = length( velocity.xz );
						float xyz = 1.;
						float x = sqrt( 1. - velocity.y * velocity.y );

						float cosry = velocity.x / xz;
						float sinry = velocity.z / xz;

						float cosrz = x / xyz;
						float sinrz = velocity.y / xyz;

						mat3 maty =  mat3( cosry, 0, -sinry, 0    , 1, 0     , sinry, 0, cosry );
						mat3 matz =  mat3( cosrz , sinrz, 0, -sinrz, cosrz, 0, 0     , 0    , 1 );

						newPosition =  maty * matz * newPosition;
						newPosition += pos;

						vec3 transformed = vec3( newPosition );
					`;

            shader.vertexShader = shader.vertexShader.replace( token, insert );

            materialShader = shader;

        };

        birdMesh = new THREE.Mesh( geometry, m );
        birdMesh.rotation.y = Math.PI / 2;

        birdMesh.castShadow = true;
        birdMesh.receiveShadow = true;

        scene.add( birdMesh );

    }

    function fillPositionTexture( texture ) {

        const theArray = texture.image.data;

        for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {

            const x = Math.random() * BOUNDS - BOUNDS_HALF;
            const y = Math.random() * BOUNDS - BOUNDS_HALF;
            const z = Math.random() * BOUNDS - BOUNDS_HALF;

            theArray[ k + 0 ] = x;
            theArray[ k + 1 ] = y;
            theArray[ k + 2 ] = z;
            theArray[ k + 3 ] = 1;

        }

    }

    function fillVelocityTexture( texture ) {

        const theArray = texture.image.data;

        for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {

            const x = Math.random() - 0.5;
            const y = Math.random() - 0.5;
            const z = Math.random() - 0.5;

            theArray[ k + 0 ] = x * 10;
            theArray[ k + 1 ] = y * 10;
            theArray[ k + 2 ] = z * 10;
            theArray[ k + 3 ] = 1;

        }

    }

    function onPointerMove( event ) {

        if ( event.isPrimary === false ) return;

        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;

    }

    function animateBirds() {

        requestAnimationFrame( animateBirds );

        renderBirds();
        stats.update();

    }

    function renderBirds() {

        const now = performance.now();
        let delta = ( now - last ) / 1000;

        if ( delta > 1 ) delta = 1; // safety cap on large deltas
        last = now;

        positionUniforms[ 'time' ].value = now;
        positionUniforms[ 'delta' ].value = delta;
        velocityUniforms[ 'time' ].value = now;
        velocityUniforms[ 'delta' ].value = delta;
        if ( materialShader ) materialShader.uniforms[ 'time' ].value = now / 1000;
        if ( materialShader ) materialShader.uniforms[ 'delta' ].value = delta;

        velocityUniforms[ 'predator' ].value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 );

        mouseX = 10000;
        mouseY = 10000;

        gpuCompute.compute();

        if ( materialShader ) materialShader.uniforms[ 'texturePosition' ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
        if ( materialShader ) materialShader.uniforms[ 'textureVelocity' ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;

        renderer.render( scene, camera );
    }
}