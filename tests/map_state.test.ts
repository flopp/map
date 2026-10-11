import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

import type {App} from "../src/components/app";
import {Color} from "../src/components/color";
import {Coordinates} from "../src/components/coordinates";
import {MapState, MapStateChange} from "../src/components/map_state";
import {MapStateObserver} from "../src/components/map_state_observer";
import {Line} from "../src/components/line";
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
            message_error: vi.fn(),
            translate: (key: string): string => key,
            leaflet: {fit_objects: vi.fn()},
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

        expect(second_marker.get_id()).toBe(first_marker.get_id() + 1);
        expect(line.get_id()).toBe(0);
        state.set_line_marker1(line.get_id(), first_marker.get_id());
        state.set_line_marker2(line.get_id(), second_marker.get_id());

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

    test("adds multiple markers as one state change and returns a detached collection", () => {
        const app = create_app();
        const state = new MapState(app);
        const update_state = observe(state);
        const added = state.add_markers([
            {
                coordinates: new Coordinates(48, 8),
                attributes: {name: "Start", color: new Color("ff0000")},
            },
            {coordinates: new Coordinates(49, 9), attributes: {name: "Finish", radius: 20}},
        ]);

        expect(added.map((marker) => marker.name)).toEqual(["Start", "Finish"]);
        expect(added[1].radius).toBe(20);
        expect(state.markers).toHaveLength(2);
        expect(update_state).toHaveBeenCalledTimes(1);
        expect(update_state).toHaveBeenCalledWith(MapStateChange.MARKERS, -1);
        expect(app.message).toHaveBeenCalledTimes(2);

        const detached_collection = state.markers as Marker[];
        detached_collection.pop();
        expect(state.markers).toHaveLength(2);
    });

    test("persists marker edits and notifies observers with the changed marker ID", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const marker = state.add_marker(new Coordinates(48, 8));
        update_state.mockClear();

        state.update_marker(marker.get_id(), {
            name: "Changed name",
            coordinates: new Coordinates(48.5, 8.5),
        });

        expect(marker.name).toBe("Changed name");
        expect(values.get(`marker[${marker.get_id()}].name`)).toBe("Changed name");
        expect(values.get(`marker[${marker.get_id()}].coordinates`)).toBe("48.5;8.5");
        expect(update_state).toHaveBeenCalledTimes(1);
        expect(update_state).toHaveBeenCalledWith(MapStateChange.MARKERS, marker.get_id());
    });

    test("updates related line properties as one persisted notification", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const marker1 = state.add_marker(new Coordinates(48, 8));
        const marker2 = state.add_marker(new Coordinates(49, 9));
        const line = state.add_line();
        update_state.mockClear();

        state.update_line(line.get_id(), {
            marker1: marker1.get_id(),
            marker2: marker2.get_id(),
            color: new Color("ff0000"),
        });

        expect(line.marker1).toBe(marker1.get_id());
        expect(line.marker2).toBe(marker2.get_id());
        expect(line.color.to_string()).toBe("ff0000");
        expect(values.get(`line[${line.get_id()}].marker1`)).toBe(String(marker1.get_id()));
        expect(values.get(`line[${line.get_id()}].marker2`)).toBe(String(marker2.get_id()));
        expect(values.get(`line[${line.get_id()}].color`)).toBe("ff0000");
        expect(update_state).toHaveBeenCalledTimes(1);
        expect(update_state).toHaveBeenCalledWith(MapStateChange.LINES, -1);
    });

    test("recomputes line distance and bearing when a marker moves", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const first_marker = state.add_marker(new Coordinates(48, 8));
        const second_marker = state.add_marker(new Coordinates(48, 9));
        const line = state.add_line();
        state.set_line_marker1(line.get_id(), first_marker.get_id());
        state.set_line_marker2(line.get_id(), second_marker.get_id());
        update_state.mockClear();

        const initial_length = line.length!.m();
        state.set_marker_coordinates(second_marker.get_id(), new Coordinates(48, 10));

        expect(line.length).not.toBeNull();
        expect(line.length!.m()).toBeGreaterThan(initial_length);
        expect(line.bearing).not.toBeNull();
        expect(update_state).toHaveBeenCalledWith(
            MapStateChange.MARKERS | MapStateChange.LINES,
            second_marker.get_id(),
        );
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
        expect(update_state).toHaveBeenCalledWith(MapStateChange.MARKERS, -1);

        update_state.mockClear();
        state.reorder_lines(0, 2);

        expect(state.lines).toEqual([lines[1], lines[2], lines[0]]);
        expect(values.get("lines")).toBe(
            [lines[1], lines[2], lines[0]].map((line) => String(line.get_id())).join(";"),
        );
        expect(update_state).toHaveBeenCalledWith(MapStateChange.LINES, -1);
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

    test("rejects invalid JSON state without changing state, storage, or observers", () => {
        const state = new MapState(create_app());
        state.set_view(new Coordinates(48, 8), 12);
        const marker = state.add_marker(new Coordinates(49, 9));
        const update_state = observe(state);
        const persisted_values = new Map(values);

        const imported = state.from_json({
            center: "N 50 E 10",
            markers: [{coordinates: "N 50 E 10", radius: -1}],
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

    test("replaces markers and lines from GPX using consistent generated IDs", () => {
        const state = new MapState(create_app());
        state.add_marker(new Coordinates(40, 5));

        const create_element = (
            tag: string,
            textContent: string,
            attributes: Record<string, string> = {},
        ): Element =>
            ({
                textContent,
                getAttribute: (name: string): string | null => attributes[name] ?? null,
                getElementsByTagName: (name: string): Element[] =>
                    name === tag ? ([{textContent}] as Element[]) : [],
            }) as unknown as Element;
        class TestDOMParser {
            public parseFromString(): Document {
                const waypoints = [
                    create_element("wpt", "", {
                        lat: "48",
                        lon: "8",
                    }),
                    create_element("wpt", "", {
                        lat: "49",
                        lon: "9",
                    }),
                ];
                const tracks = [create_element("trk", "")];
                tracks[0].getElementsByTagName = (tag: string): HTMLCollectionOf<Element> =>
                    (tag === "name"
                        ? [create_element("name", "LINE:0:1:00ff00")]
                        : []) as unknown as HTMLCollectionOf<Element>;
                waypoints[0].getElementsByTagName = (tag: string): HTMLCollectionOf<Element> =>
                    (tag === "name"
                        ? [create_element("name", "Start")]
                        : []) as unknown as HTMLCollectionOf<Element>;
                waypoints[1].getElementsByTagName = (tag: string): HTMLCollectionOf<Element> =>
                    (tag === "name"
                        ? [create_element("name", "Finish")]
                        : []) as unknown as HTMLCollectionOf<Element>;

                return {
                    getElementsByTagName: (tag: string): HTMLCollectionOf<Element> =>
                        (tag === "wpt"
                            ? waypoints
                            : tag === "trk"
                              ? tracks
                              : []) as unknown as HTMLCollectionOf<Element>,
                } as unknown as Document;
            }
        }
        vi.stubGlobal("DOMParser", TestDOMParser);
        state.from_gpx("<gpx></gpx>", true);

        expect(state.markers.map((marker) => marker.name)).toEqual(["Start", "Finish"]);
        expect(state.markers.map((marker) => marker.get_id())).toEqual([0, 1]);
        expect(state.get_marker(0)).toBe(state.markers[0]);
        expect(state.lines).toHaveLength(1);
        expect(state.lines[0].get_id()).toBe(0);
        expect(state.lines[0].marker1).toBe(0);
        expect(state.lines[0].marker2).toBe(1);
        expect(state.get_line(0)).toBe(state.lines[0]);
    });
});
