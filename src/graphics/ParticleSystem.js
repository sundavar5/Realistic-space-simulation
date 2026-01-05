import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position, color, count = 50) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions.push(position.x, position.y, position.z);

            // Random velocity sphere
            const v = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(Math.random() * 5);
            velocities.push(v);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.5,
            transparent: true,
            opacity: 1.0
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        this.particles.push({
            mesh: points,
            velocities: velocities,
            age: 0,
            maxAge: 2.0 // seconds
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;

            if (p.age > p.maxAge) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }

            const positions = p.mesh.geometry.attributes.position.array;
            for (let j = 0; j < p.velocities.length; j++) {
                positions[j*3] += p.velocities[j].x * dt;
                positions[j*3+1] += p.velocities[j].y * dt;
                positions[j*3+2] += p.velocities[j].z * dt;
            }
            p.mesh.geometry.attributes.position.needsUpdate = true;
            p.mesh.material.opacity = 1.0 - (p.age / p.maxAge);
        }
    }
}
