import {App} from "./app.js";
import type {MapStateChange} from "./map_state.js";

export class MapStateObserver {
    public app: App;

    public constructor(app: App) {
        this.app = app;
        app.map_state.register_observer(this);
    }

    public update_state(_change: MapStateChange): void {
        throw new Error("not implemented");
    }
}
