import {Color} from './color.js';
import {Coordinates} from './coordinates.js';
import {MapStateChange} from './map_state.js';
import {parse_float} from './utilities.js';

export class MultiMarkersDialog {
    constructor(app) {
        const self = this;

        this.div = document.querySelector('#multi-markers-dialog');
        this.app = app;

        this.div.querySelector('[data-use-common-name]').onchange = () => {
            self.update_description();
        };
        this.div.querySelector('[data-use-common-color]').onchange = () => {
            self.update_description();
        };
        this.div.querySelector('[data-use-common-radius]').onchange = () => {
            self.update_description();
        };

        this.div.querySelectorAll('[data-cancel]').forEach((el) => {
            el.onclick = () => {
                self.hide();
            };
        });
        this.div.querySelectorAll('[data-go]').forEach((el) => {
            el.onclick = () => {
                self.go();
            };
        });
    }

    show() {
        this.div.classList.add('is-active');
        this.div.querySelector(
            '[data-common-color]',
        ).value = Color.random_from_palette().to_hash_string();
        this.update_description();
    }

    hide() {
        this.div.classList.remove('is-active');
    }

    go() {
        const self = this;

        const use_common_name = this.div.querySelector('[data-use-common-name]')
            .checked;
        const use_common_color = this.div.querySelector(
            '[data-use-common-color]',
        ).checked;
        const use_common_radius = this.div.querySelector(
            '[data-use-common-radius]',
        ).checked;
        const common_name = this.div.querySelector('[data-common-name]').value;
        const common_color = Color.from_string(
            this.div.querySelector('[data-common-color]').value,
        );
        const common_radius = parse_float(
            this.div.querySelector('[data-common-radius]').value,
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

        const errors = [];
        const data = [];
        let line_index = 0;
        let marker_index = 1;
        this.div
            .querySelector('[data-marker-data]')
            .value.split('\n')
            .forEach((line) => {
                line_index += 1;

                if (line.trim() == '') {
                    return;
                }

                let line_has_errors = false;
                const tokens = line.split(';');
                if (tokens.length != tokens_per_line) {
                    errors.push(
                        self.app
                            .translate('dialog.multimarkers.tokens_message')
                            .replace('{1}', line_index)
                            .replace('{2}', tokens_per_line),
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
                            .replace('{1}', line_index)
                            .replace('{2}', tokens[token_index].trim()),
                    );
                    line_has_errors = true;
                }
                token_index += 1;

                let name = `${common_name}${marker_index}`;
                if (!use_common_name) {
                    name = tokens[token_index].trim();
                    if (name == '') {
                        errors.push(
                            self.app
                                .translate('dialog.multimarkers.name_message')
                                .replace('{1}', line_index),
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
                                .replace('{1}', line_index)
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
                                .replace('{1}', line_index)
                                .replace('{2}', tokens[token_index].trim()),
                        );
                        line_has_errors = true;
                    }
                    token_index += 1;
                }

                if (!line_has_errors) {
                    data.push({
                        coordinates: coordinates,
                        name: name,
                        color: color,
                        radius: radius,
                    });
                    marker_index += 1;
                }
            });

        if (errors.length > 0) {
            this.app.message_error(errors.join('\n'));
            return;
        }

        data.forEach((marker_data) => {
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

    update_description() {
        const use_common_name = this.div.querySelector('[data-use-common-name]')
            .checked;
        const use_common_color = this.div.querySelector(
            '[data-use-common-color]',
        ).checked;
        const use_common_radius = this.div.querySelector(
            '[data-use-common-radius]',
        ).checked;

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
        this.div.querySelector('[data-format]').innerText = description.join(
            ';',
        );
    }
}
