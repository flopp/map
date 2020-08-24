import $ from 'jquery';

import {Color} from './color.js';
import {Coordinates} from './coordinates.js';
import {MapStateChange} from './map_state.js';
import {parse_float} from './utilities.js';

export class MultiMarkersDialog {
    constructor(app) {
        this.app = app;

        const self = this;

        $('#multi-markers-dialog [data-use-common-name]').change(() => {
            self.update_description();
        });
        $('#multi-markers-dialog [data-use-common-color]').change(() => {
            self.update_description();
        });
        $('#multi-markers-dialog [data-use-common-radius]').change(() => {
            self.update_description();
        });
        $('#multi-markers-dialog [data-cancel]').click(() => {
            self.hide();
        });
        $('#multi-markers-dialog [data-go]').click(() => {
            self.go();
        });
    }

    show() {
        $('#multi-markers-dialog').addClass('is-active');
        $('#multi-markers-dialog [data-common-color]').val(
            Color.random_from_palette().to_hash_string(),
        );
        this.update_description();
    }

    hide() {
        $('#multi-markers-dialog').removeClass('is-active');
    }

    go() {
        const self = this;

        const use_common_name = $(
            '#multi-markers-dialog [data-use-common-name]',
        ).is(':checked');
        const use_common_color = $(
            '#multi-markers-dialog [data-use-common-color]',
        ).is(':checked');
        const use_common_radius = $(
            '#multi-markers-dialog [data-use-common-radius]',
        ).is(':checked');
        const common_name = $('#multi-markers-dialog [data-common-name]').val();
        const common_color = Color.from_string(
            $('#multi-markers-dialog [data-common-color]').val(),
        );
        const common_radius = parse_float(
            $('#multi-markers-dialog [data-common-radius]').val(),
        );

        if (use_common_color && common_color === null) {
            this.app.message_error('Bad common color');
            return;
        }
        if (use_common_radius && common_radius === null) {
            this.app.message_error('Bad common radius');
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
        $('#multi-markers-dialog [data-marker-data]')
            .val()
            .split('\n')
            .forEach((line) => {
                line_index += 1;

                if (line.trim() == '') {
                    return;
                }

                let line_has_errors = false;
                const tokens = line.split(';');
                if (tokens.length != tokens_per_line) {
                    errors.push(
                        `Line ${line_index}: ${tokens_per_line} semicolon-separated tokens expected`,
                    );
                    line_has_errors = true;
                }
                let token_index = 0;

                const coordinates = Coordinates.from_string(
                    tokens[token_index].trim(),
                );

                if (coordinates === null) {
                    errors.push(
                        `Line ${line_index}: unable to parse coordinates: ${tokens[
                            token_index
                        ].trim()}`,
                    );
                    line_has_errors = true;
                }
                token_index += 1;

                let name = `${common_name}${marker_index}`;
                if (!use_common_name) {
                    name = tokens[token_index].trim();
                    if (name == '') {
                        errors.push(`Line ${line_index}: empty name`);
                        line_has_errors = true;
                    }
                    token_index += 1;
                }

                let color = common_color;
                if (!use_common_color) {
                    color = Color.from_string(tokens[token_index].trim());
                    if (color === null) {
                        errors.push(
                            `Line ${line_index}: unable to parse color: ${tokens[
                                token_index
                            ].trim()}`,
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
                            `Line ${line_index}: unable to parse radius: ${tokens[
                                token_index
                            ].trim()}`,
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
        const use_common_name = $(
            '#multi-markers-dialog [data-use-common-name]',
        ).is(':checked');
        const use_common_color = $(
            '#multi-markers-dialog [data-use-common-color]',
        ).is(':checked');
        const use_common_radius = $(
            '#multi-markers-dialog [data-use-common-radius]',
        ).is(':checked');

        let description = '<COORDINATES>';
        if (!use_common_name) {
            description += ';<NAME>';
        }
        if (!use_common_color) {
            description += ';<COLOR>';
        }
        if (!use_common_radius) {
            description += ';<RADIUS>';
        }
        $('#multi-markers-dialog [data-format]').text(description);
    }
}
