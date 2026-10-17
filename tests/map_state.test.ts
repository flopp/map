import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import {readFileSync} from "node:fs";

import type {App} from "../src/components/app";
import {Color} from "../src/components/color";
import {Coordinates, CoordinatesFormat} from "../src/components/coordinates";
import {DistanceFormat} from "../src/components/distance";
import {map_state_change, MapState} from "../src/components/map_state";
import {MapStateObserver} from "../src/components/map_state_observer";
import {Line} from "../src/components/line";
import {MapType} from "../src/components/map_type";
import {Marker} from "../src/components/marker";

describe("MapState mutation side effects", () => {
    let values: Map<string, string>;

    beforeEach(() => {
        values = new Map();
        class TestLocalStorage {
            public getItem(key: string): string | null {
                return values.get(key) ?? null;
            }

            public removeItem(key: string): void {
                values.delete(key);
                Reflect.deleteProperty(this, key);
            }

            public setItem(key: string, value: string): void {
                values.set(key, value);
                Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: true,
                    value,
                });
            }
        }

        vi.stubGlobal("window", {localStorage: new TestLocalStorage()});
        Marker.reset_ids();
        Line.reset_ids();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const create_app = (): App =>
        ({
            message: vi.fn(),
            translate: (key: string): string => key,
        }) as unknown as App;

    const observe = (
        state: MapState,
    ): ReturnType<typeof vi.fn<MapStateObserver["update_state"]>> => {
        const observer = new MapStateObserver({map_state: state} as App);
        const update_state = vi.fn<MapStateObserver["update_state"]>();
        observer.update_state = update_state;

        return update_state;
    };

    test("keeps marker and line collections, indexes, and storage in sync", () => {
        const state = new MapState(create_app());
        const first_marker = state.add_marker(new Coordinates(48, 8));
        const second_marker = state.add_marker(new Coordinates(49, 9));
        const line = state.add_line();

        state.update_line_attributes(line.get_id(), {
            marker1: first_marker.get_id(),
            marker2: second_marker.get_id(),
        });

        expect(state.markers).toEqual([first_marker, second_marker]);
        expect(state.get_marker(first_marker.get_id())).toBe(first_marker);
        expect(values.get("markers")).toBe(`${first_marker.get_id()};${second_marker.get_id()}`);
        expect(values.get(`marker[${first_marker.get_id()}].coordinates`)).toBe("48;8");

        expect(state.lines).toEqual([line]);
        expect(state.get_line(line.get_id())).toBe(line);
        expect(values.get("lines")).toBe(String(line.get_id()));
        expect(values.get(`line[${line.get_id()}].marker1`)).toBe(String(first_marker.get_id()));
        expect(values.get(`line[${line.get_id()}].marker2`)).toBe(String(second_marker.get_id()));

        state.delete_marker(first_marker.get_id());
        state.delete_line(line.get_id());

        expect(state.markers).toEqual([second_marker]);
        expect(state.get_marker(first_marker.get_id())).toBeNull();
        expect(values.get("markers")).toBe(String(second_marker.get_id()));
        expect(state.lines).toEqual([]);
        expect(state.get_line(line.get_id())).toBeNull();
        expect(values.get("lines")).toBe("");
    });

    test("reports view and overlay changes by state part", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);

        state.set_view(new Coordinates(48, 8), 12);

        expect(update_state).toHaveBeenLastCalledWith(map_state_change(["center", "zoom"]));

        update_state.mockClear();
        state.set_german_npa(true);

        expect(update_state).toHaveBeenCalledOnce();
        expect(update_state).toHaveBeenCalledWith(map_state_change(["german_npa"]));
    });

    test("persists marker edits and notifies observers with the changed marker ID", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const marker = state.add_marker(new Coordinates(48, 8));
        update_state.mockClear();

        state.update_marker_attributes(marker.get_id(), {
            name: "Changed name",
            coordinates: new Coordinates(48.5, 8.5),
        });

        expect(marker.name).toBe("Changed name");
        expect(values.get(`marker[${marker.get_id()}].name`)).toBe("Changed name");
        expect(values.get(`marker[${marker.get_id()}].coordinates`)).toBe("48.5;8.5");
        expect(update_state).toHaveBeenCalledOnce();
        expect(update_state).toHaveBeenCalledWith(map_state_change(["markers"], 0));
    });

    test("updates all marker attributes, persists them, and notifies observers once", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const marker = state.add_marker(new Coordinates(48, 8));
        update_state.mockClear();
        const coordinates = new Coordinates(48.5, 8.5);
        const color = new Color("123456");

        state.update_marker_attributes(marker.get_id(), {
            name: "Updated marker",
            coordinates,
            radius: 125,
            color,
        });

        expect(marker.name).toBe("Updated marker");
        expect(marker.coordinates).toBe(coordinates);
        expect(marker.radius).toBe(125);
        expect(marker.color).toBe(color);
        expect(values.get(`marker[${marker.get_id()}].name`)).toBe("Updated marker");
        expect(values.get(`marker[${marker.get_id()}].coordinates`)).toBe("48.5;8.5");
        expect(values.get(`marker[${marker.get_id()}].radius`)).toBe("125");
        expect(values.get(`marker[${marker.get_id()}].color`)).toBe("123456");
        expect(update_state).toHaveBeenCalledTimes(1);
        expect(update_state).toHaveBeenCalledWith(map_state_change(["markers"], 0));
    });

    test("updates only the supplied marker attributes", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const marker = state.add_marker(new Coordinates(48, 8));
        const original_coordinates = marker.coordinates;
        const original_color = marker.color;
        const original_radius = marker.radius;
        update_state.mockClear();

        state.update_marker_attributes(marker.get_id(), {name: "Updated marker"});

        expect(marker.name).toBe("Updated marker");
        expect(marker.coordinates).toBe(original_coordinates);
        expect(marker.color).toBe(original_color);
        expect(marker.radius).toBe(original_radius);
        expect(values.get(`marker[${marker.get_id()}].name`)).toBe("Updated marker");
        expect(values.get(`marker[${marker.get_id()}].coordinates`)).toBe("48;8");
        expect(values.get(`marker[${marker.get_id()}].color`)).toBe(original_color.to_string());
        expect(values.get(`marker[${marker.get_id()}].radius`)).toBe(String(original_radius));
        expect(update_state).toHaveBeenCalledOnce();
        expect(update_state).toHaveBeenCalledWith(map_state_change(["markers"], 0));
    });

    test("updates the current marker when an older instance has the same ID", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const old_marker = state.add_marker(new Coordinates(48, 8));
        const current_marker = new Marker(new Coordinates(49, 9));
        current_marker.marker_id = old_marker.get_id();
        state.markers[0] = current_marker;
        state.markers_hash.set(current_marker.get_id(), current_marker);
        update_state.mockClear();

        state.update_marker_attributes(old_marker.get_id(), {name: "Updated marker"});

        expect(old_marker.name).not.toBe("Updated marker");
        expect(current_marker.name).toBe("Updated marker");
        expect(values.get(`marker[${current_marker.get_id()}].name`)).toBe("Updated marker");
        expect(update_state).toHaveBeenCalledOnce();
        expect(update_state).toHaveBeenCalledWith(
            map_state_change(["markers"], current_marker.get_id()),
        );
    });

    test("applies optional marker properties before persisting and notifying", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const color = new Color("123456");

        const marker = state.add_marker(new Coordinates(48, 8), {
            name: "Custom marker",
            color,
            radius: 125,
        });

        expect(marker.name).toBe("Custom marker");
        expect(marker.color).toBe(color);
        expect(marker.radius).toBe(125);
        expect(values.get(`marker[${marker.get_id()}].name`)).toBe("Custom marker");
        expect(values.get(`marker[${marker.get_id()}].color`)).toBe("123456");
        expect(values.get(`marker[${marker.get_id()}].radius`)).toBe("125");
        expect(update_state).toHaveBeenCalledTimes(1);
        expect(update_state).toHaveBeenCalledWith(map_state_change(["markers"], marker.get_id()));
    });

    test("applies optional line properties before persisting and notifying", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const first_marker = state.add_marker(new Coordinates(48, 8));
        const second_marker = state.add_marker(new Coordinates(49, 9));
        update_state.mockClear();
        const color = new Color("123456");

        const line = state.add_line({
            marker1: first_marker.get_id(),
            marker2: second_marker.get_id(),
            color,
        });

        expect(line.marker1).toBe(first_marker.get_id());
        expect(line.marker2).toBe(second_marker.get_id());
        expect(line.color).toBe(color);
        expect(values.get(`line[${line.get_id()}].marker1`)).toBe(String(first_marker.get_id()));
        expect(values.get(`line[${line.get_id()}].marker2`)).toBe(String(second_marker.get_id()));
        expect(values.get(`line[${line.get_id()}].color`)).toBe("123456");
        expect(update_state).toHaveBeenCalledTimes(1);
        expect(update_state).toHaveBeenCalledWith(map_state_change(["lines"]));
    });

    test("recomputes line distance and bearing when a marker moves", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const first_marker = state.add_marker(new Coordinates(48, 8));
        const second_marker = state.add_marker(new Coordinates(48, 9));
        const line = state.add_line();
        state.update_line_attributes(line.get_id(), {
            marker1: first_marker.get_id(),
            marker2: second_marker.get_id(),
        });
        update_state.mockClear();

        const initial_length = line.length!.m();
        state.update_marker_attributes(second_marker.get_id(), {
            coordinates: new Coordinates(48, 10),
        });

        expect(line.length).not.toBeNull();
        expect(line.length!.m()).toBeGreaterThan(initial_length);
        expect(line.bearing).not.toBeNull();
        expect(update_state).toHaveBeenCalledWith(
            map_state_change(["markers", "lines"], second_marker.get_id()),
        );
    });

    test("focuses a line on its available marker endpoints", () => {
        const fit_coordinates = vi.fn();
        const app = {
            ...create_app(),
            leaflet: {fit_coordinates},
        } as unknown as App;
        const state = new MapState(app);
        const first_marker = state.add_marker(new Coordinates(48, 8));
        const second_marker = state.add_marker(new Coordinates(49, 9));
        const line = state.add_line();

        state.update_line_attributes(line.get_id(), {
            marker1: first_marker.get_id(),
            marker2: second_marker.get_id(),
        });
        state.show_line(line);

        expect(fit_coordinates).toHaveBeenCalledWith([
            first_marker.coordinates,
            second_marker.coordinates,
        ]);
    });

    test("persists marker and line ordering and notifies observers", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const markers = [
            state.add_marker(new Coordinates(48, 8)),
            state.add_marker(new Coordinates(49, 9)),
            state.add_marker(new Coordinates(50, 10)),
        ];
        const lines = [state.add_line(), state.add_line(), state.add_line()];
        update_state.mockClear();

        state.reorder_markers(0, 2);

        expect(state.markers).toEqual([markers[1], markers[2], markers[0]]);
        expect(values.get("markers")).toBe(
            [markers[1], markers[2], markers[0]].map((marker) => String(marker.get_id())).join(";"),
        );
        expect(update_state).toHaveBeenCalledWith(map_state_change(["markers"]));

        update_state.mockClear();
        state.reorder_lines(0, 2);

        expect(state.lines).toEqual([lines[1], lines[2], lines[0]]);
        expect(values.get("lines")).toBe(
            [lines[1], lines[2], lines[0]].map((line) => String(line.get_id())).join(";"),
        );
        expect(update_state).toHaveBeenCalledWith(map_state_change(["lines"]));
    });

    test("parses and applies valid JSON using a typed import state", () => {
        const state = new MapState(create_app());
        const parsed = MapState.parse_json({
            maptype: "OPENSTREETMAP",
            center: "N 48 E 8",
            zoom: 12,
            german_npa: true,
            settings: {
                markers: {coordinates_format: "dms", radius: 25},
                lines: {distance_format: "km", display_distance: false},
            },
            markers: [
                {marker_id: 41, coordinates: "N 48 E 8", name: "Start", color: "#ff0000"},
                {marker_id: 99, coordinates: "N 49 E 9", name: "Finish"},
            ],
            lines: [{marker1: 41, marker2: 99, color: "00ff00"}],
        });

        expect(parsed).not.toBeNull();
        state.apply_json(parsed!);

        expect(state.map_type).toBe("OPENSTREETMAP");
        expect(state.center!.lat()).toBe(48);
        expect(state.zoom).toBe(12);
        expect(state.german_npa).toBe(true);
        expect(state.settings_marker_radius).toBe(25);
        expect(state.settings_line_display_distance).toBe(false);
        expect(state.markers.map((marker) => marker.name)).toEqual(["Start", "Finish"]);
        expect(state.get_marker(state.markers[0].get_id())).toBe(state.markers[0]);
        expect(state.lines[0].marker1).toBe(state.markers[0].get_id());
        expect(state.lines[0].marker2).toBe(state.markers[1].get_id());
        expect(state.get_line(state.lines[0].get_id())).toBe(state.lines[0]);
    });

    test("round trips exported JSON through import", () => {
        const state = new MapState(create_app());
        state.set_view(new Coordinates(48.123456, 8.654321), 12);
        state.set_map_type(MapType.ARCGIS_WORLDIMAGERY);
        state.german_npa = true;
        state.hillshading = true;
        state.settings_marker_coordinates_format = CoordinatesFormat.DMS;
        state.settings_marker_random_color = false;
        state.settings_marker_color = new Color("123456");
        state.settings_marker_radius = 125;
        state.settings_marker_draggable = true;
        state.settings_marker_filled = false;
        state.settings_line_distance_format = DistanceFormat.km;
        state.settings_line_random_color = false;
        state.settings_line_color = new Color("654321");
        state.settings_line_display_distance = false;
        const first_marker = state.add_marker(new Coordinates(48.234567, 8.345678), {
            name: "Start",
            color: new Color("abcdef"),
            radius: 25,
        });
        const second_marker = state.add_marker(new Coordinates(49.345678, 9.456789), {
            name: "Finish",
        });
        state.add_line({
            marker1: first_marker.get_id(),
            marker2: second_marker.get_id(),
            color: new Color("fedcba"),
        });
        const exported = JSON.parse(JSON.stringify(state.to_json()));
        const imported = new MapState(create_app());

        expect(imported.from_json(exported)).toBe(true);
        expect(imported.to_json()).toEqual(exported);
    });

    test("imports the map state JSON fixture", () => {
        const exported: unknown = JSON.parse(readFileSync("tests/data/map_state.json", "utf8"));
        const state = new MapState(create_app());

        expect(state.from_json(exported)).toBe(true);
        expect(state.to_json()).toEqual(exported);
    });

    test("rejects invalid JSON state without changing state, storage, or observers", () => {
        const state = new MapState(create_app());
        state.set_view(new Coordinates(48, 8), 12);
        const marker = state.add_marker(new Coordinates(49, 9));
        const update_state = observe(state);
        const persisted_values = new Map(values);

        const imported = state.from_json({
            center: "N 50 E 10",
            settings: {markers: {radius: -1}},
        });

        expect(imported).toBe(false);
        expect(state.center!.lat()).toBe(48);
        expect(state.markers).toEqual([marker]);
        expect(state.get_marker(marker.get_id())).toBe(marker);
        expect(values).toEqual(persisted_values);
        expect(update_state).not.toHaveBeenCalled();
    });

    test("accepts partial JSON imports but rejects malformed collections and duplicate IDs", () => {
        const state = new MapState(create_app());
        const marker = state.add_marker(new Coordinates(48, 8));

        expect(state.from_json({hillshading: true})).toBe(true);
        expect(state.hillshading).toBe(true);
        expect(state.markers).toEqual([marker]);

        expect(MapState.parse_json({markers: {}})).toBeNull();
        expect(
            MapState.parse_json({
                markers: [
                    {marker_id: 4, coordinates: "N 48 E 8"},
                    {marker_id: 4, coordinates: "N 49 E 9"},
                ],
            }),
        ).toBeNull();
    });
});
