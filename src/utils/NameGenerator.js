// Procedural name generation for randomness
export class NameGenerator {
    static getPlanetName() {
        const prefixes = ['Ke', 'Gliese', 'Co', 'Oru', 'Id', 'Tari', 'Xen', 'Vulp', 'Zor', 'Qua'];
        const suffixes = ['-b', '-c', '-d', ' Prime', ' Major', ' Minor', ' X', ' Y', ' Z'];
        const mid = ['la', 'ro', 'nu', 'si', 'te', 'mi', 'fa', 'so'];

        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const m = mid[Math.floor(Math.random() * mid.length)];
        const m2 = mid[Math.floor(Math.random() * mid.length)];
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];

        return p + m + m2 + s;
    }
}
