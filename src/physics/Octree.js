import * as THREE from 'three';

export class OctreeNode {
    constructor(center, size) {
        this.center = center.clone(); // Vector3
        this.size = size; // Half-width
        this.mass = 0;
        this.centerOfMass = new THREE.Vector3(0, 0, 0);
        this.body = null; // Leaf node stores body
        this.children = []; // 8 children
        this.isLeaf = true;
    }

    insert(body) {
        if (this.isLeaf && this.body === null) {
            this.body = body;
            this.mass = body.mass;
            this.centerOfMass.copy(body.position);
            return;
        }

        // Convert to internal node if needed
        if (this.isLeaf) {
            this.isLeaf = false;
            const oldBody = this.body;
            this.body = null;
            this._insertIntoChildren(oldBody);
        }

        this._insertIntoChildren(body);
        this._updateMassDistribution();
    }

    _insertIntoChildren(body) {
        const octant = this._getOctant(body.position);
        if (!this.children[octant]) {
            const offset = new THREE.Vector3(
                (octant & 1) ? 0.5 : -0.5,
                (octant & 2) ? 0.5 : -0.5,
                (octant & 4) ? 0.5 : -0.5
            ).multiplyScalar(this.size);

            this.children[octant] = new OctreeNode(
                this.center.clone().add(offset),
                this.size * 0.5
            );
        }
        this.children[octant].insert(body);
    }

    _getOctant(pos) {
        let octant = 0;
        if (pos.x >= this.center.x) octant |= 1;
        if (pos.y >= this.center.y) octant |= 2;
        if (pos.z >= this.center.z) octant |= 4;
        return octant;
    }

    _updateMassDistribution() {
        this.mass = 0;
        this.centerOfMass.set(0, 0, 0);

        let childCount = 0;
        for (const child of this.children) {
            if (child) {
                this.mass += child.mass;
                const weightedPos = child.centerOfMass.clone().multiplyScalar(child.mass);
                this.centerOfMass.add(weightedPos);
                childCount++;
            }
        }

        if (this.mass > 0) {
            this.centerOfMass.divideScalar(this.mass);
        }
    }

    calculateForce(body, G, theta = 0.5) {
        const force = new THREE.Vector3(0, 0, 0);

        // Distance to center of mass
        const distVec = new THREE.Vector3().subVectors(this.centerOfMass, body.position);
        const distSq = distVec.lengthSq();
        const dist = Math.sqrt(distSq);

        // 1. If leaf and not self
        if (this.isLeaf) {
            if (this.body && this.body !== body) {
                if (dist < 0.1) return force; // Softening handled externally usually, but check here
                const f = (G * body.mass * this.mass) / (distSq * dist);
                force.copy(distVec).multiplyScalar(f / body.mass); // Acceleration
            }
            return force;
        }

        // 2. Barnes-Hut approximation criteria: s / d < theta
        // s = width of region (this.size * 2)
        // d = distance
        if ((this.size * 2) / dist < theta) {
            // Treat as single body
             if (dist < 0.1) return force;
             const f = (G * body.mass * this.mass) / (distSq * dist);
             force.copy(distVec).multiplyScalar(f / body.mass);
             return force;
        }

        // 3. Recurse
        for (const child of this.children) {
            if (child) {
                force.add(child.calculateForce(body, G, theta));
            }
        }

        return force;
    }
}
