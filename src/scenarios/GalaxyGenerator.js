import * as THREE from 'three';
import { Body } from '../entities/Body.js';

export class GalaxyGenerator {
    static createGalaxy(physicsEngine, sceneManager, armCount = 2) {
        // Center Supermassive Black Hole (modeled as a heavy Star for now, black hole visuals are hard)
        // Or just a very dense star cluster center.

        const center = new Body('Galactic Center', 50000, 20, new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 0xffffff, 'star');
        // Let's make it invisible or a black hole?
        // For visual flair, let's make it a bright core.
        physicsEngine.addBody(center);
        sceneManager.scene.add(center.mesh);

        const starCount = 400;
        const radius = 400;

        for (let i = 0; i < starCount; i++) {
            // Distance from center
            const dist = 50 + Math.random() * radius;

            // Spiral angle offset
            const spiralOffset = (dist / radius) * (Math.PI * 4); // Twist
            const armOffset = (Math.floor(Math.random() * armCount) / armCount) * (Math.PI * 2);
            const angle = spiralOffset + armOffset + (Math.random() - 0.5) * 0.5; // Random spread

            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const y = (Math.random() - 0.5) * (dist * 0.1); // Disk thickness increases with distance

            const pos = new THREE.Vector3(x, y, z);

            // Velocity: Circular orbit roughly
            // v = sqrt(GM/r)
            // But mass is distributed. Simple approx: central mass dominates or use a generic rotation curve.
            // Let's use Keplerian based on central mass for stable-ish look, though self-gravity matters.
            const G = physicsEngine.G;
            const vMag = Math.sqrt(G * center.mass / dist);

            // Tangent direction
            const vel = new THREE.Vector3(-z, 0, x).normalize().multiplyScalar(vMag);
            // Add random dispersion
            vel.add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.5));

            // Create Star
            // Color based on temperature/distance?
            const rCol = Math.random();
            const color = rCol > 0.8 ? 0xaaaaee : (rCol > 0.4 ? 0xffffff : 0xffaa88);

            const mass = 1 + Math.random() * 5;
            const size = 0.5 + Math.random();

            const star = new Body(`Star ${i}`, mass, size, pos, vel, color, 'star');
            physicsEngine.addBody(star);
            sceneManager.scene.add(star.mesh);
        }
    }
}
