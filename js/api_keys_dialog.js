import $ from 'jquery';

export class ApiKeysDialog {
    constructor(app) {
        this.id = '#api-keys-dialog';
        this.app = app;

        const self = this;
        $(`${this.id} [data-cancel]`).click(() => {
            self.hide();
        });
        $(`${this.id} [data-ok]`).click(() => {
            self.ok();
        });
    }

    show() {
        $(this.id).addClass('is-active');
        $(`${this.id} [data-google-api-key]`).val(
            this.app.map_state.google_api_key,
        );
        $(`${this.id} [data-bing-api-key]`).val(this.app.map_state.bing_api_key);
    }

    hide() {
        $(this.id).removeClass('is-active');
    }

    ok() {
        this.app.map_state.set_api_keys(
            $(`${this.id} [data-google-api-key]`).val(),
            $(`${this.id} [data-bing-api-key]`).val(),
        );
        this.hide();
    }
}
