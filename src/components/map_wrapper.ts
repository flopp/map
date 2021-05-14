import {App} from "./app";
import {Coordinates} from "./coordinates";
import {Line} from "./line";
import {MapStateChange} from "./map_state";
import {MapStateObserver} from "./map_state_observer";
import {MapType} from "./map_type";
import {Marker} from "./marker";

export class MapWrapper extends MapStateObserver {
    public active: boolean;
    private readonly div: HTMLElement;

    protected markers: Map<number, any>;
    protected lines: Map<number, any>;

    public constructor(div_id: string, app: App) {
        super(app);

        this.active = false;
        this.div = document.getElementById(div_id)!;
        this.markers = new Map();
        this.lines = new Map();

        this.create_map_object(div_id);
    }

    public create_map_object(_div_id: string): void {
        throw new Error("not implemented");
    }

    public set_map_type(_map_type: MapType): void {
        throw new Error("not implemented");
    }

    public set_hill_shading(_enabled: boolean): void {
        console.log("The 'hill_shading' feature is not implemented for this map wrapper.");
    }

    public set_german_npa(_enabled: boolean): void {
        console.log("The 'german_npa' feature is not implemented for this map wrapper.");
    }

    public set_opencaching(_enabled: boolean): void {
        console.log("The 'opencaching' feature is not implemented for this map wrapper.");
    }

    public set_map_view(_center: Coordinates, _zoom: number): void {
        throw new Error("not implemented");
    }

    public width(): number {
        return this.div.offsetWidth;
    }

    public height(): number {
        return this.div.offsetHeight;
    }

    public invalidate_size(): void {
        // Nothing
    }

    protected create_marker_object(_marker: Marker): void {
        throw new Error("not implemented");
    }

    protected update_marker_object(_obj: any, _marker: Marker): void {
        throw new Error("not implemented");
    }

    public delete_marker_object(_obj: any): void {
        throw new Error("not implemented");
    }

    public has_marker_object(id: number): boolean {
        return id >= 0 && this.markers.has(id);
    }

    public get_marker_object(id: number): any {
        return this.markers.get(id);
    }

    public create_line_object(_line: Line): void {
        throw new Error("not implemented");
    }

    public update_line_object(_obj: any, _line: Line): void {
        throw new Error("not implemented");
    }

    public delete_line_object(_obj: any): void {
        throw new Error("not implemented");
    }

    public create_icon(_marker: Marker): any {
        throw new Error("not implemented");
    }

    public activate(): void {
        this.active = true;
        this.update_state(MapStateChange.EVERYTHING);
    }

    public deactivate(): void {
        this.active = false;
    }

    public update_state(changes: number): void {
        if (!this.active) {
            return;
        }

        /* update view */
        if ((changes & MapStateChange.MAPTYPE) !== 0) {
            this.set_map_type(this.app.map_state.map_type!);
            this.set_hill_shading(this.app.map_state.hill_shading);
            this.set_german_npa(this.app.map_state.german_npa);
            this.set_opencaching(this.app.map_state.opencaching);
        }
        if ((changes & MapStateChange.VIEW) !== 0) {
            this.set_map_view(this.app.map_state.center!, this.app.map_state.zoom!);
        }

        if ((changes & MapStateChange.MARKERS) !== 0) {
            // Update and add markers
            this.app.map_state.markers.forEach((marker: Marker): void => {
                if (this.markers.has(marker.get_id())) {
                    this.update_marker_object(this.markers.get(marker.get_id()), marker);
                } else {
                    this.create_marker_object(marker);
                }
            });

            /* remove spurious markers */
            if (this.markers.size > this.app.map_state.markers.length) {
                const ids = new Set();
                this.app.map_state.markers.forEach((marker: Marker): void => {
                    ids.add(marker.get_id());
                });

                const deleted_ids: number[] = [];
                this.markers.forEach((_marker: any, id: number, _map: any): void => {
                    if (!ids.has(id)) {
                        deleted_ids.push(id);
                    }
                });

                deleted_ids.forEach((id: number): void => {
                    this.delete_marker_object(this.markers.get(id));
                    this.markers.delete(id);
                });
            }
        }

        if ((changes & (MapStateChange.LINES | MapStateChange.ZOOM)) !== 0) {
            // Update and add lines; also update lines on zoom to redraw arrow heads!
            this.app.map_state.lines.forEach((line: Line): void => {
                if (this.lines.has(line.get_id())) {
                    this.update_line_object(this.lines.get(line.get_id()), line);
                } else {
                    this.create_line_object(line);
                }
            });

            /* remove spurious lines */
            if (this.lines.size > this.app.map_state.lines.length) {
                const ids = new Set();
                this.app.map_state.lines.forEach((line: Line): void => {
                    ids.add(line.get_id());
                });

                const deleted_ids: number[] = [];
                this.lines.forEach((_line: any, id: number, _map: any): void => {
                    if (!ids.has(id)) {
                        deleted_ids.push(id);
                    }
                });

                deleted_ids.forEach((id: number): void => {
                    this.delete_line_object(this.lines.get(id));
                    this.lines.delete(id);
                });
            }
        }
    }
}
