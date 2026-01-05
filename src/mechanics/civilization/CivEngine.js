import { TechTree } from './TechTree.js';
import { EventDatabase } from './EventDatabase.js';

export class CivEngine {
    constructor() {
        this.civilizations = new Map(); // Body -> Civ Data
    }

    initCivilization(body) {
        if (this.civilizations.has(body)) return;

        this.civilizations.set(body, {
            population: 1000,
            techLevel: 0,
            researchedTechs: [],
            history: [],
            happiness: 100,
            growthRate: 0.01
        });
    }

    update(dt) {
        // Slow update logic, maybe call only once per second externally
        for (const [body, civ] of this.civilizations) {
            // Growth
            civ.population *= (1 + civ.growthRate * dt);

            // Tech Research
            if (Math.random() < 0.01 * dt) {
                this.discoverTech(civ);
            }

            // Random Events
            if (Math.random() < 0.001 * dt) {
                this.triggerEvent(civ);
            }
        }
    }

    discoverTech(civ) {
        // Pick random tech not researched
        // Real implementation would traverse tree
        // Mock: just increment level
        civ.techLevel++;
        civ.history.push(`Year ${Math.floor(Date.now()/1000)}: Tech Level ${civ.techLevel} reached.`);
    }

    triggerEvent(civ) {
        const event = EventDatabase[Math.floor(Math.random() * EventDatabase.length)];
        civ.population *= (1 + event.populationChange);
        civ.history.push(`Event: ${event.type} - ${event.description}`);
    }

    getCivData(body) {
        return this.civilizations.get(body);
    }
}
