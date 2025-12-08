
import { computeHubs, generateItineraries } from '../src/lib/engine';

async function testEngine() {
    console.log('--- STARTING ENGINE TEST ---');

    // Test Case: Distant Pair (Borivali vs Seawoods)
    const members = [
        { location: 'Borivali, Mumbai', budget: 1000, moodTags: ['cafe', 'bowling'] },
        { location: 'Seawoods, Navi Mumbai', budget: 1000, moodTags: ['cafe', 'museum'] }
    ];

    console.log('Members:', members.map(m => m.location));

    // 1. Compute Hubs
    const hubs = await computeHubs(members);
    console.log('\nComputed Hubs:', hubs.map(h => `${h.name} (${h.type})`));

    // 2. Generate Itineraries
    const itineraries = await generateItineraries(members, hubs);

    console.log('\nGenerated Itineraries:', itineraries.length);
    console.log('Names:', itineraries.map(i => i.name));
    console.log('Archetypes:', itineraries.map(i => i.archetype));
}

testEngine().catch(console.error);
