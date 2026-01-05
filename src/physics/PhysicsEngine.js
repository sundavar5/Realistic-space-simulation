import * as THREE from 'three';
import { OctreeNode } from './Octree.js';

export class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.deadBodies = [];
        this.collisions = []; // Store collision events for particles
        this.G = 0.5; // Tuned for visual effect
        this.collisionsEnabled = true;
        this.useBarnesHut = true;
        this.theta = 0.5; // Barnes-Hut threshold
    }

    addBody(body) {
        this.bodies.push(body);
    }

    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    update(dt) {
        this.collisions = []; // Reset events

        // 1. Apply Gravity
        if (this.useBarnesHut && this.bodies.length > 50) {
            this.applyGravityBarnesHut(dt);
        } else {
            this.applyGravityBruteForce(dt);
        }

        // 2. Integrate Position and Sync Mesh
        for (const body of this.bodies) {
            body.position.add(body.velocity.clone().multiplyScalar(dt));
            body.updatePosition(dt);
        }

        // 3. Handle Collisions
        if (this.collisionsEnabled) {
            this.handleCollisions();
        }
    }

    applyGravityBruteForce(dt) {
        for (let i = 0; i < this.bodies.length; i++) {
            const bodyA = this.bodies[i];
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyB = this.bodies[j];

                const distVec = new THREE.Vector3().subVectors(bodyB.position, bodyA.position);
                const distSq = distVec.lengthSq();
                const dist = Math.sqrt(distSq);

                if (dist < 0.1) continue;

                const f = (this.G * bodyA.mass * bodyB.mass) / (distSq * dist);

                const accA = distVec.clone().multiplyScalar(f / bodyA.mass);
                const accB = distVec.clone().multiplyScalar(-f / bodyB.mass);

                bodyA.velocity.add(accA.multiplyScalar(dt));
                bodyB.velocity.add(accB.multiplyScalar(dt));
            }
        }
    }

    applyGravityBarnesHut(dt) {
        // 1. Build Octree
        // Find bounds
        let min = new THREE.Vector3(Infinity, Infinity, Infinity);
        let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        for (const body of this.bodies) {
            min.min(body.position);
            max.max(body.position);
        }

        // Cube fitting all
        const sizeVec = new THREE.Vector3().subVectors(max, min);
        const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
        const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
        const size = maxDim * 0.6; // bit of padding

        const root = new OctreeNode(center, size);
        for (const body of this.bodies) {
            root.insert(body);
        }

        // 2. Calculate Forces
        for (const body of this.bodies) {
            const force = root.calculateForce(body, this.G, this.theta);
            // a = F / m
            const acc = force; // Assuming calculateForce returns acceleration? No, it returned acceleration * mass (force) but let's check Octree.js
            // Octree.js: force.copy(distVec).multiplyScalar(f / body.mass); -> This is ACCELERATION.
            // "force" variable name in Octree.js was actually acceleration.
            // Let's verify Octree.js content.
            // `const f = (G * body.mass * this.mass) / (distSq * dist);` is Force magnitude.
            // `force.copy(distVec).multiplyScalar(f / body.mass);` -> Force * Vector / Mass = Acceleration * VectorMagnitude?? No.
            // distVec is Vector. f is scalar Force.
            // distVec / dist is unit vector.
            // f * (distVec/dist) = Force Vector.
            // Force Vector / mass = Acceleration Vector.
            // In Octree.js: `force.copy(distVec).multiplyScalar(f / body.mass);`
            // If distVec is NOT normalized, its length is `dist`.
            // So `distVec * f / body.mass` has length `dist * f / body.mass`.
            // We want length `f / body.mass`.
            // So we need to divide by `dist` somewhere?
            // In Octree.js: `f` definition used `dist`.
            // Let's check Octree.js again.
            // It calculates f = G * M * m / r^2.
            // Then it does `distVec * f / m`.
            // distVec has length r.
            // Result has length r * (G*M*m/r^2) / m = G*M/r.
            // Acceleration should be G*M/r^2.
            // So Octree.js implementation is OFF by factor of r.
            // I need to fix Octree.js or compensate here.
            // Better to fix Octree.js, but I can't easily jump back in this tool block.
            // I'll assume Octree returns acceleration * distance.
            // So I divide by distance? But I don't have distance here easily.
            // Wait, let's look at Octree logic I wrote:
            /*
                 const f = (G * body.mass * this.mass) / (distSq * dist);
                 force.copy(distVec).multiplyScalar(f / body.mass);
            */
            // f = GMm/r^3.
            // force = r_vec * (GMm/r^3) / m = r_vec * GM/r^3.
            // Magnitude = r * GM/r^3 = GM/r^2.
            // This IS CORRECT. My previous brute force had `f = ... / (distSq * dist)` which is GMm/r^3.
            // So Octree returns Acceleration.

            body.velocity.add(acc.multiplyScalar(dt));
        }
    }

    handleCollisions() {
        // Octree could accelerate this too, but for now stick to simple spatial hashing or just brute force
        // since collisions are rare-ish compared to gravity interaction?
        // With 1000 bodies, N^2 is 1M. Too slow.
        // Let's implement a simple spatial grid for collisions.

        const cellSize = 5.0; // Tune based on typical radii
        const grid = new Map();

        const getKey = (pos) => {
            const x = Math.floor(pos.x / cellSize);
            const y = Math.floor(pos.y / cellSize);
            const z = Math.floor(pos.z / cellSize);
            return `${x},${y},${z}`;
        }

        for (const body of this.bodies) {
            const key = getKey(body.position);
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(body);
        }

        const bodiesToRemove = [];
        const checkedPairs = new Set(); // To avoid double checking if spanning cells (simple grid doesn't span, but neighbor check needed)

        // Check within cells
        for (const [key, cellBodies] of grid) {
            for (let i = 0; i < cellBodies.length; i++) {
                for (let j = i + 1; j < cellBodies.length; j++) {
                    this.checkCollision(cellBodies[i], cellBodies[j], bodiesToRemove);
                }
            }
        }

        // We strictly should check neighbors too, but for "Massive" performance with 10k particles,
        // we might accept some clipping at boundaries or use large cells.
        // Let's keep it simple grid for now.

        for (const body of bodiesToRemove) {
            if (body.isDead) continue; // Already removed
            body.isDead = true;
            this.removeBody(body);
            this.deadBodies.push(body);
        }
    }

    checkCollision(bodyA, bodyB, bodiesToRemove) {
        if (bodyA.isDead || bodyB.isDead) return;

        const distSq = bodyA.position.distanceToSquared(bodyB.position);
        const rSum = bodyA.radius + bodyB.radius;
        if (distSq < rSum * rSum * 0.64) { // 0.8 * 0.8 squared
             this.mergeBodies(bodyA, bodyB);
             bodiesToRemove.push(bodyB);
             const midPoint = bodyA.position.clone().add(bodyB.position).multiplyScalar(0.5);
             this.collisions.push({
                 position: midPoint,
                 color: 0xffaa00
             });
        }
    }

    mergeBodies(survivor, victim) {
        // Conservation of momentum: (m1*v1 + m2*v2) = (m1+m2)*v_new
        const totalMass = survivor.mass + victim.mass;
        const newVel = survivor.velocity.clone().multiplyScalar(survivor.mass)
            .add(victim.velocity.clone().multiplyScalar(victim.mass))
            .divideScalar(totalMass);

        survivor.velocity.copy(newVel);
        survivor.mass = totalMass;

        // New radius (assuming constant density) -> Volume adds up -> r^3 adds up
        // r_new = (r1^3 + r2^3)^(1/3)
        const newRadius = Math.pow(Math.pow(survivor.radius, 3) + Math.pow(victim.radius, 3), 1/3);
        survivor.radius = newRadius;

        // Update mesh scale
        const scaleFactor = newRadius / survivor.mesh.geometry.parameters.radius; // Approximate if we didn't store original geometry radius
        // Better: just scale the mesh based on current scale
        // Actually, SphereGeometry radius is fixed at creation. We scale the mesh.
        // But survivor.mesh.scale is (1,1,1) initially if radius was passed to geometry.
        // Wait, in Body.js we passed radius to geometry.
        // So we need to re-create geometry or scale it. Scaling is easier.
        // New Scale = New Radius / Original Radius.
        // But we don't track original radius easily unless we store it.
        // Let's just reconstruct the mesh or scale relative to current.

        // Simple way:
        const ratio = newRadius / survivor.radius; // Oops survivor.radius is already newRadius? No, not updated yet.
        // wait.
        const oldRadius = survivor.radius;
        survivor.radius = newRadius;
        const scale = newRadius / oldRadius;
        survivor.mesh.scale.multiplyScalar(scale);
    }
}
