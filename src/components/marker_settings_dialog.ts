import {App} from './app';
import {Color} from './color';
import {Coordinates, CoordinatesFormat, parseCoordinatesFormat} from './coordinates';
import {parse_float} from './utilities';

interface CoordinatesFormatDict {id: string, name: string};

export class MarkerSettingsDialog {
    private app: App;
    private div: HTMLElement;

    constructor(app: App) {
        const self = this;

        this.div = document.querySelector('#marker-settings-dialog')!;
        this.app = app;

        const format = this.div.querySelector('[data-coordinates-format]')!;
        [
            {id: CoordinatesFormat.D, name: 'Degrees'},
            {id: CoordinatesFormat.DM, name: 'Degrees+Minutes'},
            {id: CoordinatesFormat.DMS, name: 'Degrees+Minutes+Seconds'},
        ].forEach((item: CoordinatesFormatDict): void => {
            format.appendChild(
                new Option(
                    item.name,
                    item.id,
                    item.id === CoordinatesFormat.DM,
                    item.id === this.app.map_state.settings_marker_coordinates_format
                )
            );
        });

        this.div.querySelectorAll('[data-cancel]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.hide();
            });
        });
        this.div.querySelectorAll('[data-go]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.go();
            });
        });
    }

    public show(): void {
        const coordinates_input = this.div.querySelector('[data-coordinates-format]') as HTMLInputElement;
        const random_input = this.div.querySelector('[data-random-color]') as HTMLInputElement;
        const color_input = this.div.querySelector('[data-color]') as HTMLInputElement;
        const radius_input = this.div.querySelector('[data-radius]') as HTMLInputElement;

        coordinates_input.value = this.app.map_state.settings_marker_coordinates_format;
        random_input.checked = this.app.map_state.settings_marker_random_color;
        color_input.value = this.app.map_state.settings_marker_color.to_hash_string();
        radius_input.value = String(this.app.map_state.settings_marker_radius);

        this.div.classList.add('is-active');
    }

    private hide(): void {
        this.div.classList.remove('is-active');
    }

    private go(): void {
        const coordinates_input = this.div.querySelector('[data-coordinates-format]') as HTMLInputElement;
        const random_input = this.div.querySelector('[data-random-color]') as HTMLInputElement;
        const color_input = this.div.querySelector('[data-color]') as HTMLInputElement;
        const radius_input = this.div.querySelector('[data-radius]') as HTMLInputElement;

        const coordinates_format = parseCoordinatesFormat(coordinates_input.value, CoordinatesFormat.DMS);
        const random_color = random_input.checked;
        const color = Color.from_string(color_input.value);
        const radius = parse_float(radius_input.value);
        if (color === null || radius === null) {
            this.app.message_error(this.app.translate('dialog.marker-settings.bad_values_message'));
            return;
        }

        this.app.map_state.set_default_marker_settings({coordinates_format, random_color, color, radius});

        this.hide();
    }
}
