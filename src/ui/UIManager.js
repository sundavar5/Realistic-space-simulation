import * as dat from 'dat.gui';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';

export class UIManager {
    constructor(physicsEngine, sceneManager) {
        this.physicsEngine = physicsEngine;
        this.sceneManager = sceneManager;

        this.gui = new dat.GUI();

        this.params = {
            timeScale: 1.0,
            gravitationalConstant: physicsEngine.G,
            collisions: physicsEngine.collisionsEnabled,
            reset: () => this.resetSimulation(),
            addPlanet: () => this.addRandomPlanet()
        };

        const simFolder = this.gui.addFolder('Simulation');
        simFolder.add(this.params, 'timeScale', 0, 10).name('Time Speed');
        simFolder.add(this.params, 'gravitationalConstant', 0.1, 10).name('Gravity G').onChange(v => {
            this.physicsEngine.G = v;
        });
        simFolder.add(this.params, 'collisions').name('Collisions').onChange(v => {
            this.physicsEngine.collisionsEnabled = v;
        });
        simFolder.add(this.params, 'reset').name('Reset');
        simFolder.open();

        const toolsFolder = this.gui.addFolder('Tools');
        toolsFolder.add(this.params, 'addPlanet').name('Add Random Body');
        toolsFolder.open();
    }

    resetSimulation() {
        // Clear all bodies
        // Implementation depends on Main exposing a way to reset or we do it here
        // Ideally we emit an event, but let's just callback if we want.
        // For now, we'll implement this properly in Main integration.
        console.log("Reset requested");
        // We need access to clear bodies.
        // Let's assume we can clear physics engine and scene.
        // But removing meshes from scene requires reference.
        // Maybe we should pass a callback from Main.
    }

    addRandomPlanet() {
        console.log("Add Planet requested");
        // Callback or event to Main
    }
}
