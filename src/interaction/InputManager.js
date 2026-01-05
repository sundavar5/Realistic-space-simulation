import * as THREE from 'three';

export class InputManager {
    constructor(sceneManager, container) {
        this.sceneManager = sceneManager;
        this.container = container;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedBody = null;
        this.callbacks = {
            onSelect: null
        };

        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    }

    onPointerDown(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        // Intersect against bodies
        // We need access to meshes. SceneManager has scene.
        // But the scene has everything (stars, lines). We want Bodies.
        // We can traverse scene or filter.
        // Better: SceneManager should probably expose "interactables" or we traverse and check userData.
        // For now, let's intersect all Mesh objects in scene.

        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);

        let clickedBody = null;
        for (const intersect of intersects) {
            // Find the object that corresponds to a Body
            // We didn't link Mesh back to Body clearly except via logic.
            // Let's assume we can map mesh uuid back if we have the list, or we add userData to mesh.
            // We should update Body.js to add self reference to mesh userData.
            if (intersect.object.userData.body) {
                clickedBody = intersect.object.userData.body;
                break;
            }
        }

        if (clickedBody !== this.selectedBody) {
            this.selectedBody = clickedBody;
            if (this.callbacks.onSelect) {
                this.callbacks.onSelect(this.selectedBody);
            }
        }
    }
}
