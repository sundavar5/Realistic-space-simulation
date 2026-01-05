import { MaterialDatabase } from './MaterialDatabase.js';

export class ChemistryEngine {
    constructor() {
        this.materials = Object.values(MaterialDatabase);
    }

    generatePlanetComposition(mass, radius, temperature, starType = 'G') {
        const composition = {};
        let totalMass = 0;

        // Simplified Logic:
        // Small planets -> Rocks (Silicates, Iron)
        // Large planets -> Gas (Hydrogen, Helium)

        const isGasGiant = mass > 100; // Earth masses approx (in our scale)

        for (const mat of this.materials) {
            let probability = mat.abundance;

            // Adjust based on planet type
            if (isGasGiant) {
                if (mat.name.startsWith('Hydrogen') || mat.name.startsWith('Helium')) {
                    probability *= 100;
                }
            } else {
                if (mat.density > 2000) { // Rock/Metal
                    probability *= 50;
                }
                // Volatiles boil off if hot
                if (mat.boilingPoint < temperature) {
                    probability *= 0.01;
                }
            }

            // Random factor
            const amount = Math.random() * probability;
            if (amount > 0.001) {
                composition[mat.name] = amount;
                totalMass += amount;
            }
        }

        // Normalize
        for (const key in composition) {
            composition[key] /= totalMass;
        }

        return composition;
    }

    determineState(composition, temperature) {
        // Return mostly Solid, Liquid, or Gas based on dominant materials
        let gasCount = 0;
        let liquidCount = 0;
        let solidCount = 0;

        for (const [name, fraction] of Object.entries(composition)) {
            const mat = MaterialDatabase[name];
            if (!mat) continue;

            if (temperature > mat.boilingPoint) gasCount += fraction;
            else if (temperature > mat.meltingPoint) liquidCount += fraction;
            else solidCount += fraction;
        }

        if (gasCount > 0.5) return 'Gas Giant';
        if (liquidCount > 0.5) return 'Ocean World';
        return 'Rocky World';
    }
}
