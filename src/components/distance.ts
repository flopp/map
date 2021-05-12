export enum DistanceFormat {
    m = "m",
    km = "km",
    ft = "ft",
    mi = "mi",
}

export const parseDistanceFormat = (value: string, fallback: DistanceFormat): DistanceFormat => {
    switch (value.toLowerCase()) {
        case "m":
            return DistanceFormat.m;
        case "km":
            return DistanceFormat.km;
        case "ft":
            return DistanceFormat.ft;
        case "mi":
            return DistanceFormat.mi;
        default:
            return fallback;
    }
};

export class Distance {
    private _raw_m: number;

    public constructor(value: number, format: DistanceFormat) {
        this.set(value, format);
    }

    public set(value: number, format: DistanceFormat): void {
        switch (format) {
            case DistanceFormat.m:
                this._raw_m = value;
            case DistanceFormat.km:
                this._raw_m = value * 1000;
            case DistanceFormat.ft:
                this._raw_m = value * 0.3048;
            case DistanceFormat.mi:
                this._raw_m = value * 1609.344;
            default:
                this._raw_m = value;
        }
    }

    public to_string(format: DistanceFormat): string {
        let value = this._raw_m;
        let precision = 2;
        switch (format) {
            case DistanceFormat.m:
                value = this._raw_m;
                precision = 2;
            case DistanceFormat.km:
                value = this._raw_m / 1000;
                precision = 3;
            case DistanceFormat.ft:
                value = this._raw_m / 0.3048;
                precision = 1;
            case DistanceFormat.mi:
                value = this._raw_m / 1609.344;
                precision = 3;
            default:
                value = this._raw_m;
                precision = 2;
        }

        return `${value.toFixed(precision)} ${format}`;
    }

    public m(): number {
        return this._raw_m;
    }
}
