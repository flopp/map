# Map state change notifications

`MapState` notifies its observers synchronously after a state mutation. The
notification says which parts changed; observers read the updated values from
`App.map_state`. The contract is defined by `MapStatePart` and
`MapStateChange` in [`map_state.ts`](../src/components/map_state.ts), and
consumed by [`MapStateObserver`](../src/components/map_state_observer.ts).

## Change object

`MapStateChange` contains:

- `parts`: a read-only set of the changed `MapStatePart` names.
- `marker_id`: an optional ID for a targeted marker update. When absent, an
  observer should refresh the marker collection as a whole.

For example, `set_view()` changes both center and zoom, and reports both
explicitly:

```ts
map_state_change(["center", "zoom"])
```

An edit to one marker identifies both the changed collection and the specific
item:

```ts
map_state_change(["markers"], marker_id)
```

There is no `-1` marker sentinel. A missing `marker_id` means that all markers
may need refreshing. A change can contain multiple state parts, such as
`["markers", "lines"]`.

## State parts

| Part | Meaning |
| --- | --- |
| `sidebar` | The selected/open sidebar section changed. |
| `map_type` | The base map type changed. |
| `german_npa` | The German NPA overlay setting changed. |
| `center` | The map center changed. |
| `zoom` | The map zoom changed. |
| `markers` | Marker items, order, or marker settings changed. |
| `lines` | Line items, order, or line settings changed. |
| `language` | The selected language changed. |
| `hillshading` | Hillshading changed. |

Center and zoom are separate parts so an observer can react to either change
individually. `set_view()` reports both. German NPA is separate from base map
type, even though both are applied by the map view. Marker and line settings
are grouped with their respective collections because observers already
refresh the relevant collection UI or map objects for both kinds of change.

## Derived changes and full refreshes

`MapState.update_observers()` recomputes line distances and bearings when a
notification includes `markers` or `lines`. If that recomputation changes
derived line values, the outgoing notification also includes `lines`.
Consequently, moving one marker may be reported as both `markers` and `lines`.

Operations that replace or restore the full state notify with
`ALL_MAP_STATE_PARTS`. This constant is also used when initializing observers
that need an initial full refresh.

## Observer implementation

Observers test named parts with `changes.parts.has(...)`:

```ts
public update_state(changes: MapStateChange): void {
    if (changes.parts.has("center") || changes.parts.has("markers")) {
        // Refresh UI that depends on the center or markers.
    }
}
```

For marker-specific work, check `changes.marker_id !== undefined`; do not infer
targeting from a numeric sentinel. If the ID is present, the marker may have
been added, edited, or deleted, so query `MapState` to determine its current
state. If it is absent, refresh from the full marker collection.

## Adding a state part

When adding a separately observable state property:

1. Add its literal name to `MapStatePart` and `ALL_MAP_STATE_PARTS`.
2. Have the relevant mutation setter report it through `map_state_change()`.
3. Update each affected observer to test the named part.
4. Extend the state-notification tests and this list.

Keep a notification narrow: report the state that actually changed, and add
other parts only when the mutation also changes them or when derived values
require their refresh.
