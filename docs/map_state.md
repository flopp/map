# Map state architecture

This document describes how map state is currently represented, changed,
persisted, and observed, followed by improvement opportunities. It is intended
as a guide for incremental work; the recommendations below are not yet
implemented.

## State ownership and data model

[`MapState`](../src/components/map_state.ts) is the central state container and
mutation API. It is created by [`App`](../src/components/app.ts) and holds:

- Map view and display preferences: center, zoom, map type, hillshading, German
  NPA overlay, language, and open sidebar section.
- Marker and line collections, along with maps keyed by model ID for lookup.
- Default marker and line settings.
- A `Storage` instance and a list of observers.

[`Marker`](../src/components/marker.ts) and [`Line`](../src/components/line.ts)
are model objects with read-only data properties and controlled update methods.
Their IDs are allocated by module-level counters. Lines refer to marker IDs and
hold derived distance and bearing values, which `MapState.recompute_lines()`
updates when marker or line state changes.

Marker and line collections are private to `MapState`; their public accessors
return read-only snapshots that do not alias the stored arrays. The snapshot
model types omit mutation methods. The ID indexes are also private. Callers use
state operations to add, update, delete, sort, and reorder models, so collection
changes, indexes, persistence, and notifications remain coordinated.

## State lifecycle

During [`App` construction](../src/components/app.ts), the application:

1. Creates `MapState` and the language observer.
2. Parses URL state, restores persisted browser state, and removes unrecognized
   storage keys.
3. Creates the map and sidebar components. The Leaflet wrapper registers as an
   observer and is initialized from the restored state.
4. Applies URL state if present. When stored markers or lines already exist,
   the app asks before replacing them.

Restoring state calls ordinary setters. Those setters persist values and notify
any observers already registered, so the exact observers receiving restore
notifications depends on construction order.

## Mutations, persistence, and notifications

Most scalar setters update an in-memory field, write the corresponding
`localStorage` value through [`Storage`](../src/components/storage.ts), and
call `update_observers()` with a `MapStateChange` bit flag. Marker and line
operations generally follow the same pattern. Some operations also display a
user notification through `App`.

`MapStateChange` flags allow observers to update only relevant UI. For marker
and line changes, `update_observers()` also recomputes line distances and
bearings and adds the `LINES` flag if those derived values changed. The
optional marker ID supports targeted marker updates.

[`MapStateObserver`](../src/components/map_state_observer.ts) registers
subclasses with `MapState`. The main consumers include:

- [`LeafletWrapper`](../src/components/leaflet_wrapper.ts), which mirrors map
  view, layers, markers, and lines into Leaflet objects. It reports map
  movement and marker dragging back through `MapState` setters.
- Sidebar components, which render marker and line lists and map controls.
- `Language`, which reacts to language changes and localizes the UI.

The observer callbacks are synchronous. They receive a change mask and,
optionally, a marker ID; they read the current state from `App.map_state`.

## Persistence and interchange

`Storage` wraps browser `localStorage` with typed getters and setters. The
current storage schema version is 2 and includes a migration from version 1.
Most values are stored under separate keys; marker and line order is stored as
semicolon-separated ID lists, with model fields stored under ID-based keys.
`MapState.clear_storage()` removes keys outside its allowlist.

`MapState` also owns serialization and import/export:

- URL query parameters encode view, map type, hillshading, markers, and lines.
  `parse_url_state()` creates parsed URL data and `apply_url_state()` replaces
  the corresponding state, persists it, and notifies observers.
- JSON export includes view, overlays, settings, markers, and lines. JSON
  import updates fields and collections, then stores and notifies.
- GPX import/export handles waypoints and tracks. Import can replace existing
  marker/line collections or append to them.

## Findings and improvement opportunities

These findings describe maintainability and consistency risks in the current
design; they are not claims that all of them cause a user-visible defect.

### 1. Centralize mutations and protect invariants

