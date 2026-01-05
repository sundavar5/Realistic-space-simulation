import * as THREE from 'three';
import { SceneManager } from './graphics/SceneManager.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { UIManager } from './ui/UIManager.js';
import { Body } from './entities/Body.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class CosmosBuilder {
    constructor() {
        this.sceneManager = new SceneManager(document.getElementById('app'));
        this.physicsEngine = new PhysicsEngine();

        // Setup Controls
        this.controls = new OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup UI
        this.uiManager = new UIManager(this.physicsEngine, this.sceneManager);
        // Bind UI actions
        this.uiManager.resetSimulation = this.reset.bind(this);
        this.uiManager.addRandomPlanet = this.addRandomBody.bind(this);
        // Fix binding in dat.gui params if needed, or just overwrite the method on instance which I did.
        // Wait, UIManager constructor creates params object with arrow functions wrapping methods.
        // So I need to inject my implementation into UIManager or let UIManager call callbacks.
        // The current UIManager implementation calls `this.resetSimulation()` which I can overwrite.
        this.uiManager.resetSimulation = this.reset.bind(this);
        this.uiManager.addRandomPlanet = this.addRandomBody.bind(this);

        this.lastTime = 0;

        this.initScenario();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initScenario() {
        // Solar Systemish
        // Sun
        const sun = new Body('Sun', 500, 5, new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 0xffff00, true);
        this.addBody(sun);

        // Earth-like
        const earth = new Body('Earth', 10, 1, new THREE.Vector3(50,0,0), new THREE.Vector3(0,0,3), 0x0000ff); // v ~ sqrt(0.5*500/50) = sqrt(5) ~ 2.2
        this.addBody(earth);

        // Jupiter-like
        const jupiter = new Body('Jupiter', 50, 2, new THREE.Vector3(90,0,0), new THREE.Vector3(0,0,1.6), 0xffaa00);
        this.addBody(jupiter);

        // Add random asteroids
        for(let i=0; i<20; i++) {
            this.addRandomBody(false);
        }
    }

    addBody(body) {
        this.physicsEngine.addBody(body);
        this.sceneManager.scene.add(body.mesh);
    }

    addRandomBody(large = true) {
        const dist = 40 + Math.random() * 60;
        const angle = Math.random() * Math.PI * 2;
        const pos = new THREE.Vector3(Math.cos(angle)*dist, 0, Math.sin(angle)*dist); // 2D plane mostly
        // Add some vertical variation
        pos.y = (Math.random() - 0.5) * 5;

        // Velocity for circular orbit roughly
        const sunMass = 500;
        const G = this.physicsEngine.G;
        const vMag = Math.sqrt(G * sunMass / pos.length());

        // Tangent vector: (-z, 0, x) normalized * vMag
        const vel = new THREE.Vector3(-pos.z, 0, pos.x).normalize().multiplyScalar(vMag);
        // Randomize slightly
        vel.add(new THREE.Vector3((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5));

        const mass = large ? 5 + Math.random() * 10 : 0.1 + Math.random();
        const radius = large ? 0.5 + Math.random() : 0.2;
        const color = Math.random() * 0xffffff;

        const body = new Body('Random', mass, radius, pos, vel, color);
        this.addBody(body);
    }

    reset() {
        // Remove all bodies from scene and physics
        for (const body of this.physicsEngine.bodies) {
            this.sceneManager.scene.remove(body.mesh);
        }
        this.physicsEngine.bodies = [];
        this.initScenario();
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Cap dt to avoid explosion on tab switch
        const safeDt = Math.min(dt, 0.1) * this.uiManager.params.timeScale;

        this.controls.update();
        this.physicsEngine.update(safeDt);

        // Check for dead bodies (merged)
        for (let i = this.physicsEngine.bodies.length - 1; i >= 0; i--) {
            const body = this.physicsEngine.bodies[i];
            if (body.isDead) { // We didn't implement isDead removal in engine loop fully, let's do it here or there.
                // In engine we removed it from engine bodies, but not scene.
                // Engine doesn't know about scene.
                // Wait, engine.update() called removeBody() for merged bodies.
                // So we need to sync scene with engine bodies OR handle the removal event.
                // My engine implementation removed it from `this.bodies`.
                // So `this.physicsEngine.bodies` only has survivors.
                // But the Meshes are still in the scene!
                // We need to detect which meshes to remove.
            }
        }

        // Better syncing:
        // Iterate scene children or keep a list?
        // Let's modify PhysicsEngine to return "removedBodies" list or emit event.
        // Or simpler: In this frame, verify if scene meshes correspond to physics bodies? No that's slow O(N^2).

        // Let's patch PhysicsEngine to put dead bodies in a list we can consume.
        if (this.physicsEngine.deadBodies) {
             while(this.physicsEngine.deadBodies.length > 0) {
                 const deadBody = this.physicsEngine.deadBodies.pop();
                 this.sceneManager.scene.remove(deadBody.mesh);
             }
        }

        this.sceneManager.update();
    }
}

new CosmosBuilder();
