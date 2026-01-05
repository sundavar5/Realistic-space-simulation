import * as THREE from 'three';

export class TextureGenerator {
    static createPlanetTexture(color1, color2, seed) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Simple noise approximation
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;

        // Random noise
        for (let i = 0; i < data.length; i += 4) {
            const val = Math.random();
            const c1 = new THREE.Color(color1);
            const c2 = new THREE.Color(color2);

            // Lerp based on noise (very crude, but works for "rocky")
            const c = c1.lerp(c2, val);

            data[i] = c.r * 255;
            data[i + 1] = c.g * 255;
            data[i + 2] = c.b * 255;
            data[i + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);

        // Add some "craters" or bands
        ctx.globalCompositeOperation = 'overlay';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 50;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    static createStarTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        grad.addColorStop(0, 'white');
        grad.addColorStop(0.2, 'rgba(255, 255, 200, 1)');
        grad.addColorStop(0.5, 'rgba(255, 200, 100, 0.4)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        return new THREE.CanvasTexture(canvas);
    }
}
