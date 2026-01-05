import * as THREE from 'three';

export class Starfield {
    constructor(scene, count = 5000) {
        this.scene = scene;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        const color = new THREE.Color();
        const r = 2000; // Radius of starfield

        for (let i = 0; i < count; i++) {
            // Random position in sphere
            const x = (Math.random() - 0.5) * r;
            const y = (Math.random() - 0.5) * r;
            const z = (Math.random() - 0.5) * r;

            positions.push(x, y, z);

            // Random star color (bluish to reddish)
            const type = Math.random();
            if (type > 0.9) color.setHex(0xaaaaff); // Blue giant
            else if (type > 0.6) color.setHex(0xffffff); // Sun like
            else color.setHex(0xffaa88); // Red dwarf

            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            sizeAttenuation: false // Make them constant size dots
        });

        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);
    }
}
