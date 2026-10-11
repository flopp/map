import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

import type {App} from "../src/components/app";
import {Coordinates} from "../src/components/coordinates";
import {Line} from "../src/components/line";
import {MapState} from "../src/components/map_state";
import {Marker} from "../src/components/marker";

describe("overwrite protection", () => {
    let values: Map<string, string>;
    let location: {href: string; search: string};

    beforeEach(() => {
        values = new Map();
        location = {href: "https://map.example/", search: ""};
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

        vi.stubGlobal("window", {
            localStorage: new TestLocalStorage(),
            location,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("only requires confirmation when the current map has markers or lines", () => {
        const state = new MapState({} as App);
        expect(state.has_markers_or_lines()).toBe(false);

        state.markers.push(new Marker(new Coordinates(48, 8)));
        expect(state.has_markers_or_lines()).toBe(true);

        state.markers = [];
        state.lines.push(new Line(-1, -1));
        expect(state.has_markers_or_lines()).toBe(true);
    });

    test("parses links without mutating saved state until they are applied", () => {
        const state = new MapState({} as App);
        values.set("markers", "0");
        values.set("marker[0].name", "Saved marker");
        location.search = "?c=48:8&z=12&t=osm&m=A:47:7:0:Linked:ff0000";

        const url_state = state.parse_url_state();

        expect(url_state).not.toBeNull();
        expect(url_state!.markers[0].name).toBe("Linked");
        expect(values.get("marker[0].name")).toBe("Saved marker");
        expect(state.markers).toHaveLength(0);
    });

    test("applying a link replaces markers and lines and removes stale storage", () => {
        const state = new MapState({} as App);
        values.set("center", "46:6");
        values.set("zoom", "9");
        values.set("map_type", "osm");
        values.set("markers", "0");
        values.set("marker[0].coordinates", "46:6");
        values.set("marker[0].name", "Saved marker");
        values.set("lines", "");
        state.restore();
        state.storage.set("marker[99].name", "Stale marker");

        location.search =
            "?c=48:8&z=12&t=osm&m=A:47:7:0:Alpha:ff0000*B:49:9:0:Bravo:00ff00&d=A:B:123456";
        const url_state = state.parse_url_state();
        expect(url_state).not.toBeNull();
        state.apply_url_state(url_state!);

        expect(state.markers.map((marker) => marker.name)).toEqual(["Alpha", "Bravo"]);
        expect(state.lines).toHaveLength(1);
        expect(state.lines[0].marker1).toBe(state.markers[0].get_id());
        expect(state.lines[0].marker2).toBe(state.markers[1].get_id());
        expect(state.center!.lat()).toBe(48);
        expect(state.zoom).toBe(12);
        expect(values.has("marker[99].name")).toBe(false);
    });

    test("does not parse URLs with no usable map data", () => {
        const state = new MapState({} as App);
        location.search = "?z=12&t=osm";

        expect(state.parse_url_state()).toBeNull();
    });
});
