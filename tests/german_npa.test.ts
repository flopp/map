import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

const leaflet_mocks = vi.hoisted(() => {
    const layers: Array<{on: ReturnType<typeof vi.fn>; bringToBack: ReturnType<typeof vi.fn>}> = [];
    const map = {
        addLayer: vi.fn(),
        hasLayer: vi.fn(() => false),
        on: vi.fn(),
        removeLayer: vi.fn(),
    };
    const create_layer = (): (typeof layers)[number] => {
        const layer = {
            bringToBack: vi.fn(),
            on: vi.fn(),
        };
        layers.push(layer);

        return layer;
    };
    const tile_layer = Object.assign(vi.fn(create_layer), {
        wms: vi.fn((url: string, options: object) => ({
            ...create_layer(),
            options,
            url,
        })),
    });

    return {
        control_scale_add: vi.fn(),
        create_layer,
        layers,
        map,
        tile_layer,
    };
});

vi.mock("leaflet", () => ({
    control: {scale: () => ({addTo: leaflet_mocks.control_scale_add})},
    map: () => leaflet_mocks.map,
    tileLayer: leaflet_mocks.tile_layer,
}));
vi.mock("leaflet-relief", () => ({}));

import type {App} from "../src/components/app";
import {LeafletWrapper} from "../src/components/leaflet_wrapper";

describe("German nature protection areas overlay", () => {
    let app: App;

    beforeEach(() => {
        leaflet_mocks.layers.length = 0;
        leaflet_mocks.map.addLayer.mockClear();
        leaflet_mocks.map.hasLayer.mockClear();
        leaflet_mocks.map.on.mockClear();
        leaflet_mocks.map.removeLayer.mockClear();
        leaflet_mocks.tile_layer.mockClear();
        leaflet_mocks.tile_layer.wms.mockClear();
        leaflet_mocks.control_scale_add.mockClear();
        vi.stubGlobal("document", {
            createElement: vi.fn(() => ({})),
            getElementById: vi.fn(() => ({})),
            getElementsByTagName: vi.fn(() => [{appendChild: vi.fn()}]),
        });
        app = {
            map_menu: {hide: vi.fn()},
            map_state: {
                german_npa: false,
                map_type: null,
                register_observer: vi.fn(),
            },
            message_error: vi.fn(),
            translate: (key: string): string => key,
        } as unknown as App;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("adds the BfN WMS layer when enabled and removes it when disabled", () => {
        const wrapper = new LeafletWrapper("map", app);

        wrapper.set_german_npa(true);
        wrapper.set_german_npa(true);

        expect(leaflet_mocks.tile_layer.wms).toHaveBeenCalledOnce();
        expect(leaflet_mocks.tile_layer.wms).toHaveBeenCalledWith(
            "https://geodienste.bfn.de/ogc/wms/schutzgebiet?",
            {
                layers: "Naturschutzgebiete,Nationalparke",
                format: "image/png",
                transparent: true,
                opacity: 0.5,
                attribution: "Bundesamt für Naturschutz (BfN)",
            },
        );
        expect(leaflet_mocks.map.addLayer).toHaveBeenCalledTimes(1);

        wrapper.set_german_npa(false);

        expect(leaflet_mocks.map.removeLayer).toHaveBeenCalledWith(
            expect.objectContaining({url: "https://geodienste.bfn.de/ogc/wms/schutzgebiet?"}),
        );
    });

    test("reports tile errors once per enabled session", () => {
        const wrapper = new LeafletWrapper("map", app);
        wrapper.set_german_npa(true);

        const layer = leaflet_mocks.layers[leaflet_mocks.layers.length - 1]!;
        const tile_error_handler = layer.on.mock.calls.find(([event]) => event === "tileerror")![1];

        tile_error_handler();
        tile_error_handler();
        expect(app.message_error).toHaveBeenCalledTimes(1);
        expect(app.message_error).toHaveBeenCalledWith("messages.german_npa_load_error");

        wrapper.set_german_npa(false);
        tile_error_handler();
        expect(app.message_error).toHaveBeenCalledTimes(1);

        wrapper.set_german_npa(true);
        tile_error_handler();
        expect(app.message_error).toHaveBeenCalledTimes(2);
    });
});
