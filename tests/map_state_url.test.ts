import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

import type {App} from "../src/components/app";
import {MapState} from "../src/components/map_state";
import {MapType} from "../src/components/map_type";

describe("MapState URL parsing", () => {
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
            }

            public setItem(key: string, value: string): void {
                values.set(key, value);
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

    test("parses line references when the line parameter precedes markers", () => {
        const state = new MapState({} as App);
        location.search = "?c=48:8&d=A:B:123456&m=A:47:7:0:Alpha:ff0000*B:49:9:0:Bravo:00ff00";

        const url_state = state.parse_url_state();

        expect(url_state).not.toBeNull();
        expect(url_state!.markers.map((marker) => marker.name)).toEqual(["Alpha", "Bravo"]);
        expect(url_state!.lines).toHaveLength(1);
        expect(url_state!.lines[0].from).toBe(0);
        expect(url_state!.lines[0].to).toBe(1);
    });

    test("parses a shared map URL with optional marker fields and encoded names", () => {
        const state = new MapState({} as App);
        location.search = new URL(
            "https://flopp.net/?c=52.629729:11.13739&z=8&t=ARCGIS_WORLDIMAGERY&m=0:52.288323:10.975342::A:ff0000*1:52.736292:11.980591:1234:my%20marker:80ff00*2:52.709675:11.178589::C:ff0000&d=0:1:FFDD57",
        ).search;

        const url_state = state.parse_url_state();

        expect(url_state).not.toBeNull();
        expect(url_state!.center.lat()).toBe(52.629729);
        expect(url_state!.center.lng()).toBe(11.13739);
        expect(url_state!.zoom).toBe(8);
        expect(url_state!.map_type).toBe(MapType.ARCGIS_WORLDIMAGERY);
        expect(url_state!.markers).toHaveLength(3);
        expect(url_state!.markers[0].name).toBe("A");
        expect(url_state!.markers[0].radius).toBe(0);
        expect(url_state!.markers[0].coordinates.lat()).toBe(52.288323);
        expect(url_state!.markers[0].coordinates.lng()).toBe(10.975342);
        expect(url_state!.markers[1].name).toBe("my marker");
        expect(url_state!.markers[1].radius).toBe(1234);
        expect(url_state!.markers[1].color.to_string()).toBe("80ff00");
        expect(url_state!.markers[2].name).toBe("C");
        expect(url_state!.lines).toHaveLength(1);
        expect(url_state!.lines[0].from).toBe(0);
        expect(url_state!.lines[0].to).toBe(1);
        expect(url_state!.lines[0].color.to_string()).toBe("FFDD57");
    });

    test("does not throw when a marker name contains malformed percent encoding", () => {
        const state = new MapState({} as App);
        location.search = "?c=48:8&m=A:47:7:0:Broken%ZZName:ff0000";

        expect(state.parse_url_state()?.markers[0].name).toBe("Broken%ZZName");
    });

    test("does not parse URLs with no usable map data", () => {
        const state = new MapState({} as App);
        location.search = "?z=12&t=osm";

        expect(state.parse_url_state()).toBeNull();
    });
});
