import * as THREE from 'three';

export class Body {
    constructor(name, mass, radius, position, velocity, color, isStar = false) {
        this.name = name;
        this.mass = mass;
        this.radius = radius;
        this.position = position.clone(); // THREE.Vector3
        this.velocity = velocity.clone(); // THREE.Vector3
        this.isStar = isStar;

        // Visual Mesh
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        let material;

        if (isStar) {
            material = new THREE.MeshBasicMaterial({ color: color });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.8,
                metalness: 0.1
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);

        // Trail (Simple line for now, can be improved)
        this.trailPoints = [];
        this.maxTrailPoints = 200;
        // Trail initialization can be done in SceneManager or here.
        // For simplicity, we won't add trail mesh logic here yet, but store data.
    }

    updatePosition(dt) {
        // This will be driven by physics engine, but we need to sync mesh
        this.mesh.position.copy(this.position);
    }
}
