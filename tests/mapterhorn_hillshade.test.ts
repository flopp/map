import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

import type {App} from "../src/components/app";
import {Coordinates} from "../src/components/coordinates";
import {map_state_change, MapState} from "../src/components/map_state";
import {MapType} from "../src/components/map_type";
import {MapStateObserver} from "../src/components/map_state_observer";
import {mapterhorn_elevation_url} from "../src/components/mapterhorn_tiles";

describe("Mapterhorn hillshading", () => {
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

    test("is disabled by default", () => {
        expect(new MapState({} as App).hillshading).toBe(false);
    });

    test("maps Leaflet 512px grid zooms to Mapterhorn source tile zooms", () => {
        expect(mapterhorn_elevation_url(13, 2137, 1423)).toBe(
            "https://tiles.mapterhorn.com/12/2137/1423.webp",
        );
        expect(mapterhorn_elevation_url(0, 0, 0)).toBe("https://tiles.mapterhorn.com/0/0/0.webp");
    });

    test("persists the setting and restores it from local storage", () => {
        const state = new MapState({} as App);
        state.set_hillshading(true);

        expect(values.get("hillshading")).toBe("1");

        const restored_state = new MapState({} as App);
        restored_state.restore();

        expect(restored_state.hillshading).toBe(true);
    });

    test("includes enabled state in shared links and defaults old links to off", () => {
        const state = new MapState({} as App);
        state.center = new Coordinates(48, 8);
        state.zoom = 12;
        state.map_type = MapType.OPENSTREETMAP;
        expect(state.create_link()).not.toContain("&h=");

        state.set_hillshading(true);
        const link = state.create_link();

        expect(link).toContain("&h=1");

        location.search = new URL(link).search;
        const linked_state = new MapState({} as App);
        linked_state.restore_from_url();
        expect(values.get("hillshading")).toBe("1");

        location.search = "?c=48:8&z=12&t=osm";
        const old_link_state = new MapState({} as App);
        old_link_state.restore_from_url();
        expect(values.get("hillshading")).toBe("0");
    });

    test("notifies observers with the hillshading change flag", () => {
        const state = new MapState({} as App);
        const observer = new MapStateObserver({map_state: state} as App);
        const update_state = vi.fn<MapStateObserver["update_state"]>();
        observer.update_state = update_state;

        state.set_hillshading(true);

        expect(update_state).toHaveBeenCalledWith(map_state_change(["hillshading"]));
    });
});