**Current situation:** Collections and model fields are now encapsulated.
[`MultiMarkersDialog`](../src/components/multi_markers_dialog.ts) adds markers
through one bulk state operation; [`ProjectionDialog`](../src/components/projection_dialog.ts)
passes new marker and line attributes into state operations. Marker and line
editors also use cohesive state updates instead of editing model fields and
then separately writing storage and notifying observers.

**Remaining risk:** The internal model classes have update methods, but
`MapState` returns view types that omit those methods. Keep returning these view
types rather than exposing mutable model references to application components.
Array accessors return snapshots to prevent callers from mutating the store's
collections.

**Implementation:** Collection storage and ID indexes are private.
`markers`/`lines` expose read-only snapshots; model data uses read-only
properties. `add_markers()`, `update_marker()`, and `update_line()` coordinate
model changes with persistence and a single observer notification. Add and
update operations accept attributes, so callers do not need to mutate returned
objects. Keep direct model updates inside `MapState`.

### 2. Make persistence and notification behavior consistent

**Current situation:** Many setters persist and notify immediately, while
imports, restores, and some callers use a different sequence. Marker and line
reordering now persist order and notify observers. Some dialog workflows still
explicitly call storage and notification methods after editing objects.

**Risk:** Consumers can become stale, and multi-step changes can produce
intermediate notifications or repeat persistence work.

**Improvement:** Define one mutation boundary with explicit semantics for
persisting and notifying. Support batching or transactions for compound
operations such as import and bulk marker creation; notify once after the
completed change. Keep tests covering ordering notifications as the UI
consumers evolve.

### 3. Parse imports into validated typed data before applying them

**Current situation:** JSON import is parsed from `unknown` into a typed
candidate state before `apply_json()` changes live state. The file-import
handler reports malformed JSON and rejected state files through the existing
user-facing notification path. URL and GPX import still have their own parsing
and validation paths.

**Remaining risk:** URL and GPX validation remain separate from JSON, and the
JSON schema is validated in application code rather than against a versioned
external schema.

**Implementation:** `MapState.parse_json()` validates into
`MapStateJsonImport | null` without mutating live state. `apply_json()` accepts
only this typed representation. The existing `from_json()` method remains as a
parse-and-apply convenience wrapper. JSON imports remain partial: absent
properties leave current values unchanged, while malformed supplied values
reject the complete import before state is changed.

### 4. Clarify nullable state and model invariants

**Current situation:** `center` is nullable in the type, while methods such as
`add_marker(null)` and `to_json()` use non-null assertions. Marker and line IDs
are generated by global counters, and collections and indexes must remain in
sync.

**Risk:** Code can rely on initialization order or implicit assumptions that
are not represented in the API's types.

**Improvement:** Establish a valid default view before exposing operations that
require a center, or make those operations require their coordinates
explicitly. Document and enforce collection/index and ID invariants as
mutation APIs are tightened.

### 5. Make observer subscriptions easier to manage and test

**Current situation:** Observers register themselves during construction and
remain in a public array. Notifications are synchronous and observers retrieve
state through `App`.

**Risk:** Subscription lifetime and construction order are implicit, and
observers are coupled to the application object instead of receiving a clear
state-change contract.

**Improvement:** Consider returning an unsubscribe function from registration
and making the observer collection private. Keep the current lightweight
observer pattern unless a concrete need arises; a larger state-management
framework is not required to address these issues.

## Suggested sequence

1. Keep focused mutation-side-effect tests in
   [`tests/map_state.test.ts`](../tests/map_state.test.ts), covering
   collection/index consistency, storage writes, notifications, derived line
   updates, and ordering.
2. Extend typed parse/validate/apply boundaries to URL and GPX imports where
   useful.
3. Revisit observer subscription lifecycle and nullable-state types as
   call-sites are migrated.

Keep URL, JSON, GPX, and persisted-state compatibility in mind throughout the
work. Introduce changes incrementally so the existing map behavior remains
testable at each step.
