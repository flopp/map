import {MapStateChange, MapStateObserver} from './map_state.js';

export class SidebarTools extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        const div = document.querySelector('#sidebar-tools');
        this.language_select = div.querySelector('[data-language]');
        [
            {title: 'English', short: 'en'},
            {title: 'Deutsch', short: 'de'},
        ].forEach((language) => {
            const option = document.createElement('option');
            option.value = language.short;
            option.text = language.title;
            self.language_select.add(option);
        });
        this.language_select.onchange = () => {
            self.app.map_state.set_language(self.language_select.value);
        };

        document.querySelector('#btn-link').addEventListener('click', () => {
            self.app.show_link_dialog();
        });

        document.querySelector('#btn-export-json').addEventListener('click', () => {
            self.export_json();
        });

        document.querySelector('#btn-import-json').addEventListener('click', (event) => {
            document.querySelector('#inp-import-json').click();
            event.preventDefault();
        });
        document.querySelector('#inp-import-json').onchange = (event) => {
            self.import_json(event.target.files[0]);
        };

        document.querySelector('#btn-multi-markers').addEventListener('click', () => {
            self.app.show_multi_markers_dialog();
        });
    }

    update_state(changes) {
        if ((changes & MapStateChange.LANGUAGE) == MapStateChange.NOTHING) {
            return;
        }

        this.language_select.value = this.app.map_state.language;
    }

    export_json() {
        const data = JSON.stringify(this.app.map_state.to_json());
        const element = document.createElement('a');
        element.setAttribute(
            'href',
            'data:application/json;charset=utf-8,' + encodeURIComponent(data),
        );
        element.setAttribute('download', 'map_state.json');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    import_json(file) {
        const self = this;
        const reader = new FileReader();
        reader.onloadend = () => {
            const data = JSON.parse(reader.result);
            self.app.map_state.from_json(data);
            self.app.switch_map(self.app.map_state.map_type);
        };
        reader.readAsText(file);

        // reset file input
        document.querySelector('#inp-import-json').value = '';
    }
}
