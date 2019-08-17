import {MapStateObserver} from "./mapstate.js";

export class SidebarTools extends MapStateObserver {
    constructor(app) {
        super(app.map_state);
        this.app = app;

        const self = this;

        $("#btn-link").click(() => {
            self.app.show_link_dialog();
        });

        $("#btn-export-json").click(() => {
            self.export_json();
        });

        $("#btn-import-json").click((event) => {
            $("#inp-import-json").click();
            event.preventDefault();
        });
        $("#inp-import-json").change((event) => {
            self.import_json(event.target.files[0]);
        });

        $("#btn-multi-markers").click(() => {
            self.app.show_multi_markers_dialog();
        });
    }

    update_state(_changes) {
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

    import_json(file) {
        const self = this;
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = () => {
            const data = JSON.parse(reader.result);
            self.map_state.from_json(data);
            self.app.switch_map(self.map_state.map_type);
        };

        // reset file input
        const input = $("#inp-import-json");
        input.wrap('<form>').closest('form').get(0).reset();
        input.unwrap();
    }
}
