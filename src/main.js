import * as THREE from 'three';
import { SceneManager } from './graphics/SceneManager.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { UIManager } from './ui/UIManager.js';
import { Body } from './entities/Body.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrailRenderer } from './graphics/TrailRenderer.js';
import { ParticleSystem } from './graphics/ParticleSystem.js';
import { Starfield } from './graphics/Starfield.js';
import { InputManager } from './interaction/InputManager.js';
import { GalaxyGenerator } from './scenarios/GalaxyGenerator.js';

class CosmosBuilder {
    constructor() {
        this.sceneManager = new SceneManager(document.getElementById('app'));
        this.physicsEngine = new PhysicsEngine();

        // Systems
        this.trailRenderer = new TrailRenderer(this.sceneManager.scene);
        this.particleSystem = new ParticleSystem(this.sceneManager.scene);
        this.starfield = new Starfield(this.sceneManager.scene);

        // Input
        this.inputManager = new InputManager(this.sceneManager, this.sceneManager.renderer.domElement);
        this.inputManager.callbacks.onSelect = (body) => {
            this.selectedBody = body;
            this.uiManager.updateSelectedBody(body);
        };

        // Setup Controls
        this.controls = new OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup UI
        this.uiManager = new UIManager(this.physicsEngine, this.sceneManager);
        this.uiManager.resetSimulation = this.reset.bind(this);
        this.uiManager.addRandomPlanet = this.addRandomBody.bind(this);

        // Add Scenario UI
        this.uiManager.params.scenario = 'Solar System';
        this.uiManager.gui.add(this.uiManager.params, 'scenario', ['Solar System', 'Galaxy', 'Empty']).name('Load Scenario').onChange(v => {
            this.loadScenario(v);
        });

        this.lastTime = 0;

        this.loadScenario('Solar System');

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    loadScenario(name) {
        this.reset();
        if (name === 'Solar System') {
            this.initSolarSystem();
        } else if (name === 'Galaxy') {
            this.initGalaxy();
        }
    }

    initSolarSystem() {
        const sun = new Body('Sun', 500, 5, new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 0xffffaa, 'star');
        this.addBody(sun);

        const earth = new Body('Earth', 10, 1, new THREE.Vector3(50,0,0), new THREE.Vector3(0,0,3), 0x2233ff, 'planet');
        this.addBody(earth);

        const mars = new Body('Mars', 8, 0.8, new THREE.Vector3(70,0,0), new THREE.Vector3(0,0,2.6), 0xff4422, 'planet');
        this.addBody(mars);

        const jupiter = new Body('Jupiter', 50, 2, new THREE.Vector3(90,0,0), new THREE.Vector3(0,0,1.6), 0xffaa00, 'planet');
        this.addBody(jupiter);

        // Asteroid belt
        for(let i=0; i<40; i++) {
            this.addRandomBody(false);
        }
    }

    initGalaxy() {
        GalaxyGenerator.createGalaxy(this.physicsEngine, this.sceneManager);
    }

    addBody(body) {
        this.physicsEngine.addBody(body);
        this.sceneManager.scene.add(body.mesh);
    }

    addRandomBody(large = true) {
        const dist = 40 + Math.random() * 60;
        const angle = Math.random() * Math.PI * 2;
        const pos = new THREE.Vector3(Math.cos(angle)*dist, (Math.random()-0.5)*5, Math.sin(angle)*dist);

        const sunMass = 500;
        const G = this.physicsEngine.G;
        const vMag = Math.sqrt(G * sunMass / pos.length());

        const vel = new THREE.Vector3(-pos.z, 0, pos.x).normalize().multiplyScalar(vMag);
        vel.add(new THREE.Vector3((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5));

        const mass = large ? 5 + Math.random() * 10 : 0.1 + Math.random();
        const radius = large ? 0.5 + Math.random() : 0.2;
        const color = Math.random() * 0xffffff;

        const body = new Body('Random', mass, radius, pos, vel, color);
        this.addBody(body);
    }

    reset() {
        for (const body of this.physicsEngine.bodies) {
            this.sceneManager.scene.remove(body.mesh);
        }
        this.physicsEngine.bodies = [];
        this.trailRenderer.trails.forEach((line) => this.sceneManager.scene.remove(line));
        this.trailRenderer.trails.clear();

        this.selectedBody = null;
        this.uiManager.updateSelectedBody(null);
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        const safeDt = Math.min(dt, 0.1) * this.uiManager.params.timeScale;

        this.controls.update();
        this.physicsEngine.update(safeDt);

        // Handle Collisions / Particles
        for (const collision of this.physicsEngine.collisions) {
            this.particleSystem.createExplosion(collision.position, collision.color);
        }

        // Handle Dead Bodies
        if (this.physicsEngine.deadBodies) {
             while(this.physicsEngine.deadBodies.length > 0) {
                 const deadBody = this.physicsEngine.deadBodies.pop();
                 this.sceneManager.scene.remove(deadBody.mesh);
                 if (this.selectedBody === deadBody) {
                     this.selectedBody = null;
                     this.uiManager.updateSelectedBody(null);
                 }
             }
        }

        // Update Systems
        this.trailRenderer.update(this.physicsEngine.bodies);
        this.particleSystem.update(safeDt);

        // UI Updates
        if (this.selectedBody) {
            // Focus camera if needed? Or just track stats
            // Let's just update stats in UI if they change (like velocity/pos) - but dat.gui mostly reads.
            // We might want to auto-center camera on double click?
            // For now, simple stat update is fine.
        }

        this.sceneManager.update();
    }
}

new CosmosBuilder();
