const MapType = {
    OPENSTREETMAP: 'OPENSTREETMAP',
    OPENTOPOMAP: 'OPENTOPOMAP',
    STAMEN_TERRAIN: 'STAMEN_TERRAIN',
    HUMANITARIAN: 'HUMANITARIAN',
    ARCGIS_WORLDIMAGERY: 'ARCGIS_WORLDIMAGERY',
    GOOGLE_ROADMAP: 'GOOGLE_ROADMAP',
    GOOGLE_SATELLITE: 'GOOGLE_SATELLITE',
    GOOGLE_HYBRID: 'GOOGLE_HYBRID',
    GOOGLE_TERRAIN: 'GOOGLE_TERRAIN',
};

if (Object.freeze) {
    Object.freeze(MapType);
}

function maptype2string(type: string): string {
    return type;
}

function string2maptype(s: string): string {
    switch (s.toUpperCase()) {
        case MapType.OPENSTREETMAP:
            return MapType.OPENSTREETMAP;
        case MapType.OPENTOPOMAP:
            return MapType.OPENTOPOMAP;
        case MapType.STAMEN_TERRAIN:
            return MapType.STAMEN_TERRAIN;
        case MapType.HUMANITARIAN:
            return MapType.HUMANITARIAN;
        case MapType.ARCGIS_WORLDIMAGERY:
            return MapType.ARCGIS_WORLDIMAGERY;
        case MapType.GOOGLE_ROADMAP:
            return MapType.GOOGLE_ROADMAP;
        case MapType.GOOGLE_SATELLITE:
            return MapType.GOOGLE_SATELLITE;
        case MapType.GOOGLE_HYBRID:
            return MapType.GOOGLE_HYBRID;
        case MapType.GOOGLE_TERRAIN:
            return MapType.GOOGLE_TERRAIN;
    }
    return null;
}

function maptype2human(t: string): string {
    switch (t) {
        case MapType.OPENSTREETMAP:
            return 'OpenStreetMap';
        case MapType.OPENTOPOMAP:
            return 'OpenTopoMap';
        case MapType.STAMEN_TERRAIN:
            return 'Stamen Terrain';
        case MapType.HUMANITARIAN:
            return 'Humanitarian';
        case MapType.ARCGIS_WORLDIMAGERY:
            return 'Arcgis World Imagery';
        case MapType.GOOGLE_ROADMAP:
            return 'Google Roadmap';
        case MapType.GOOGLE_SATELLITE:
            return 'Google Satellite';
        case MapType.GOOGLE_HYBRID:
            return 'Google Hybrid';
        case MapType.GOOGLE_TERRAIN:
            return 'Google Terrain';
    }
    return 'Unknown';
}

function isGoogle(t: string): boolean {
    switch (t) {
        case MapType.GOOGLE_ROADMAP:
        case MapType.GOOGLE_SATELLITE:
        case MapType.GOOGLE_HYBRID:
        case MapType.GOOGLE_TERRAIN:
            return true;
    }
    return false;
}

export {
    MapType,
    maptype2string,
    maptype2human,
    string2maptype,
    isGoogle,
};
