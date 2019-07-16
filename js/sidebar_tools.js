import {MapStateObserver} from "./mapstate.js";

export class SidebarTools extends MapStateObserver {
    constructor(app) {
        super(app.map_state);
        this.app = app;

        const self = this;

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

    import_json(file) {        
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = () => {
            const data = JSON.parse(reader.result);
            console.log(data);
            // TODO: restore map state
        };

        // reset file input
        const input = $("#inp-import-json");
        input.wrap('<form>').closest('form').get(0).reset();
        input.unwrap();
    }
}
