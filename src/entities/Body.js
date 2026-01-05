import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';
import { StarVertexShader, StarFragmentShader } from '../graphics/shaders/StarShader.js';

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
        // Optimize segment count based on size/importance?
        // For massive catalog, we might want lower detail for distant objects.
        // But scaling LOD is hard without ECS.
        const segmentCount = (type === 'star') ? 32 : 32;
        const geometry = new THREE.SphereGeometry(radius, segmentCount, segmentCount);
        let material;

        if (type === 'star') {
            // Use ShaderMaterial for stars
            material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(color) }
                },
                vertexShader: StarVertexShader,
                fragmentShader: StarFragmentShader
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

        } else {
            // Planet
            const c = new THREE.Color(color);
            const c2 = c.clone().offsetHSL(0, 0, -0.2);

            material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
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

        // Update shader uniforms
        if (this.type === 'star' && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value += dt;
        }

        // Trail update logic will be handled by TrailRenderer
    }
}
