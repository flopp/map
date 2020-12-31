import { App } from './app';
import {MapStateChange} from './map_state';
import {MapStateObserver} from "./map_state_observer";
import {MapType, maptype2human, isGoogle} from './map_type';
import {remove_element} from "./utilities";

interface BaselayerDict {type: string, option?: HTMLOptionElement};
export class SidebarLayers extends MapStateObserver {
    private div: HTMLElement;
    private baselayers: BaselayerDict[];
    private baselayer_select: HTMLSelectElement;
    private hillshading_checkbox: HTMLInputElement;
    private german_npa_checkbox: HTMLInputElement;

    constructor(app: App) {
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
        this.baselayers.forEach((baselayer: BaselayerDict): void => {
            baselayer.option = new Option(
                maptype2human(baselayer.type),
                baselayer.type,
                false,
                baselayer.type === self.app.map_state.map_type
            );
            self.baselayer_select.appendChild(baselayer.option);
        });
        this.baselayer_select.onchange = (): void => {
            app.switch_map(self.baselayer_select.value);
        };

        this.div.querySelector('[data-add-keys-button]').addEventListener('click', (): void => {
            self.app.show_api_keys_dialog();
        });

        if (!app.has_google_maps()) {
            this.disable_google_layers();
        }

        this.hillshading_checkbox = this.div.querySelector(
            '[data-hillshading-layer]',
        );
        this.hillshading_checkbox.checked = this.app.map_state.hillshading;
        this.hillshading_checkbox.onchange = (): void => {
            self.app.map_state.set_hillshading(
                self.hillshading_checkbox.checked,
            );
        };

        this.german_npa_checkbox = this.div.querySelector(
            '[data-german-npa-layer]',
        );
        this.german_npa_checkbox.checked = this.app.map_state.german_npa;
        this.german_npa_checkbox.onchange = (): void => {
            self.app.map_state.set_german_npa(
                self.german_npa_checkbox.checked,
            );
        };
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.MAPTYPE) === MapStateChange.NOTHING) {
            return;
        }

        /* baselayer */
        this.baselayer_select.value = this.app.map_state.map_type;
        this.update_baselayer_help();
    }

    public disable_layers(check_function: (layxer_type: string) => boolean): void {
        this.baselayers.forEach((baselayer: BaselayerDict): void => {
            if (check_function(baselayer.type)) {
                if (baselayer.option) {
                    remove_element(baselayer.option);
                    baselayer.option = null;
                }
            }
        });
        this.update_baselayer_help();
    }

    public enable_layers(check_function: (layer_type: string) => boolean): void {
        const self = this;
        this.baselayers.forEach((baselayer: BaselayerDict): void => {
            if (check_function(baselayer.type)) {
                if (!baselayer.option) {
                    baselayer.option = new Option(
                        maptype2human(baselayer.type),
                        baselayer.type,
                        false,
                        baselayer.type === self.app.map_state.map_type
                    );
                    self.baselayer_select.appendChild(baselayer.option);
                }
            }
        });
        this.update_baselayer_help();
    }

    public disable_google_layers(): void {
        this.disable_layers(isGoogle);
    }

    public enable_google_layers(): void {
        this.enable_layers(isGoogle);
    }

    public update_baselayer_help(): void {
        const help_div = (this.div.querySelector('[data-baselayer-help]') as HTMLElement);
        if (this.app.has_google_maps()) {
            help_div.classList.add('is-hidden');
            return;
        }
        help_div.innerText = this.app.translate('sidebar.layers.google_disabled');
        help_div.classList.remove('is-hidden');
    }
}
