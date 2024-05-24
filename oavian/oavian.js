import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


import waterPlainVertexShader from './waterPlainVertexShader.glsl'
import waterPlainFragmentShader from './waterPlainFragmentShader.glsl'
import {BufferAttribute, BufferGeometry, MeshBasicMaterial, Points, PointsMaterial, Vector3} from "three";
import {randFloat} from "three/src/math/MathUtils";
import {float} from "three/nodes";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set background to black
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

camera.position.set(-2.7, 1, 4);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const controls = new OrbitControls(camera, renderer.domElement);

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
loader.load('../3DModels/crane.glb', function(gltf) {
    crane = gltf.scene; // The imported model becomes part of the scene

    // Optionally traverse the model and set each mesh to cast and receive shadows
    crane.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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
});



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

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

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
