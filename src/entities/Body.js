import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';

export class Body {
    constructor(name, mass, radius, position, velocity, color, type = 'planet') {
        this.name = name;
        this.mass = mass;
        this.radius = radius;
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.type = type; // 'star', 'planet'
        this.isDead = false;

        // Visual Mesh
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        let material;

        if (type === 'star') {
            material = new THREE.MeshBasicMaterial({
                color: color,
                map: TextureGenerator.createPlanetTexture(color, 0xffffff, Math.random()) // subtle noise
            });
            // Add a glow sprite
            const spriteMat = new THREE.SpriteMaterial({
                map: TextureGenerator.createStarTexture(),
                color: color,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            this.glow = new THREE.Sprite(spriteMat);
            this.glow.scale.set(radius * 4, radius * 4, 1);

            // We need to attach glow to scene or mesh.
            // If we attach to mesh, it rotates with it, which is bad for sprites usually.
            // But for a simple glow it's okay, or we handle it in update.
            // Let's attach to mesh for simplicity, but billboard effect handles rotation.
        } else {
            // Planet
            // Generate random secondary color
            const c = new THREE.Color(color);
            const c2 = c.clone().offsetHSL(0, 0, -0.2); // Darker shade

            material = new THREE.MeshStandardMaterial({
                color: 0xffffff, // Let texture drive color
                map: TextureGenerator.createPlanetTexture(c.getHex(), c2.getHex(), Math.random()),
                roughness: 0.8,
                metalness: 0.1
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.userData.body = this; // Link back for raycasting

        if (this.glow) {
            this.mesh.add(this.glow);
        }

        // Spin
        this.spin = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize().multiplyScalar(0.01);

        // Trail
        this.trailPoints = [];
    }

    updatePosition(dt) {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x += this.spin.x;
        this.mesh.rotation.y += this.spin.y;

        // Trail update logic will be handled by TrailRenderer
    }
}
