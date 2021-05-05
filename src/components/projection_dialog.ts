import {App} from './app';
import {Color} from './color';
import {MapStateChange} from './map_state';
import {Marker} from './marker';
import {parse_float} from './utilities';

export class ProjectionDialog {
    private div: HTMLElement;
    private app: App;
    private marker: Marker|null;

    constructor(app: App) {
        const self = this;

        this.div = document.querySelector('#projection-dialog')!;
        this.app = app;
        this.marker = null;

        this.div.querySelectorAll('[data-cancel]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.hide();
            });
        });
        this.div.querySelectorAll('[data-project]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.go();
            });
        });
    }

    public show(marker: Marker): void {
        this.marker = marker;
        (this.div.querySelector('[data-distance]') as HTMLInputElement).value = '';
        (this.div.querySelector('[data-bearing]') as HTMLInputElement).value = '';
        const name = this.app.translate('dialog.projection.new_marker_name').replace('{1}', marker.name);
        (this.div.querySelector(
            '[data-target-name]',
        ) as HTMLInputElement).value = name;
        (this.div.querySelector(
            '[data-target-color]',
        ) as HTMLInputElement).value = marker.color.to_hash_string();
        (this.div.querySelector('[data-target-radius]') as HTMLInputElement).value = '';
        (this.div.querySelector(
            '[data-line-color]',
        ) as HTMLInputElement).value = marker.color.to_hash_string();
        this.div.classList.add('is-active');
    }

    public hide(): void {
        this.div.classList.remove('is-active');
    }

    public go(): void {
        const distance = parse_float(
            (this.div.querySelector('[data-distance]') as HTMLInputElement).value,
        );
        const bearing = parse_float(
            (this.div.querySelector('[data-bearing]') as HTMLInputElement).value,
        );
        const target_name = (this.div.querySelector('[data-target-name]') as HTMLInputElement).value;
        const target_color = Color.from_string(
            (this.div.querySelector('[data-target-color]') as HTMLInputElement).value,
        );
        const target_radius = parse_float(
            (this.div.querySelector('[data-target-radius]') as HTMLInputElement).value,
        );
        const create_line = (this.div.querySelector('[data-line]') as HTMLInputElement).checked;
        const line_color = Color.from_string(
            (this.div.querySelector('[data-line-color]') as HTMLInputElement).value,
        );

        if (distance === null || distance <= 0) {
            this.app.message_error(this.app.translate('dialog.projection.bad_distance_message'));
            return;
        }
        if (bearing === null) {
            this.app.message_error(this.app.translate('dialog.projection.bad_bearing_message'));
            return;
        }

        const coordinates = this.marker!.coordinates.project(bearing, distance);
        const target_marker = this.app.map_state.add_marker(coordinates);
        target_marker.name = target_name;
        target_marker.radius = target_radius !== null ? target_radius : -1;
        target_marker.color =
            target_color !== null ? target_color : this.marker!.color;
        this.app.map_state.update_marker_storage(target_marker);

        if (create_line) {
            const line = this.app.map_state.add_line();
            line.marker1 = this.marker!.get_id();
            line.marker2 = target_marker.get_id();
            line.color = line_color !== null ? line_color : this.marker!.color;
            this.app.map_state.update_line_storage(line);
            this.app.map_state.update_observers(
                MapStateChange.MARKERS | MapStateChange.LINES,
            );
        } else {
            this.app.map_state.update_observers(MapStateChange.MARKERS);
        }

        this.hide();
    }
}
