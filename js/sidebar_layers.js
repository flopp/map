import {MapStateObserver, MapStateChange} from './map_state.js';
import {MapType, maptype2human, isGoogle, isBing} from './map_type.js';

export class SidebarLayers extends MapStateObserver {
    constructor(app) {
        super(app);
        const self = this;

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

        this.baselayer_select = $('#sidebar-layers').find('[data-baselayer]');
        this.baselayers.forEach((baselayer) => {
            baselayer.option = $(`<option value=${baselayer.type}>`).text(
                maptype2human(baselayer.type),
            );
            self.baselayer_select.append(baselayer.option);
        });
        this.baselayer_select.change(() => {
            app.switch_map(self.baselayer_select.val());
        });

        $('#btn-api-keys').click(() => {
            self.app.show_api_keys_dialog();
        });

        if (!app.has_google_maps()) {
            this.disable_google_layers();
        }
        if (!app.has_bing_maps()) {
            this.disable_bing_layers();
        }
    }

    update_state(changes) {
        if ((changes & MapStateChange.MAPTYPE) == MapStateChange.NOTHING) {
            return;
        }

        /* baselayer */
        $('#sidebar-layers')
            .find('[data-baselayer]')
            .val(this.map_state.map_type);
        this.update_baselayer_help();
    }

    disable_layers(check_function) {
        this.baselayers.forEach((baselayer) => {
            if (check_function(baselayer.type)) {
                baselayer.option.remove();
                baselayer.option = null;
            }
        });
        this.update_baselayer_help();
    }

    enable_layers(check_function) {
        this.baselayers.forEach((baselayer) => {
            if (check_function(baselayer.type)) {
                baselayer.option = $(`<option value=${baselayer.type}>`).text(
                    maptype2human(baselayer.type),
                );
                self.baselayer_select.append(baselayer.option);
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
        const help_div = $('#sidebar-layers').find('[data-baselayer-help]');
        let missing_layers = '';
        if (this.app.has_google_maps()) {
            if (this.app.has_bing_maps()) {
                help_div.addClass('is-hidden');
                return;
            }
            missing_layers = 'Bing Maps';
        } else if (this.app.has_bing_maps()) {
            missing_layers = 'Google Maps';
        } else {
            missing_layers = 'Google Maps and Bing Maps';
        }
        help_div.removeClass('is-hidden');
        help_div.text(
            `${missing_layers} layers have been disabled due to missing/invalid API keys or other API problems.`,
        );
    }
}
