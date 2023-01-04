import {App} from "./app.js";

export class MapStateObserver {
    public app: App;

    public constructor(app: App) {
        this.app = app;
        app.map_state.register_observer(this);
    }

    public update_state(_changes: number, _marker_id: number = -1): void {
        throw new Error("not implemented");
    }
}
