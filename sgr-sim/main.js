import * as THREE from '../js/three-new/three.module.js';
import { GUI } from '../js/three-new/examples/jsm/libs/dat.gui.module.js';
import Stats from '../js/three-new/examples/jsm/libs/stats.module.js';
import { TrackballControls } from '../js/three-new/examples/jsm/controls/TrackballControls.js';

let camera, scene, renderer, controls, stats, container, gui;
let windowHalfX, windowHalfY;
let data, particles;
var config = {
    rate: 10,
    frame: null,
    start_time: null,
    _running: true,
    stop: function() {
        this._running = false;
    },
    start: function() {
        if (this._running == true)
            return;
        this._running = true;
        this.start_time = Date.now();
    },
    reset: function() {
        // defaults:
        this.frame = 0;
        this.start_time = Date.now();
    }
}
config.reset();

$(document).ready(function() {
    $.getJSON("jason-sgr-10000.json", function(this_data) {
        data = this_data['xyz'];
        init(data[0]);
        animate();
    });
});

function init(data) {
    container = document.getElementById('container');

    var aspect = window.innerWidth / window.innerHeight;

    // Setup the camera
    camera = new THREE.PerspectiveCamera(75, aspect, 10, -10);
    //camera.position.x = 100;
    camera.position.y = 50;
    camera.up = new THREE.Vector3(0, 0, 1);

    // Define the renderer
    renderer = new THREE.WebGLRenderer({
        // antialias: true,
        alpha : true
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild(renderer.domElement);

    // Add an FPS stats window
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    // Add a GUI with some controls
    gui = new GUI()
    const anim_folder = gui.addFolder("Animation")
    anim_folder.add(config, 'rate', 0.1, 60, 0.1);
    anim_folder.add(config, 'stop');
    anim_folder.add(config, 'start');
    anim_folder.add(config, 'reset');
    anim_folder.open()

    // Set up the particle texture:
    const texture = new THREE.Texture( generateTexture( ) );
    texture.needsUpdate = true; // important

    // Set up the scene
    scene = new THREE.Scene();

    const geometry = new THREE.BufferGeometry();

    var k = 0;  // initial timestep
    var d = new Float32Array(data[k].length * 3);
    for (let i=0; i < data[k].length; i++) {
        d[3*i + 0] = data[k][i][0];
        d[3*i + 1] = data[k][i][1];
        d[3*i + 2] = data[k][i][2];
    }
    // x + WIDTH * (y + DEPTH * z)

    geometry.setAttribute('position',
                            new THREE.BufferAttribute(d, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        map: texture,
        size: 0.2,
        opacity: 0.25,
        blending: THREE.AdditiveBlending, // required
        depthTest: false, // required
        transparent: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // window.addEventListener('resize', onWindowResize, false);

    createControls(camera);
}

function generateTexture( ) {
    // draw a circle in the center of the canvas
    var size = 128;

    // create canvas
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    // get context
    var context = canvas.getContext('2d');

    // draw circle
    var centerX = size / 2;
    var centerY = size / 2;
    var radius = size / 2;

    context.beginPath();
    context.arc( centerX, centerY, radius, 0, 2 * Math.PI, false );
    context.fillStyle = "#FFFFFF";
    context.fill();

    return canvas;
}

function createControls(camera) {

    controls = new TrackballControls( camera, renderer.domElement );

    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.keys = [ 65, 83, 68 ];

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

}

function render() {
    // do the actual rendering
    const secs_elapsed = (Date.now() - config.start_time) / 1000.;
    var this_frame = config.frame + parseInt(secs_elapsed * config.rate);

    // console.log(config, this_frame);

    if (this_frame == config.frame)
        return true;
    else if (this_frame >= data.length)
        return false;
    else if (config._running != true)
        return false;

    var k = this_frame;  // timestep

    var geometry = particles.geometry;

    var d = new Float32Array(data[k].length * 3);
    for (let i=0; i < data[k].length; i++) {
        d[3*i + 0] = data[k][i][0];
        d[3*i + 1] = data[k][i][1];
        d[3*i + 2] = data[k][i][2];
    }
    geometry.setAttribute('position',
                            new THREE.BufferAttribute(d, 3));

    config.frame = this_frame;
    config.start_time = Date.now();

    return true;
}

function animate() {
    // recursive animation function
    var myReq = requestAnimationFrame(animate);

    controls.update();
    stats.update();

    var anim_state = render();

    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}