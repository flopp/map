class MapWrapper extends MapStateObserver {
    constructor(div_id, app) {
        super(app.map_state);

        this.active = false;
        this.div_id = div_id;
        this.app = app;
        this.markers = new Map();

        this.create_map_object(div_id);
    }

    create_map_object (div_id) {
        throw new Error('not implemented: create_map_object');
    }

    set_map_type(map_type) {
        throw new Error('not implemented: set_map_type');
    }
    
    set_map_view(center, zoom) {
        throw new Error('not implemented: set_map_zoom');
    }

    invalidate_size() {}

    create_marker_object(marker) {
        throw new Error('not implemented: create_marker_object');
    }

    update_marker_object(obj, marker) {
        throw new Error('not implemented: update_marker_object');
    }

    delete_marker_object(obj) {
        throw new Error('not implemented: delete_marker_object');
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
            this.markers.forEach((marker, id, map) => {
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                self.delete_marker_object(self.markers.get(id));
                self.markers.delete(id)
            });
        }
    }
}
