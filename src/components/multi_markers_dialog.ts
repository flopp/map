import {App} from './app';
import {Color} from './color';
import {Coordinates} from './coordinates';
import {MapStateChange} from './map_state';
import {parse_float} from './utilities';

export class MultiMarkersDialog {
    private app: App;
    private div: HTMLElement;

    constructor(app: App) {
        const self = this;

        this.div = document.querySelector('#multi-markers-dialog');
        this.app = app;

        (this.div.querySelector('[data-use-common-name]') as HTMLInputElement).onchange = (): void => {
            self.update_description();
        };
        (this.div.querySelector('[data-use-common-color]') as HTMLInputElement).onchange = (): void => {
            self.update_description();
        };
        (this.div.querySelector('[data-use-common-radius]') as HTMLInputElement).onchange = (): void => {
            self.update_description();
        };

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
        this.div.classList.add('is-active');
        (this.div.querySelector(
            '[data-common-color]',
        ) as HTMLInputElement).value = Color.random_from_palette().to_hash_string();
        this.update_description();
    }

    private hide(): void {
        this.div.classList.remove('is-active');
    }

    private go(): void {
        const self = this;

        const use_common_name = (this.div.querySelector('[data-use-common-name]') as HTMLInputElement)
            .checked;
        const use_common_color = (this.div.querySelector(
            '[data-use-common-color]',
        ) as HTMLInputElement).checked;
        const use_common_radius = (this.div.querySelector(
            '[data-use-common-radius]',
        ) as HTMLInputElement).checked;
        const common_name = (this.div.querySelector('[data-common-name]') as HTMLInputElement).value;
        const common_color = Color.from_string(
            (this.div.querySelector('[data-common-color]') as HTMLInputElement).value,
        );
        const common_radius = parse_float(
            (this.div.querySelector('[data-common-radius]') as HTMLInputElement).value,
        );

        if (use_common_color && common_color === null) {
            this.app.message_error(
                this.app.translate(
                    'dialog.multimarkers.bad_common_color_message',
                ),
            );
            return;
        }
        if (use_common_radius && common_radius === null) {
            this.app.message_error(
                this.app.translate(
                    'dialog.multimarkers.bad_common_radius_message',
                ),
            );
            return;
        }

        let tokens_per_line = 1;
        if (!use_common_name) {
            tokens_per_line += 1;
        }
        if (!use_common_color) {
            tokens_per_line += 1;
        }
        if (!use_common_radius) {
            tokens_per_line += 1;
        }

        interface MarkerDict {
            name: string;
            coordinates: Coordinates;
            radius: number;
            color: Color;
        }

        const errors: string[] = [];
        const data: MarkerDict[] = [];
        let line_index = 0;
        let marker_index = 1;
        (this.div.querySelector('[data-marker-data]') as HTMLInputElement)
            .value.split('\n')
            .forEach((line: string): void => {
                line_index += 1;

                if (line.trim() === '') {
                    return;
                }

                let line_has_errors = false;
                const tokens = line.split(';');
                if (tokens.length !== tokens_per_line) {
                    errors.push(
                        self.app
                            .translate('dialog.multimarkers.tokens_message')
                            .replace('{1}', String(line_index))
                            .replace('{2}', String(tokens_per_line)),
                    );
                    line_has_errors = true;
                }
                let token_index = 0;

                const coordinates = Coordinates.from_string(
                    tokens[token_index].trim(),
                );

                if (coordinates === null) {
                    errors.push(
                        self.app
                            .translate(
                                'dialog.multimarkers.coordinates_message',
                            )
                            .replace('{1}', String(line_index))
                            .replace('{2}', tokens[token_index].trim()),
                    );
                    line_has_errors = true;
                }
                token_index += 1;

                let name = `${common_name}${marker_index}`;
                if (!use_common_name) {
                    name = tokens[token_index].trim();
                    if (name === '') {
                        errors.push(
                            self.app
                                .translate('dialog.multimarkers.name_message')
                                .replace('{1}', String(line_index)),
                        );
                        line_has_errors = true;
                    }
                    token_index += 1;
                }

                let color = common_color;
                if (!use_common_color) {
                    color = Color.from_string(tokens[token_index].trim());
                    if (color === null) {
                        errors.push(
                            self.app
                                .translate('dialog.multimarkers.color_message')
                                .replace('{1}', String(line_index))
                                .replace('{2}', tokens[token_index].trim()),
                        );
                        line_has_errors = true;
                    }
                    token_index += 1;
                }

                let radius = common_radius;
                if (!use_common_radius) {
                    radius = parse_float(tokens[token_index].trim());
                    if (radius === null) {
                        errors.push(
                            self.app
                                .translate('dialog.multimarkers.radius_message')
                                .replace('{1}', String(line_index))
                                .replace('{2}', tokens[token_index].trim()),
                        );
                        line_has_errors = true;
                    }
                    token_index += 1;
                }

                if (!line_has_errors) {
                    data.push({name, coordinates, color, radius});
                    marker_index += 1;
                }
            });

        if (errors.length > 0) {
            this.app.message_error(errors.join('\n'));
            return;
        }

        data.forEach((marker_data: MarkerDict): void => {
            const marker = self.app.map_state.add_marker(
                marker_data.coordinates,
            );
            marker.name = marker_data.name;
            marker.color = marker_data.color;
            marker.radius = marker_data.radius;
            self.app.map_state.update_marker_storage(marker);
        });

        this.app.map_state.update_observers(MapStateChange.MARKERS);
        this.hide();
    }

    private update_description(): void {
        const use_common_name =  (this.div.querySelector('[data-use-common-name]') as HTMLInputElement)
            .checked;
        const use_common_color = (this.div.querySelector(
            '[data-use-common-color]',
        ) as HTMLInputElement).checked;
        const use_common_radius = (this.div.querySelector(
            '[data-use-common-radius]',
        ) as HTMLInputElement).checked;

        const description = [
            '<' +
                this.app.translate('dialog.multimarkers.coordinates_token') +
                '>',
        ];
        if (!use_common_name) {
            description.push(
                '<' +
                    this.app.translate('dialog.multimarkers.name_token') +
                    '>',
            );
        }
        if (!use_common_color) {
            description.push(
                '<' +
                    this.app.translate('dialog.multimarkers.color_token') +
                    '>',
            );
        }
        if (!use_common_radius) {
            description.push(
                '<' +
                    this.app.translate('dialog.multimarkers.radius_token') +
                    '>',
            );
        }
        (this.div.querySelector('[data-format]') as HTMLTextAreaElement).innerText = description.join(
            ';',
        );
    }
}
