let last_random_color = null;

export class Color {
    constructor(hex) {
        if (!RegExp('^[0-9A-Fa-f]{6}$').test(hex)) {
            throw new Error(`bad hex-color: ${hex}`);
        }
        this.hex = hex;
    }

    static from_string(str) {
        if (RegExp('^[0-9A-Fa-f]{6}$').test(str)) {
            return new Color(str);
        }
        if (RegExp('^#[0-9A-Fa-f]{6}$').test(str)) {
            return new Color(str.substring(1));
        }
        return null;
    }

    static random() {
        return new Color((Math.random().toString(16) + '000000').slice(2, 8));
    }

    static random_from_palette() {
        const colors = [
            "FF3860", // bulma red
            "FFDD57", // bulma yellow
            "23D160", // bulma green
            "3273DC", // bulma dark blue
            "209CEE", // bulma light blue
            "00D1B2"  // bulma teal
        ];

        let hex = null;
        do {
            hex = colors[Math.floor(Math.random() * colors.length)];
        } while (hex == last_random_color);
        last_random_color = hex;

        return new Color(hex);
    }

    to_string() {
        return this.hex;
    }

    to_hash_string() {
        return `#${this.hex}`;
    }

    luma() {
        const
            rgb = parseInt(this.hex, 16),
            r = (rgb >> 16) & 0xff,
            g = (rgb >> 8) & 0xff,
            b = (rgb >> 0) & 0xff;
        // luma, per ITU-R BT.709
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    text_color() {
        if (this.luma() >= 128) {
            return new Color("000000");
        }
        return new Color("FFFFFF");
    }

    equals(other) {
        if (other === null) {
            return false;
        }
        return this.hex.toLowerCase() == other.hex.toLowerCase();
    }
}