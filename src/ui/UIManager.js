import * as dat from 'dat.gui';

export class UIManager {
    constructor(physicsEngine, sceneManager) {
        this.physicsEngine = physicsEngine;
        this.sceneManager = sceneManager;
        this.currentBody = null;

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

        this.infoFolder = this.gui.addFolder('Selected Body');
        this.infoParams = {
            name: '',
            mass: 0,
            radius: 0,
            delete: () => {
                if (this.currentBody) {
                    this.physicsEngine.removeBody(this.currentBody);
                    this.sceneManager.scene.remove(this.currentBody.mesh);
                    this.updateSelectedBody(null);
                }
            }
        };
        this.infoControllers = {
            name: this.infoFolder.add(this.infoParams, 'name').listen(),
            mass: this.infoFolder.add(this.infoParams, 'mass').listen(),
            radius: this.infoFolder.add(this.infoParams, 'radius').listen(),
            delete: this.infoFolder.add(this.infoParams, 'delete').name('Delete Body')
        };
        this.infoFolder.hide();
    }

    updateSelectedBody(body) {
        this.currentBody = body;
        if (!body) {
            this.infoFolder.hide();
            return;
        }

        this.infoFolder.show();
        this.infoFolder.open();

        this.infoParams.name = body.name;
        this.infoParams.mass = body.mass.toFixed(2);
        this.infoParams.radius = body.radius.toFixed(2);
    }

    resetSimulation() {
        console.log("Reset requested");
    }

    addRandomPlanet() {
        console.log("Add Planet requested");
    }
}
