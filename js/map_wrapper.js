import {MapStateObserver} from "./mapstate.js";

export class MapWrapper extends MapStateObserver {
    constructor(div_id, app) {
        super(app.map_state);

        this.active = false;
        this.div_id = div_id;
        this.app = app;
        this.markers = new Map();
        this.lines = new Map();

        this.create_map_object(div_id);
    }

    create_map_object (_div_id) {
        throw new Error('not implemented');
    }

    set_map_type(_map_type) {
        throw new Error('not implemented');
    }

    set_map_view(_center, _zoom) {
        throw new Error('not implemented');
    }

    invalidate_size() {}

    create_marker_object(_marker) {
        throw new Error('not implemented');
    }

    update_marker_object(_obj, _marker) {
        throw new Error('not implemented');
    }

    delete_marker_object(_obj) {
        throw new Error('not implemented');
    }

    has_marker_object(id) {
        return (id >= 0) && this.markers.has(id);
    }

    get_marker_object(id) {
        return this.markers.get(id);
    }

    create_line_object(_line) {
        throw new Error('not implemented');
    }

    update_line_object(_obj, _line) {
        throw new Error('not implemented');
    }

    delete_line_object(_obj) {
        throw new Error('not implemented');
    }

    activate() {
        this.update_state();
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    update_state() {
        const self = this;

        /* update view */
        this.set_map_type(this.map_state.map_type);
        this.set_map_view(this.map_state.center, this.map_state.zoom);

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if (self.markers.has(marker.id)) {
                self.update_marker_object(self.markers.get(marker.id), marker);
            } else {
                self.create_marker_object(marker);
            }
        });

        /* remove spurious markers */
        if (this.markers.size > this.map_state.markers.length) {
            const ids = new Set();
            this.map_state.markers.forEach((marker) => {
                ids.add(marker.id);
            });

            const deleted_ids = [];
            this.markers.forEach((_marker, id, _map) => {
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                self.delete_marker_object(self.markers.get(id));
                self.markers.delete(id);
            });
        }

        /* update and add lines */
        this.map_state.lines.forEach((line) => {
            if (self.lines.has(line.id)) {
                self.update_line_object(self.lines.get(line.id), line);
            } else {
                self.create_line_object(line);
            }
        });

        /* remove spurious lines */
        if (this.lines.size > this.map_state.lines.length) {
            const ids = new Set();
            this.map_state.lines.forEach((line) => {
                ids.add(line.id);
            });

            const deleted_ids = [];
            this.lines.forEach((_line, id, _map) => {
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                self.delete_line_object(self.lines.get(id));
                self.lines.delete(id);
            });
        }
    }
}
