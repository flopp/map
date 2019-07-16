import {MapStateObserver} from "./mapstate.js";

export class SidebarTools extends MapStateObserver {
    constructor(app) {
        super(app.map_state);
        this.app = app;

        const self = this;

        $("#btn-export-json").click(() => {
            self.export_json();
        });
    }

    update_state() {
        // nothing
    }

    export_json() {
        const data = JSON.stringify(this.map_state.to_json());
        const element = document.createElement('a');
        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
        element.setAttribute('download', 'mapstate.json');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}
