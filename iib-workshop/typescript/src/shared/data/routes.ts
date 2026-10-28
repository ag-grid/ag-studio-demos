// Freight lanes, joined by `map-line` on `name`. No lane may cross the antimeridian: nothing
// splits geometry at 180 degrees, so it would be drawn back across the whole map.
export const routeTopology = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: { name: 'Rotterdam - New York' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.5, 52.0],
                    [-5.0, 49.5],
                    [-30.0, 45.0],
                    [-60.0, 41.5],
                    [-74.0, 40.7],
                ],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'Hamburg - Mumbai' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [10.0, 53.6],
                    [-9.5, 43.0],
                    [-6.0, 36.0],
                    [15.0, 34.0],
                    [32.5, 29.5],
                    [43.0, 12.5],
                    [60.0, 15.0],
                    [72.9, 19.1],
                ],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'Mumbai - Shanghai' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [72.9, 19.1],
                    [80.0, 6.0],
                    [95.0, 4.0],
                    [104.0, 1.3],
                    [110.0, 12.0],
                    [117.0, 23.0],
                    [121.5, 31.2],
                ],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'Sydney - Yokohama' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [151.2, -33.9],
                    [155.0, -20.0],
                    [150.0, 0.0],
                    [143.0, 20.0],
                    [139.6, 35.4],
                ],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'New York - Santos' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-74.0, 40.7],
                    [-70.0, 25.0],
                    [-60.0, 10.0],
                    [-45.0, -8.0],
                    [-46.3, -23.9],
                ],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'Santos - Durban' },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-46.3, -23.9],
                    [-25.0, -28.0],
                    [5.0, -32.0],
                    [31.0, -29.9],
                ],
            },
        },
    ],
};
