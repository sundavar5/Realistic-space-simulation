import * as THREE from 'three';

export class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.deadBodies = [];
        this.G = 0.5; // Tuned for visual effect
        this.collisionsEnabled = true;
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
        // Reset forces/accelerations?
        // We will directly modify velocity for semi-implicit Euler.

        // 1. Apply Gravity (Velocity update)
        for (let i = 0; i < this.bodies.length; i++) {
            const bodyA = this.bodies[i];
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyB = this.bodies[j];

                const distVec = new THREE.Vector3().subVectors(bodyB.position, bodyA.position);
                const distSq = distVec.lengthSq();
                const dist = Math.sqrt(distSq);

                // Softening parameter to avoid fling at 0 distance
                const softening = 0.5;
                if (dist < 0.1) continue;

                const f = (this.G * bodyA.mass * bodyB.mass) / (distSq * dist); // F/r = (G*m1*m2/r^2)/r = G*m1*m2/r^3. Multiplied by vector r gives Force vector.

                // Acceleration = Force / Mass
                const accA = distVec.clone().multiplyScalar(f / bodyA.mass); // Vector pointing A->B scaled by acceleration magnitude
                const accB = distVec.clone().multiplyScalar(-f / bodyB.mass); // Vector pointing B->A

                bodyA.velocity.add(accA.multiplyScalar(dt));
                bodyB.velocity.add(accB.multiplyScalar(dt));
            }
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

    handleCollisions() {
        // Naive O(N^2) check
        const bodiesToRemove = [];

        for (let i = 0; i < this.bodies.length; i++) {
            if (bodiesToRemove.includes(this.bodies[i])) continue;

            for (let j = i + 1; j < this.bodies.length; j++) {
                if (bodiesToRemove.includes(this.bodies[j])) continue;

                const bodyA = this.bodies[i];
                const bodyB = this.bodies[j];

                const dist = bodyA.position.distanceTo(bodyB.position);
                if (dist < (bodyA.radius + bodyB.radius) * 0.8) { // 0.8 factor for a bit of overlap merge
                    // Merge B into A
                    this.mergeBodies(bodyA, bodyB);
                    bodiesToRemove.push(bodyB);
                }
            }
        }

        for (const body of bodiesToRemove) {
            body.isDead = true;
            this.removeBody(body);
            this.deadBodies.push(body);
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
