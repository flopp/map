import {MapStateObserver} from "./mapstate.js";

export class SidebarLines extends MapStateObserver {
    constructor(app) {
        super(app.map_state);

        const self = this;

        $("#btn-add-line").click(() => {
            self.map_state.add_line();
        });
        $("#btn-delete-lines").click(() => {
            self.map_state.delete_all_lines();
        });
    }

    update_state() {
    }
}