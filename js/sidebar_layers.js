import {MapStateObserver, MapStateChange} from './map_state.js';
import {MapType, maptype2human, isGoogle, isBing} from './map_type.js';

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
            {type: MapType.BING_ROAD},
            {type: MapType.BING_AERIAL},
            {type: MapType.BING_AERIAL_NO_LABELS},
        ];

        this.baselayer_select = this.div.querySelector('[data-baselayer]');
        this.baselayers.forEach((baselayer) => {
            baselayer.option = document.createElement('option');
            baselayer.option.value = baselayer.type;
            baselayer.option.text = maptype2human(baselayer.type);
            self.baselayer_select.add(baselayer.option);
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
        if (!app.has_bing_maps()) {
            this.disable_bing_layers();
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
                    baselayer.option.remove();
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
                    baselayer.option = document.createElement('option');
                    baselayer.option.value = baselayer.type;
                    baselayer.option.text = maptype2human(baselayer.type);
                    self.baselayer_select.add(baselayer.option);
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

    disable_bing_layers() {
        this.disable_layers(isBing);
        this.update_baselayer_help();
    }

    enable_bing_layers() {
        this.enable_layers(isBing);
    }

    update_baselayer_help() {
        const help_div = this.div.querySelector('[data-baselayer-help]');
        if (this.app.has_google_maps()) {
            if (this.app.has_bing_maps()) {
                help_div.classList.add('is-hidden');
                return;
            }
            help_div.innerText = this.app.translate('sidebar.layers.bing_disabled');
        } else if (this.app.has_bing_maps()) {
            help_div.innerText = this.app.translate('sidebar.layers.google_disabled');
        } else {
            help_div.innerText = this.app.translate('sidebar.layers.google_and_bing_disabled');
        }
        help_div.classList.remove('is-hidden');
    }
}
