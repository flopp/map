# Overwrite protection for shared map links

## Goal

When a user opens a shared map link while the current map contains markers or
lines, ask whether to replace the current map with the map from the link. The
prompt must be a Bulma-styled modal showing marker and line counts for both
maps. The user can either apply the linked map or keep the current map.

## User flow

1. On startup, detect a URL containing supported shared-map parameters.
2. Restore the saved map from local storage without applying the link first.
   This ensures the prompt describes a real choice and that choosing to keep
   the current map cannot lose saved data.
3. If the restored map contains at least one marker or line, show a modal with
   a clear question, statistics for both maps, and two explicit actions:
   - **Overwrite map**: replace the current map with the map from the link.
   - **Keep current map**: ignore the linked map and continue with the saved
     map.
4. If the restored map has no markers and no lines, apply the link without
   prompting. Initialize the map and its controls from the selected state. Do
   not merge linked markers or lines into the current map.

URLs without shared-map parameters do not prompt or replace saved state.
Closing the modal, clicking its background, or pressing Escape has the same
effect as **Keep current map**; these dismissal actions must never apply the
link.

## State and URL behavior

- The choice applies to the whole shared map, not just its markers and lines.
  On overwrite, use the link's map view, base layer, overlays, markers, and
  lines. Apply the link's values using the existing shared-link parsing rules.
- On keep, ignore all map-state values from the URL and restore the saved map
  unchanged. Do not clear or rewrite its local-storage map data from the
  rejected link.
- Overwrite is replacement, not a merge. Remove stale marker and line entries
  from storage as part of replacing the map, and retain valid links' existing
  marker/line relationships.
- Keep unrelated preferences (such as language and marker/line display
  settings) outside the overwrite operation unless those preferences are
  explicitly part of the shared-link format.
- Links that contain no usable shared-map data must not prompt or replace
  saved state. Preserve the existing handling of malformed or unsupported
  parameters.
- Opening the same URL again must prompt again; do not persist the user's
  previous choice as a permanent preference.

## Modal and interaction requirements

- Use the existing Bulma `.modal` / `.modal-card` structure and established
  dialog conventions. Keep the content concise and explain that applying the
  link replaces the current map.
- Use distinct, translated button labels for the destructive **Overwrite
  map** action and the **Keep current map** action. Do not reuse generic Yes/No
  labels that obscure which state will be kept.
- Show the current map's and linked map's marker and line counts in the modal.
  Label each set of counts clearly so users can compare what will be replaced.
- Provide translations for English, German, and French, following the existing
  localization keys and workflow.
- Make the modal keyboard-accessible: focus an appropriate action when it
  opens, allow keyboard activation, and ensure Escape follows the keep-current
  behavior.
- Do not show another startup modal over it. In particular, coordinate the
  prompt with the existing news dialog so that dialogs are shown sequentially
  rather than overlapping.

## Implementation notes

- Separate URL parsing from applying URL state. Parse and retain the incoming
  link data while saved state is restored, then apply it only after the user
  chooses **Overwrite map**. Avoid the current startup ordering in which
  `restore_from_url()` writes link values to storage before `restore()` loads
  the map.
- Ensure overwrite and keep both go through the normal map-state observer
  updates so the Leaflet map, sidebars, markers, and lines all reflect the
  chosen state.
- Keep the confirmation flow in the startup path, while allowing existing
  code paths that load map state without an interactive browser to remain
  testable.
- Create the Bulma modal elements on the fly with DOM APIs instead of adding
  permanent modal markup to `index.html`. Set translated text as text content,
  not interpolated HTML, and attach the created modal to the document before
  showing it.
- Use the shared dialog component or an equivalent focused dialog class rather
  than duplicating unrelated modal behavior.

## Acceptance criteria

- Opening a shared-map URL while the current map has at least one marker or
  line displays a Bulma modal before any linked state replaces the current
  map. The modal shows marker and line counts for both the current and linked
  maps.
- Opening a shared-map URL while the current map has no markers and no lines
  applies the linked state without displaying the overwrite modal.
- Choosing **Overwrite map** replaces the saved map and displays the linked
  view, layers, markers, and lines without merging old markers or lines.
- Choosing **Keep current map**, closing the modal, clicking its background,
  or pressing Escape leaves the saved map unchanged and ignores the link.
- A URL without usable shared-map data does not prompt or replace saved state.
- Map observers and UI controls reflect the selected state, and the startup
  news dialog does not overlap the confirmation modal.
- All prompt text and actions are translated in English, German, and French.

## Verification

- Add focused tests for detecting a shared-map URL, suppressing confirmation
  for a current map with no markers or lines, retaining populated current
  state until the choice is made, and both overwrite and keep outcomes.
- Verify overwrite replaces rather than appends markers and lines, including
  stale local-storage entries, and that keep does not mutate saved map data.
- Verify the modal displays the correct marker and line counts for both maps.
- Test dismissing the modal through each supported close mechanism and opening
  the same link again.
- Verify startup modal sequencing and that map/sidebar observers receive the
  final selected state.
- Run `make lint` and `make test`.
