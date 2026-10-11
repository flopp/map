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
are mutable model objects. Their IDs are allocated by module-level counters.
Lines refer to marker IDs and hold derived distance and bearing values, which
`MapState.recompute_lines()` updates when marker or line state changes.

State, collections, models, observer lists, and storage are currently public.
This means callers can mutate state without using a `MapState` operation.

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

**Current situation:** `MapState` exposes mutable collections and model fields.
Some callers use its setters, while others directly edit models or collections
and then separately update storage and notify observers. For example,
[`MultiMarkersDialog`](../src/components/multi_markers_dialog.ts) and
[`ProjectionDialog`](../src/components/projection_dialog.ts) assemble marker
and line additions using multiple state operations.

**Risk:** A caller can update the model without updating its indexes, persisted
representation, derived line values, or observers. Requiring several
follow-up calls makes this easy to get wrong.

**Improvement:** Gradually make collections and model mutation details private
or read-only to consumers. Add cohesive operations for multi-item changes that
update indexes, persistence, derived values, and notifications together.
Migrate call sites in small batches rather than rewriting the whole state
layer.

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

**Current situation:** `from_json()` accepts `any` and updates live state while
parsing. URL and GPX import also have their own parsing and validation paths.

**Risk:** Invalid or unexpected data can be accepted or cause state to be
partially replaced before parsing finishes. Input validation and error handling
are harder to test when coupled to the live state.

**Improvement:** Parse each format into a typed candidate state, validate
required values and relationships, then apply it as one operation. Preserve
the existing partial-import behavior where it is intentional, and report
invalid input through the application's existing user-facing error path.

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
2. Add typed parse/validate/apply boundaries for imports, starting with JSON.
3. Encapsulate direct model and collection mutations behind cohesive state
   operations.
4. Revisit observer subscription lifecycle and nullable-state types as
   call-sites are migrated.

Keep URL, JSON, GPX, and persisted-state compatibility in mind throughout the
work. Introduce changes incrementally so the existing map behavior remains
testable at each step.
