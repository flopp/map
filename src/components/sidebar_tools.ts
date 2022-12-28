import {App} from "./app";
import {MapStateChange} from "./map_state";
import {SidebarItem} from "./sidebar_item";
import {create_element} from "./utilities";

export class SidebarTools extends SidebarItem {
    private readonly language_select: HTMLInputElement;

    public constructor(app: App, id: string) {
        super(app, id);

        this.language_select = this._div.querySelector("[data-language]")!;

        interface ITitleShort {
            title: string;
            short: string;
        }

        [
            {title: "English", short: "en"},
            {title: "Deutsch", short: "de"},
        ].forEach((language: ITitleShort): void => {
            this.language_select.append(
                new Option(
                    language.title,
                    language.short,
                    language.short === "en",
                    language.short === this.app.map_state.language,
                ),
            );
        });
        this.language_select.onchange = (): void => {
            this.app.map_state.set_language(this.language_select.value);
        };

        document.querySelector("#btn-link")!.addEventListener("click", (): void => {
            this.app.show_link_dialog();
        });

        document.querySelector("#btn-export-gpx")!.addEventListener("click", (): void => {
            this.export_gpx();
        });

        document
            .querySelector("#btn-import-gpx")!
            .addEventListener("click", (event: InputEvent): void => {
                //(document.querySelector("#inp-import-gpx") as HTMLButtonElement).click();
                this.app.message("NOT IMPLEMENTED, YET");
                event.preventDefault();
            });
        (document.querySelector("#inp-import-gpx") as HTMLInputElement).onchange = (
            event: InputEvent,
        ): void => {
            if (event.target === null) {
                return;
            }
            const files = (event.target as HTMLInputElement).files;
            if (files === null) {
                return;
            }
            this.import_gpx(files[0]);
        };

        document.querySelector("#btn-export-json")!.addEventListener("click", (): void => {
            this.export_json();
        });

        document
            .querySelector("#btn-import-json")!
            .addEventListener("click", (event: InputEvent): void => {
                (document.querySelector("#inp-import-json") as HTMLButtonElement).click();
                event.preventDefault();
            });
        (document.querySelector("#inp-import-json") as HTMLInputElement).onchange = (
            event: InputEvent,
        ): void => {
            if (event.target === null) {
                return;
            }
            const files = (event.target as HTMLInputElement).files;
            if (files === null) {
                return;
            }
            this.import_json(files[0]);
        };

        document.querySelector("#btn-multi-markers")!.addEventListener("click", (): void => {
            this.app.show_multi_markers_dialog();
        });
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.LANGUAGE) === MapStateChange.NOTHING) {
            return;
        }

        this.language_select.value = this.app.map_state.language;
    }

    public export_gpx(): void {
        const data = this.app.map_state.to_gpx();
        const element = create_element("a", [], {
            href: `data:application/gpx+xml;charset=utf-8,${encodeURIComponent(data)}`,
            download: "map.gpx",
        });
        element.style.display = "none";
        document.body.append(element);
        element.click();
        document.body.removeChild(element);
    }

    public import_gpx(file: File): void {
        const reader = new FileReader();
        reader.onloadend = (): void => {
            //const data = JSON.parse(reader.result as string);
            //this.app.map_state.from_json(data);
        };
        reader.readAsText(file);

        // Reset file input
        (document.querySelector("#inp-import-gpx") as HTMLInputElement).value = "";
    }

    public export_json(): void {
        const data = JSON.stringify(this.app.map_state.to_json());
        const element = create_element("a", [], {
            href: `data:application/json;charset=utf-8,${encodeURIComponent(data)}`,
            download: "map_state.json",
        });
        element.style.display = "none";
        document.body.append(element);
        element.click();
        document.body.removeChild(element);
    }

    public import_json(file: File): void {
        const reader = new FileReader();
        reader.onloadend = (): void => {
            const data = JSON.parse(reader.result as string);
            this.app.map_state.from_json(data);
            this.app.switch_map(this.app.map_state.map_type);
        };
        reader.readAsText(file);

        // Reset file input
        (document.querySelector("#inp-import-json") as HTMLInputElement).value = "";
    }
}
