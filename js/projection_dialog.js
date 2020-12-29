import {Color} from './color.js';
import {MapStateChange} from './map_state.js';
import {parse_float} from './utilities.js';

export class ProjectionDialog {
    constructor(app) {
        const self = this;

        this.div = document.querySelector('#projection-dialog');
        this.app = app;
        this.marker = null;

        this.div.querySelectorAll('[data-cancel]').forEach((el) => {
            el.onclick = () => {
                self.hide();
            };
        });
        this.div.querySelectorAll('[data-project]').forEach((el) => {
            el.onclick = () => {
                self.go();
            };
        });
    }

    show(marker) {
        this.marker = marker;
        this.div.querySelector('[data-distance]').value = '';
        this.div.querySelector('[data-bearing]').value = '';
        this.div.querySelector(
            '[data-targetname]',
        ).value = this.app.translate('dialog.projection.new_marker_name').replace('{1}', marker.name);
        this.div.querySelector(
            '[data-targetcolor]',
        ).value = marker.color.to_hash_string();
        this.div.querySelector('[data-targetradius]').value = '';
        this.div.querySelector(
            '[data-linecolor]',
        ).value = marker.color.to_hash_string();
        this.div.classList.add('is-active');
    }

    hide() {
        this.div.classList.remove('is-active');
    }

    go() {
        const distance = parse_float(
            this.div.querySelector('[data-distance]').value,
        );
        const bearing = parse_float(
            this.div.querySelector('[data-bearing]').value,
        );
        const target_name = this.div.querySelector('[data-targetname]').value;
        const target_color = Color.from_string(
            this.div.querySelector('[data-targetcolor]').value,
        );
        const target_radius = parse_float(
            this.div.querySelector('[data-targetradius]').value,
        );
        const create_line = this.div.querySelector('[data-line]').checked;
        const line_color = Color.from_string(
            this.div.querySelector('[data-linecolor]').value,
        );

        if (distance === null || distance <= 0) {
            this.app.message_error(this.app.translate('dialog.projection.bad_distance_message'));
            return;
        }
        if (bearing === null) {
            this.app.message_error(this.app.translate('dialog.projection.bad_bearing_message'));
            return;
        }

        const coordinates = this.marker.coordinates.project(bearing, distance);
        const target_marker = this.app.map_state.add_marker(coordinates);
        target_marker.name = target_name;
        target_marker.radius = target_radius !== null ? target_radius : -1;
        target_marker.color =
            target_color !== null ? target_color : this.marker.color;
        this.app.map_state.update_marker_storage(target_marker);

        if (create_line) {
            const line = this.app.map_state.add_line();
            line.marker1 = this.marker.get_id();
            line.marker2 = target_marker.get_id();
            line.color = line_color !== null ? line_color : this.marker.color;
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
