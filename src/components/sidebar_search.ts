import {App} from "./app";
import {Coordinates} from "./coordinates";
import {MapStateChange} from "./map_state";
import {SidebarItem} from "./sidebar_item";
import { create_element } from "./utilities";

interface INameCoordinates {
    name: string;
    coordinates: Coordinates;
}

export class SidebarSearch extends SidebarItem {
    private readonly centerField: HTMLParagraphElement;

    public constructor(app: App, id: string) {
        super(app, id);

        this.centerField = document.querySelector("#sidebar-search-center")!;

        document.querySelector("#btn-locate")!.addEventListener("click", (): void => {
            this.app.locate_me();
        });
        document.querySelector("#btn-search")!.addEventListener("click", (): void => {
            this.perform_search();
        });
        document
            .querySelector("#input-search")!
            .addEventListener("keyup", (event: KeyboardEvent): void => {
                if (event.key === "Enter") {
                    this.perform_search();
                }
            });
        document.querySelector("#sidebar-search-center-copy")!.addEventListener("click", (event: Event): void => {
            const center = this.app.map_state.center;
            if (center === null) {
                return;
            }
            const text = center.to_string(
                this.app.map_state.settings_marker_coordinates_format,
            );
            this.app.copyClipboard(
                text,
                this.app.translate("sidebar.markers.copy_coordinates_success_message", text),
                this.app.translate("sidebar.markers.copy_coordinates_failure_message"),
            );
            event.stopPropagation();
        });
        document.querySelector("#sidebar-search-add-marker")!.addEventListener("click", (): void => {
            this.app.map_state.add_marker(null);
        });

        this.clear_results();
    }

    public update_state(changes: number, _marker_id: number = -1): void {
        if ((changes & (MapStateChange.CENTER | MapStateChange.MARKERS)) === MapStateChange.NOTHING) {
            return;
        }

        this.centerField.innerText =
            (this.app.map_state.center === null) ?
            "n/a" :
            this.app.map_state.center.to_string(this.app.map_state.settings_marker_coordinates_format);
    }

    public display_results(results: INameCoordinates[]): void {
        const list = document.querySelector(
            "#search-results",
        ) as HTMLUListElement;

        list.innerHTML = "";

        if (results.length === 0) {
            const item = create_element("li");
            item.innerText = this.app.translate("search.no-result");
            list.append(item);
        } else {
            results.forEach((result: INameCoordinates) => {
                const item = create_element("li");
                const a = create_element("a");
                a.innerText = result.name;
                item.append(a);
                list.append(item);
                a.addEventListener("click", (): void => {
                    this.app.map_state.set_center(result.coordinates);
                });
            });

            this.app.map_state.set_center(results[0].coordinates);
        }

        list.classList.remove("is-hidden");
    }

    public clear_results(): void {
        const list = document.querySelector(
            "#search-results",
        ) as HTMLUListElement;

        list.innerHTML = "";
        list.classList.add("is-hidden");
    }

    public perform_search(): void {
        this.clear_results();

        const location_string = (document.querySelector(
            "#input-search",
        ) as HTMLInputElement).value.trim();
        if (location_string.length === 0) {
            return;
        }

        // Try to parse "location_string" as coordinates
        const coordinates = Coordinates.from_string(location_string);
        if (coordinates !== null) {
            this.display_results([{name: coordinates.to_string(this.app.map_state.settings_marker_coordinates_format), coordinates}]);

            return;
        }

        // Try to resolve "location_string" via a nominatim search
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${location_string}`;
        fetch(url)
            .then(
                (response: Response): Promise<any> => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    const contentType = response.headers.get("content-type");
                    if (contentType === null || !contentType.includes("application/json")) {
                        throw new TypeError("Response is not JSON");
                    }

                    return response.json();
                },
            )
            .then((json_data): void => {
                const results: INameCoordinates[] = [];
                if (json_data.length > 0) {
                    json_data.forEach((element: any) => {
                        results.push({
                            name: element.display_name,
                            coordinates: new Coordinates(element.lat, element.lon),
                        });
                    });
                } else {
                    this.app.message_error(this.app.translate("search.no-result"));
                }
                this.display_results(results);
            })
            .catch((error: any): void => {
                this.app.message_error(this.app.translate("search.server-error", error));
                this.display_results([]);
            });
    }
}
