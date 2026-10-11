# German nature protection areas overlay

## Goal

The app can overlay Germany's nature protection areas and national parks as a transparent WMS layer on top of the selected base map. The layer is optional and disabled by default.

## Current implementation

### 1. State model and persistence

The feature is represented as a boolean in [MapState](../src/components/map_state.ts):

- `german_npa` defaults to `false`.
- `set_german_npa(enabled)` stores the value in browser storage and triggers the usual observer update flow.
- The value is persisted under the local-storage key `german_npa` and restored in `restore()`.
- The storage cleanup allowlist includes `german_npa`, so it is retained when stale keys are removed.
- The JSON import/export schema also includes `german_npa`, so the option survives app-level state serialization and restoration.

Relevant code paths:

- [MapState.german_npa](../src/components/map_state.ts)
- [MapState.restore()](../src/components/map_state.ts)
- [MapState.clear_storage()](../src/components/map_state.ts)
- [MapState.to_json()](../src/components/map_state.ts)
- [MapState.parse_json()](../src/components/map_state.ts)

### 2. Leaflet WMS layer

The actual overlay is created and managed in [LeafletWrapper](../src/components/leaflet_wrapper.ts):

- The wrapper keeps an internal `german_npa_layer` and a boolean `german_npa_enabled`.
- `set_german_npa(enabled)` checks whether the state changed before doing anything.
- When enabled and the layer does not yet exist, it creates a WMS tile layer:

```ts
this.german_npa_layer = L.tileLayer.wms(
    "https://geodienste.bfn.de/ogc/wms/schutzgebiet?",
    {
        layers: "Naturschutzgebiete,Nationalparke",
        format: "image/png",
        transparent: true,
        opacity: 0.5,
        attribution: "Bundesamt für Naturschutz (BfN)",
    },
);
```

- The layer is added to the Leaflet map with `this.map.addLayer(this.german_npa_layer)`.
- When disabled, it is removed with `this.map.removeLayer(this.german_npa_layer)`.
- The layer remains independent of the selected base map, so the user can switch map styles while keeping the overlay on or off.

Important details:

- WMS endpoint: `https://geodienste.bfn.de/ogc/wms/schutzgebiet?`
- Layers requested: `Naturschutzgebiete,Nationalparke`
- Render format: PNG with transparency
- Opacity: `0.5`
- Attribution: `Bundesamt für Naturschutz (BfN)`

### 3. Sidebar toggle and user-facing strings

The checkbox is wired in [SidebarLayers](../src/components/sidebar_layers.ts) and rendered in [src/index.html](../src/index.html):

- The checkbox is selected via `[data-german-npa-layer]`.
- Its checked state is initialized from `app.map_state.german_npa`.
- Changing it calls `this.app.map_state.set_german_npa(...)`.
- The sidebar does not maintain a separate UI-only state; it mirrors the map-state value.

The UI text is localized in:

- [src/lang/de/translation.json](../src/lang/de/translation.json)
- [src/lang/en/translation.json](../src/lang/en/translation.json)
- [src/lang/fr/translation.json](../src/lang/fr/translation.json)

The relevant labels are:

- `sidebar.layers.german_npa`: "Naturschutzgebiete (Deutschland)" / "Nature Protection Areas (Germany)" / "Réserves naturelles (Allemagne)"
- `sidebar.layers.german_npa-help`: descriptive help text explaining that the overlay shows German protected areas as red shapes.
- `sidebar.layers.german_npa_button`: link text for the official BfN web map.

The HTML also includes a direct link to the official BfN protected-area map:

- `https://geodienste.bfn.de/schutzgebiete`

### 4. Data source and provider disclosure

The overlay is provided by the German federal authority for nature conservation, the Bundesamt für Naturschutz (BfN). This is the same source referenced by the help text and the link in the Layers panel.

The app presents the layer as an overlay of red protected areas and national parks, rather than as vector features stored in the app itself. The rendered data is fetched live from the BfN WMS service, and the map remains fully browser-driven.

WMS tiles are external requests and can fail independently of the checkbox and
map state. On the first tile failure during an enabled session, the app shows a
localized error notification; it suppresses further notifications until the
layer is toggled again.

## Behavior summary

- Default state: off
- Toggle location: Layers panel
- Layer type: WMS overlay
- Provider: BfN
- Visual style: transparent red overlay with 50% opacity
- Persistence: browser local storage plus state serialization

## Current caveats

This implementation is intentionally lightweight: it is a single toggle for a
live external WMS overlay. The layer depends on BfN service availability; when
the service is unavailable, no overlay can be drawn and the app reports the
tile-loading failure. There is no app-managed geodata cache, no custom styling
layer in the frontend, and no per-area metadata viewer beyond the source link
and the map overlay itself.
