
import { geocodeLocation, reverseGeocode } from '../src/lib/geoapify';

async function testGeocoding() {
    const places = [
        'Borivali, Mumbai',
        'Seawoods, Navi Mumbai'
    ];

    for (const place of places) {
        console.log(`Geocoding: ${place}`);
        const coords = await geocodeLocation(place);
        console.log('Result:', coords);

        if (coords) {
            const reverse = await reverseGeocode(coords.lat, coords.lng);
            console.log('Reverse:', reverse);
        }
        console.log('---');
    }
}

testGeocoding();
