import {describe, expect, test} from "vitest";

import {
    Coordinates,
    CoordinatesFormat,
    parseCoordinatesFormat,
} from "../src/components/coordinates";

describe("parseCoordinatesFormat", () => {
    test("parses known coordinate formats", () => {
        expect(parseCoordinatesFormat("d", CoordinatesFormat.DM)).toBe(CoordinatesFormat.D);
        expect(parseCoordinatesFormat("DM", CoordinatesFormat.D)).toBe(CoordinatesFormat.DM);
        expect(parseCoordinatesFormat("dms", CoordinatesFormat.D)).toBe(CoordinatesFormat.DMS);
    });

    test("falls back for unknown coordinate formats", () => {
        expect(parseCoordinatesFormat("invalid", CoordinatesFormat.DM)).toBe(CoordinatesFormat.DM);
    });
});

describe("Coordinates", () => {
    test("normalizes longitude into the [-180, 180] range", () => {
        expect(new Coordinates(0, 190).lng()).toBe(-170);
        expect(new Coordinates(0, -190).lng()).toBe(170);
    });

    test("sanitizes German east notation and comma-separated decimals", () => {
        expect(Coordinates.sanitize_string("N 48,123 O 7,456")).toBe("N 48.123 E 7.456");
    });

    test("parses decimal coordinates", () => {
        const coordinates = Coordinates.from_string("48.123 7.456");

        expect(coordinates).not.toBeNull();
        expect(coordinates!.lat()).toBeCloseTo(48.123);
        expect(coordinates!.lng()).toBeCloseTo(7.456);
    });

    test("parses degree-minute coordinates with hemisphere markers", () => {
        const coordinates = Coordinates.from_string("N 48 07.380 E 007 27.360");

        expect(coordinates).not.toBeNull();
        expect(coordinates!.lat()).toBeCloseTo(48.123, 6);
        expect(coordinates!.lng()).toBeCloseTo(7.456, 6);
    });

    test("rejects invalid coordinates", () => {
        expect(Coordinates.from_string("N 48 70.000 E 007 27.360")).toBeNull();
    });
});