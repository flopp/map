import {MapStateObserver, MapStateChange} from './map_state.js';
import {MapType, maptype2human, isGoogle} from './map_type.js';
import {create_element, remove_element} from "./utilities.js";

export class SidebarLayers extends MapStateObserver {
    constructor(app) {
        super(app);
        const self = this;

        this.div = document.querySelector('#sidebar-layers');

        this.baselayers = [
            {type: MapType.OPENSTREETMAP},
            {type: MapType.OPENTOPOMAP},
            {type: MapType.STAMEN_TERRAIN},
            {type: MapType.ARCGIS_WORLDIMAGERY},
            {type: MapType.GOOGLE_ROADMAP},
            {type: MapType.GOOGLE_SATELLITE},
            {type: MapType.GOOGLE_HYBRID},
            {type: MapType.GOOGLE_TERRAIN},
        ];

        this.baselayer_select = this.div.querySelector('[data-baselayer]');
        this.baselayers.forEach((baselayer) => {
            baselayer.option = new Option(maptype2human(baselayer.type), baselayer.type, false, baselayer.type === self.app.map_state.map_type);
            self.baselayer_select.appendChild(baselayer.option);
        });
        this.baselayer_select.onchange = () => {
            app.switch_map(self.baselayer_select.value);
        };

        this.div.querySelector('[data-add-keys-button]').onclick = () => {
            self.app.show_api_keys_dialog();
        };

        if (!app.has_google_maps()) {
            this.disable_google_layers();
        }

        this.hillshading_checkbox = this.div.querySelector(
            '[data-hillshading-layer]',
        );
        this.hillshading_checkbox.checked = this.app.map_state.hillshading;
        this.hillshading_checkbox.onchange = () => {
            self.app.map_state.set_hillshading(
                self.hillshading_checkbox.checked,
            );
        };

        this.german_npa_checkbox = this.div.querySelector(
            '[data-german-npa-layer]',
        );
        this.german_npa_checkbox.checked = this.app.map_state.german_npa;
        this.german_npa_checkbox.onchange = () => {
            self.app.map_state.set_german_npa(
                self.german_npa_checkbox.checked,
            );
        };
    }

    update_state(changes) {
        if ((changes & MapStateChange.MAPTYPE) == MapStateChange.NOTHING) {
            return;
        }

        /* baselayer */
        this.baselayer_select.value = this.app.map_state.map_type;
        this.update_baselayer_help();
    }

    disable_layers(check_function) {
        this.baselayers.forEach((baselayer) => {
            if (check_function(baselayer.type)) {
                if (baselayer.option) {
                    remove_element(baselayer.option);
                    baselayer.option = null;
                }
            }
        });
        this.update_baselayer_help();
    }

    enable_layers(check_function) {
        const self = this;
        this.baselayers.forEach((baselayer) => {
            if (check_function(baselayer.type)) {
                if (!baselayer.option) {
                    baselayer.option = new Option(maptype2human(baselayer.type), baselayer.type, false, baselayer.type === self.app.map_state.map_type);
                    self.baselayer_select.appendChild(baselayer.option);
                }
            }
        });
        this.update_baselayer_help();
    }

    disable_google_layers() {
        this.disable_layers(isGoogle);
    }

    enable_google_layers() {
        this.enable_layers(isGoogle);
    }

    update_baselayer_help() {
        const help_div = this.div.querySelector('[data-baselayer-help]');
        if (this.app.has_google_maps()) {
            help_div.classList.add('is-hidden');
            return;
        }
        help_div.innerText = this.app.translate('sidebar.layers.google_disabled');
        help_div.classList.remove('is-hidden');
    }
}
