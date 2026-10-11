import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

import type {App} from "../src/components/app";
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
            translate: (key: string): string => key,
        }) as App;

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

    test("persists marker edits and notifies observers with the changed marker ID", () => {
        const state = new MapState(create_app());
        const update_state = observe(state);
        const marker = state.add_marker(new Coordinates(48, 8));
        update_state.mockClear();

        state.set_marker_name(marker.get_id(), "Changed name");
        state.set_marker_coordinates(marker.get_id(), new Coordinates(48.5, 8.5));

        expect(marker.name).toBe("Changed name");
        expect(values.get(`marker[${marker.get_id()}].name`)).toBe("Changed name");
        expect(values.get(`marker[${marker.get_id()}].coordinates`)).toBe("48.5;8.5");
        expect(update_state).toHaveBeenNthCalledWith(1, MapStateChange.MARKERS, marker.get_id());
        expect(update_state).toHaveBeenNthCalledWith(2, MapStateChange.MARKERS, marker.get_id());
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
});
