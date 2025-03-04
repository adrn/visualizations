import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// jQuery
const $ = window.jQuery;

// Global variables
let stats, camera, scene, renderer, controls;
let materials = {};
let all_particles = {};

// Window properties
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// GUI setup
const gui = new GUI();
let guiConfig;
let keys = [];
let menu = {};

// Generate a texture for particles
const generateTexture = () => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = "#FFFFFF";
    context.fill();

    return canvas;
};

// Initialize the scene
function init(data) {
    const container = document.getElementById('container');

    // Set up camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 10000);
    camera.position.set(0, -60, 30);
    camera.up.set(0, 0, 1); // Z-up coordinate system

    // Set up OrbitControls
    controls = new OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = true; // Better for z-up system
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.0;
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.enableRotate = true;
    controls.keys = [65, 83, 68]; // A, S, D
    controls.addEventListener('change', render);

    // Create scene
    scene = new THREE.Scene();

    // Create texture for particles
    const texture = new THREE.Texture(generateTexture());
    texture.needsUpdate = true;

    // Extract keys from data
    keys = Object.keys(data);

    // Process each stream/object
    keys.forEach(key => {
        if (key === 'Disk') {
            // Create a plane geometry for the galaxy disk image
            const diskRadius = 15.5; // Adjust based on your data scale
            const planeGeometry = new THREE.PlaneGeometry(diskRadius * 2, diskRadius * 2);

            // Load galaxy texture
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load('mw_spw.png', function(texture) {
                // Create material with the loaded texture
                const diskMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 1,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide // Visible from both sides
                });

                // Create the mesh representing the disk
                const diskMesh = new THREE.Mesh(planeGeometry, diskMaterial);

                scene.add(diskMesh);
                all_particles[key] = diskMesh;

                // Store material reference for later access
                materials[key] = diskMaterial;
            });
        } else {
            // For non-disk streams, use the existing particle approach
            // Create geometry for particles
            const geometry = new THREE.BufferGeometry();

            const defaultSize = 0.25;
            const d = data[key];
            const position = d.data;
            const size = d.size || defaultSize;

            // Convert position data to TypedArray for BufferGeometry
            const vertices = new Float32Array(position.length * 3);

            for (let i = 0; i < position.length; i++) {
                vertices[i * 3] = position[i][0];
                vertices[i * 3 + 1] = position[i][1];
                vertices[i * 3 + 2] = position[i][2];
            }

            // Add position attribute to geometry
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

            // Create material for stream particles
            const material = new THREE.PointsMaterial({
                size: size,
                map: texture,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                transparent: true,
                alphaTest: 0.01
            });

            material.opacity = d.opacity || 0.4;
            material.color.setHex(parseInt(d.color) || 0xffffff);

            // Create points
            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            all_particles[key] = particles;
            materials[key] = material;
        }
    });

    // Add a large red marker particle to represent the Sun at [-8.2, 0, 0]
    // const sunGeometry = new THREE.BufferGeometry();
    // const sunVertices = new Float32Array(3);
    // sunVertices[0] = -8.2;
    // sunVertices[1] = 0;
    // sunVertices[2] = 0;

    // sunGeometry.setAttribute('position', new THREE.BufferAttribute(sunVertices, 3));
    // const sunMaterial = new THREE.PointsMaterial({
    //     size: 1,
    //     color: 0xff0000
    // });
    // const sun = new THREE.Points(sunGeometry, sunMaterial);
    // scene.add(sun);

    // // Store the sun in all_particles (optional, if you want to control it later)
    // all_particles['Sun'] = sun;
    // materials['Sun'] = sunMaterial;

    // Set up GUI configuration
    guiConfig = {
        isAnimating: false,
        rotationSpeed: 0.5,
        initialCameraPosition: {
            x: -60,
            y: 30,
            z: camera.position.z,
            upX: 0,
            upY: 0,
            upZ: 1
        },
        resetCamera: function() {
            if (this.isAnimating) {
                this.isAnimating = false;
                controls.enabled = true;
            }

            camera.position.set(
                this.initialCameraPosition.x,
                this.initialCameraPosition.y,
                this.initialCameraPosition.z
            );

            camera.up.set(
                this.initialCameraPosition.upX,
                this.initialCameraPosition.upY,
                this.initialCameraPosition.upZ
            );

            camera.lookAt(scene.position);

            controls.target.set(0, 0, 0);
            controls.update();
        },
        toggleAnimation: function() {
            this.isAnimating = !this.isAnimating;
            controls.enabled = !this.isAnimating;
        }
    };

    // Create Camera controls UI
    const animationFolder = gui.addFolder("Camera");
    const animButton = animationFolder.add(guiConfig, 'toggleAnimation').name("Start / Stop camera rotation");

    animationFolder.add(guiConfig, 'rotationSpeed', 0.1, 2.0).name("Rotation speed");
    animationFolder.add(guiConfig, 'resetCamera').name("Reset camera");
    animationFolder.open();

    // Create stream visibility controls
    const streamFolder = gui.addFolder("Streams");
    const controllers = {};

    keys.forEach(key => {
        if (key !== 'Disk') {
            guiConfig[key] = true;
            controllers[key] = streamFolder.add(guiConfig, key);
        }
    });

    guiConfig.hideAll = function() {
        keys.forEach(key => {
            if (key !== 'Disk') {
                // Set the config value
                guiConfig[key] = false;

                // Update the specific controller
                if (controllers[key]) {
                    controllers[key].updateDisplay();
                }
            }
        });
    };

    guiConfig.showAll = function() {
        keys.forEach(key => {
            if (key !== 'Disk') {
                // Set the config value
                guiConfig[key] = true;

                // Update the specific controller
                if (controllers[key]) {
                    controllers[key].updateDisplay();
                }
            }
        });
    };

    streamFolder.add(guiConfig, 'hideAll').name("Hide All");
    streamFolder.add(guiConfig, 'showAll').name("Show All");
    streamFolder.close();

    // Set up the renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true, antialias: true, logarithmicDepthBuffer: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add stats monitor
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    // Handle window resizing
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);

    // Update object visibility based on UI
    keys.forEach(key => {
        if (all_particles[key]) {
            all_particles[key].visible = guiConfig[key] !== false;
        }
    });

    // Handle camera animation
    if (guiConfig.isAnimating) {
        const x = camera.position.x;
        const y = camera.position.y;
        const z = camera.position.z;

        const radius = Math.sqrt(x*x + y*y);
        let currentAngle = Math.atan2(y, x);

        currentAngle += guiConfig.rotationSpeed * 0.01;

        const newX = radius * Math.cos(currentAngle);
        const newY = radius * Math.sin(currentAngle);

        camera.position.set(newX, newY, z);
        camera.lookAt(scene.position);
    } else {
        controls.update();
    }

    render();
    stats.update();
}

$(document).ready(function() {
    // Check for WebGL support
    if (!window.WebGLRenderingContext) {
        const div = $("<div></div>")
            .attr("id", "webgl-notify")
            .attr("class", "top-center")
            .html("Oh no! Your browser does not seem to support WebGL.");

        $("body").append(div);
        $("#info").hide();
        return;
    }

    // Check if WebGL is enabled
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
        const div = $("<div></div>")
            .attr("id", "webgl-notify")
            .attr("class", "top-center")
            .html("It seems like your browser supports WebGL, however it does not appear to be enabled. Enable WebGL, then reload the page.<br/>" +
                  "<a href='http://www.browserleaks.com/webgl#howto-enable-disable-webgl'>How to enable WebGL</a>");

        $("body").append(div);
        $("#info").hide();
        return;
    }

    // Load data and initialize
    $.getJSON("data.json", function(data) {
        init(data);
        animate();
    });
});