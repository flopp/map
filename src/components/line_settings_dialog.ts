import {App} from "./app";
import {Color} from "./color";
import {Distance, DistanceFormat, parseDistanceFormat} from "./distance";

interface IDistanceFormatDict {
    id: DistanceFormat;
    name: string;
}

export class LineSettingsDialog {
    private readonly app: App;
    private readonly div: HTMLElement;

    constructor(app: App) {
        this.div = document.querySelector("#line-settings-dialog")!;
        this.app = app;

        const format = this.div.querySelector("[data-distance-format]")!;
        [
            {id: DistanceFormat.m, name: "m"},
            {id: DistanceFormat.km, name: "km"},
            {id: DistanceFormat.ft, name: "ft"},
            {id: DistanceFormat.mi, name: "mi"},
        ].forEach((item: IDistanceFormatDict): void => {
            format.appendChild(
                new Option(
                    item.name,
                    item.id,
                    item.id === DistanceFormat.m,
                    item.id === this.app.map_state.settings_line_distance_format,
                ),
            );
        });

        this.div.querySelectorAll("[data-cancel]").forEach((element: HTMLElement): void => {
            element.addEventListener("click", (): void => {
                this.hide();
            });
        });
        this.div.querySelectorAll("[data-go]").forEach((element: HTMLElement): void => {
            element.addEventListener("click", (): void => {
                this.go();
            });
        });
    }

    public show(): void {
        const format_input = this.div.querySelector("[data-distance-format]")! as HTMLInputElement;
        const random_input = this.div.querySelector("[data-random-color]")! as HTMLInputElement;
        const color_input = this.div.querySelector("[data-color]")! as HTMLInputElement;

        format_input.value = this.app.map_state.settings_line_distance_format;
        random_input.checked = this.app.map_state.settings_line_random_color;
        color_input.value = this.app.map_state.settings_line_color.to_hash_string();

        this.div.classList.add("is-active");
    }

    private hide(): void {
        this.div.classList.remove("is-active");
    }

    private go(): void {
        const format_input = this.div.querySelector("[data-distance-format]")! as HTMLInputElement;
        const random_input = this.div.querySelector("[data-random-color]")! as HTMLInputElement;
        const color_input = this.div.querySelector("[data-color]")! as HTMLInputElement;

        const distance_format = parseDistanceFormat(format_input.value, DistanceFormat.m);
        const random_color = random_input.checked;
        const color = Color.from_string(color_input.value);
        if (color === null) {
            this.app.message_error(this.app.translate("dialog.line-settings.bad_values_message"));
            return;
        }

        this.app.map_state.set_default_line_settings({distance_format, random_color, color});

        this.hide();
    }
}
