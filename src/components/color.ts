let last_random_color: string|null = null;

export class Color {
    // tslint:disable-next-line: prefer-readonly
    private hex: string = "";

    public constructor(hex: string) {
        if (!RegExp("^[0-9A-Fa-f]{6}$").test(hex)) {
            throw new Error(`bad hex-color: ${hex}`);
        }
        this.hex = hex;
    }

    public static from_string(str: string): Color|null {
        if (RegExp("^[0-9A-Fa-f]{6}$").test(str)) {
            return new Color(str);
        }
        if (RegExp("^#[0-9A-Fa-f]{6}$").test(str)) {
            return new Color(str.substring(1));
        }
        return null;
    }

    public static random_from_palette(): Color {
        const colors = [
            "FF3860", // Bulma red
            "FFDD57", // Bulma yellow
            "23D160", // Bulma green
            "3273DC", // Bulma dark blue
            "209CEE", // Bulma light blue
            "00D1B2", // Bulma teal
        ];

        let hex = null;
        do {
            hex = colors[Math.floor(Math.random() * colors.length)];
        } while (hex === last_random_color);
        last_random_color = hex;

        return new Color(hex);
    }

    public to_string(): string {
        return this.hex;
    }

    public to_hash_string(): string {
        return `#${this.hex}`;
    }

    public luma(): number {
        const rgb = parseInt(this.hex, 16);
        const r = (rgb >> 16) & 0xFF;
        const g = (rgb >> 8) & 0xFF;
        const b = (rgb >> 0) & 0xFF;
        // Luma, per ITU-R BT.709
        return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    }

    public text_color(): Color {
        if (this.luma() >= 128) {
            return new Color("000000");
        }
        return new Color("FFFFFF");
    }

    public equals(other: Color|null): boolean {
        if (other === null) {
            return false;
        }
        return this.hex.toLowerCase() === other.hex.toLowerCase();
    }

    public static default_color(): Color {
        return new Color("3273DC");
    }
}
