import {Color} from "./color.js";
import {Coordinates} from "./coordinates.js";

export class Storage {
    constructor() {
        this.ok = true;
        try {
            const x = '__storage_test__';
            window.localStorage.setItem(x, x);
            window.localStorage.removeItem(x);
        } catch (e) {
            this.ok = false;
            console.error("Local storage not available!");
        }
    }

    set(key, value) {
        if (!this.ok) {
            return;
        }

        if (value !== null) {
            window.localStorage.setItem(key, String(value));
        } else {
            window.localStorage.removeItem(key);
        }
    }

    get(key, default_value) {
        if (!this.ok) {
            return default_value;
        }

        const s = window.localStorage.getItem(key);
        if (s !== null) {
            return s;
        }
        return default_value;
    }

    set_int(key, value) {
        this.set(key, String(value));
    }
    set_bool(key, value) {
        if (value) {
            this.set_int(key, 1);
        } else {
            this.set_int(key, 0);
        }
    }
    set_float(key, value) {
        this.set(key, String(value));
    }
    set_color(key, value) {
        this.set(key, value.to_string());
    }
    set_coordinates(key, value) {
        this.set(key, `${value.lat()};${value.lng()}`);
    }

    get_int(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            return parseInt(s, 10);
        }
        return default_value;
    }
    get_bool(key, default_value) {
        if (default_value) {
            return this.get_int(key, 1) != 0;
        }
        return this.get_int(key, 0) != 0;
    }
    get_float(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            return parseFloat(s);
        }
        return default_value;
    }
    get_color(key, default_value) {
        const s = this.get(key, null);
        if (s === null) {
            return default_value;
        }

        const c = Color.from_string(s);
        if (c === null) {
            return default_value;
        }

        return c;
    }
    get_coordinates(key, default_value) {
        const s = this.get(key, null);
        if (s === null) {
            return default_value;
        }

        const c = Coordinates.from_string(s);
        if (c === null) {
            return default_value;
        }

        return c;
    }
}