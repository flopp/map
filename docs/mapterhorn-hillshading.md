# Optional Mapterhorn hillshading overlay

## Goal

Add an optional hillshading tile overlay using
`https://tiles.mapterhorn.com/{z}/{x}/{y}.webp`. Users can enable or disable it
from the existing **Layers** sidebar. Its enabled state must persist between
visits and be included in shareable map links. When enabled, the map must show
the provider attribution required by Mapterhorn.

## Implementation plan

1. **Add hillshading to map state**
   - Add a boolean hillshading property to `MapState`, defaulting to `false`.
   - Persist it under a dedicated local-storage key in `store()` and restore it
     in `restore()`, following the existing German nature-protection overlay
     pattern. Include the key in any storage-key validation/cleanup allowlist.
   - Add a setter that stores the new value and notifies observers. Use an
     appropriate map-layer state change so the map and sidebar stay synchronized
     without conflating hillshading with a base-map change.
   - Preserve compatibility: missing stored values and older shared links mean
     hillshading is off.
   - Include the property in the map-state JSON import/export shape as well as
     local storage and share links.

2. **Create and manage the Leaflet tile layer**
   - Mapterhorn's TileJSON describes the endpoint as 512px Terrarium-encoded
     elevation tiles, not pre-rendered shaded imagery. Add the
     `leaflet-relief` dependency and configure `L.gridLayer.relief` in
     `LeafletWrapper` for hillshade mode, using its Mapterhorn URL, elevation
     decoder, and attribution helpers with a 512px tile size. Adjust the
     Leaflet grid zoom by one when constructing the Mapterhorn XYZ URL: a
     512px Leaflet tile covers the extent of one lower standard XYZ zoom.
     Increase Leaflet's `maxNativeZoom` by one accordingly so the source's
     highest native zoom remains reachable.
   - Mapterhorn's TileJSON currently specifies the attribution
     `<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>`.
   - Add or remove that layer through a dedicated method driven by map state.
     Keep it independent of base-layer switching so changing the base map
     doesn't unexpectedly disable the overlay.
   - Check stacking with the base map and existing overlays (including German
     protected areas and the ArcGIS OSM overlay) so hillshading remains useful
     without obscuring markers or other foreground map content. Leaflet should
     display the configured attribution only while the layer is active.

3. **Expose the toggle in the Layers sidebar**
   - Add a hillshading checkbox under the existing “Additional Layers” section
     in `src/index.html`.
   - Wire the checkbox in `SidebarLayers` to the new map-state setter, initialize
     it from state, and update it when state changes (including when loading a
     shared link).
   - Add translated label and help text to the English, German, and French
     translation files.

4. **Include the setting in shareable links**
   - Extend `MapState.create_link()` with a compact query parameter indicating
     hillshading is enabled. Omit the parameter when disabled to keep links
     concise.
   - Parse the parameter in `restore_from_url()` and apply it consistently with
     the existing view and layer state. Define the existing precedence clearly:
     a share-link value must take effect when a link is opened, while a missing
     parameter preserves compatibility with older links and defaults to off.
   - Ensure applying URL state updates local storage, the Leaflet layer, and
     the sidebar checkbox through the normal state/observer flow.

5. **Update provider disclosure and documentation**
   - Add Mapterhorn to both the German and English third-party map-layer lists
     in `src/privacy.html`, since enabling the overlay causes the browser to
     request tiles from that provider.
   - Keep the in-map attribution as the operative attribution for rendered
     tiles; the privacy-policy entry is a provider disclosure, not a substitute.

6. **Test and verify**
   - Add focused map-state tests for the default-off behavior, local-storage
     persistence/restoration, and share-link round-tripping for both enabled
     and disabled states.
   - Verify loading old links with no hillshading parameter leaves it off, and
     loading an enabled link activates the overlay and checks the sidebar.
   - Verify toggling the checkbox adds/removes the Mapterhorn requests and its
     attribution while leaving the selected base layer unchanged; also check
     overlay ordering against existing layers.
   - Run `make lint` and `make test`.

## Acceptance criteria

- Hillshading is off by default and can be toggled from the Layers sidebar.
- The selected setting survives reloads and round-trips through a shared link.
- Older shared links continue to load with hillshading disabled.
- Mapterhorn attribution is visible on the map exactly when its layer is
  enabled, and the provider is listed in both privacy-policy language sections.
- Enabling or disabling hillshading does not replace the current base layer or
  hide markers and lines.
