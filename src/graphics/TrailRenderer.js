import * as THREE from 'three';

export class TrailRenderer {
    constructor(scene) {
        this.scene = scene;
        this.trails = new Map(); // Body -> Line
    }

    update(bodies) {
        // bodies is a list of active bodies
        const activeBodies = new Set(bodies);

        // Remove dead trails
        for (const [body, line] of this.trails) {
            if (!activeBodies.has(body) || body.isDead) {
                this.scene.remove(line);
                this.trails.delete(body);
            }
        }

        // Update or create trails
        for (const body of bodies) {
            if (!this.trails.has(body)) {
                // Create new trail
                const geometry = new THREE.BufferGeometry();
                // Pre-allocate buffer
                const maxPoints = 500;
                const positions = new Float32Array(maxPoints * 3);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setDrawRange(0, 0);

                const material = new THREE.LineBasicMaterial({
                    color: body.mesh.material.color || 0xffffff,
                    opacity: 0.5,
                    transparent: true
                });

                const line = new THREE.Line(geometry, material);
                line.userData = { points: [], maxPoints: maxPoints };
                this.scene.add(line);
                this.trails.set(body, line);
            }

            const line = this.trails.get(body);
            const data = line.userData;

            // Add current position every X frames or always?
            // To get a smooth curve, always.
            // But we need to shift array.

            // Optimization: only add point if moved enough?
            const lastPoint = data.points[data.points.length - 1];
            if (!lastPoint || body.position.distanceToSquared(lastPoint) > 0.1) {
                data.points.push(body.position.clone());
                if (data.points.length > data.maxPoints) {
                    data.points.shift();
                }

                // Update geometry
                const positions = line.geometry.attributes.position.array;
                for (let i = 0; i < data.points.length; i++) {
                    positions[i*3] = data.points[i].x;
                    positions[i*3+1] = data.points[i].y;
                    positions[i*3+2] = data.points[i].z;
                }
                line.geometry.setDrawRange(0, data.points.length);
                line.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
}
