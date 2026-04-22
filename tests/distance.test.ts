import {describe, expect, test} from "vitest";

import {Distance, DistanceFormat, parseDistanceFormat} from "../src/components/distance";

describe("parseDistanceFormat", () => {
    test("parses known distance formats", () => {
        expect(parseDistanceFormat("m", DistanceFormat.km)).toBe(DistanceFormat.m);
        expect(parseDistanceFormat("KM", DistanceFormat.m)).toBe(DistanceFormat.km);
        expect(parseDistanceFormat("ft", DistanceFormat.m)).toBe(DistanceFormat.ft);
        expect(parseDistanceFormat("mi", DistanceFormat.m)).toBe(DistanceFormat.mi);
    });

    test("falls back for unknown distance formats", () => {
        expect(parseDistanceFormat("yards", DistanceFormat.ft)).toBe(DistanceFormat.ft);
    });
});

describe("Distance", () => {
    test("stores kilometers internally as meters", () => {
        const distance = new Distance(1.5, DistanceFormat.km);

        expect(distance.m()).toBeCloseTo(1500);
    });

    test("stores miles internally as meters", () => {
        const distance = new Distance(1, DistanceFormat.mi);

        expect(distance.m()).toBeCloseTo(1609.344);
    });

    test("formats meters with two decimals", () => {
        const distance = new Distance(12.3456, DistanceFormat.m);

        expect(distance.to_string(DistanceFormat.m)).toBe("12.35 m");
    });

    test("formats kilometers with three decimals", () => {
        const distance = new Distance(1500, DistanceFormat.m);

        expect(distance.to_string(DistanceFormat.km)).toBe("1.500 km");
    });
});