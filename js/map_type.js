const MapType = {
    OPENSTREETMAP: 'OPENSTREETMAP',
    OPENTOPOMAP: 'OPENTOPOMAP',
    STAMEN_TERRAIN: 'STAMEN_TERRAIN',
    ARCGIS_WORLDIMAGERY: 'ARCGIS_WORLDIMAGERY',
    GOOGLE_ROADMAP: 'GOOGLE_ROADMAP',
    GOOGLE_SATELLITE: 'GOOGLE_SATELLITE',
    GOOGLE_HYBRID: 'GOOGLE_HYBRID',
    GOOGLE_TERRAIN: 'GOOGLE_TERRAIN',
    BING_ROAD: 'BING_ROAD',
    BING_AERIAL: 'BING_AERIAL',
    BING_AERIAL_NO_LABELS: 'BING_AERIAL_NO_LABELS',
};

if (Object.freeze) {
    Object.freeze(MapType);
}

const maptype2string = (type) => {
    return type;
};

const string2maptype = (s) => {
    switch (s.toUpperCase()) {
        case MapType.OPENSTREETMAP:
            return MapType.OPENSTREETMAP;
        case MapType.OPENTOPOMAP:
            return MapType.OPENTOPOMAP;
        case MapType.STAMEN_TERRAIN:
            return MapType.STAMEN_TERRAIN;
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
        case MapType.BING_ROAD:
            return MapType.BING_ROAD;
        case MapType.BING_AERIAL:
            return MapType.BING_AERIAL;
        case MapType.BING_AERIAL_NO_LABELS:
            return MapType.BING_AERIAL_NO_LABELS;
    }
    return null;
};

const maptype2human = (t) => {
    switch (t) {
        case MapType.OPENSTREETMAP:
            return 'OpenStreetMap';
        case MapType.OPENTOPOMAP:
            return 'OpenTopoMap';
        case MapType.STAMEN_TERRAIN:
            return 'Stamen Terrain';
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
        case MapType.BING_ROAD:
            return 'Bing Road';
        case MapType.BING_AERIAL:
            return 'Bing Aerial';
        case MapType.BING_AERIAL_NO_LABELS:
            return 'Bing Aerial (no labels)';
    }
    return 'Unknown';
};

const isGoogle = (t) => {
    switch (t) {
        case MapType.GOOGLE_ROADMAP:
        case MapType.GOOGLE_SATELLITE:
        case MapType.GOOGLE_HYBRID:
        case MapType.GOOGLE_TERRAIN:
            return true;
    }
    return false;
};

const isBing = (t) => {
    switch (t) {
        case MapType.BING_ROAD:
        case MapType.BING_AERIAL:
        case MapType.BING_AERIAL_NO_LABELS:
            return true;
    }
    return false;
};

export {
    MapType,
    maptype2string,
    maptype2human,
    string2maptype,
    isGoogle,
    isBing,
};
