let last_random_color: Color = null;

export class Color {
    private hex: string = "";

    constructor(hex: string) {
        if (!RegExp('^[0-9A-Fa-f]{6}$').test(hex)) {
            throw new Error(`bad hex-color: ${hex}`);
        }
        this.hex = hex;
    }

    public static from_string(str: string) : Color|null {
        if (RegExp('^[0-9A-Fa-f]{6}$').test(str)) {
            return new Color(str);
        }
        if (RegExp('^#[0-9A-Fa-f]{6}$').test(str)) {
            return new Color(str.substring(1));
        }
        return null;
    }

    public static random() : Color{
        return new Color((Math.random().toString(16) + '000000').slice(2, 8));
    }

    public static random_from_palette() : Color {
        const colors = [
            'FF3860', // bulma red
            'FFDD57', // bulma yellow
            '23D160', // bulma green
            '3273DC', // bulma dark blue
            '209CEE', // bulma light blue
            '00D1B2', // bulma teal
        ];

        let hex = null;
        do {
            hex = colors[Math.floor(Math.random() * colors.length)];
        } while (hex === last_random_color);
        last_random_color = hex;

        return new Color(hex);
    }

    public to_string() : string{
        return this.hex;
    }

    public to_hash_string() : string {
        return `#${this.hex}`;
    }

    public luma() : number{
        const rgb = parseInt(this.hex, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        // luma, per ITU-R BT.709
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    public text_color() : Color {
        if (this.luma() >= 128) {
            return new Color('000000');
        }
        return new Color('FFFFFF');
    }

    public equals(other?: Color) : boolean {
        if (other === null) {
            return false;
        }
        return this.hex.toLowerCase() === other.hex.toLowerCase();
    }
}
