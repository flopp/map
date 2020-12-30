export class ApiKeysDialog {
    constructor(app) {
        const self = this;

        this.div = document.querySelector('#api-keys-dialog');
        this.app = app;

        this.div.querySelectorAll('[data-cancel]').forEach((el) => {
            el.onclick = () => {
                self.hide();
            };
        });
        this.div.querySelectorAll('[data-ok]').forEach((el) => {
            el.onclick = () => {
                self.ok();
            };
        });
    }

    show() {
        this.div.classList.add('is-active');
        this.div.querySelector(
            '[data-google-api-key]',
        ).value = this.app.map_state.google_api_key;
    }

    hide() {
        this.div.classList.remove('is-active');
    }

    ok() {
        this.app.map_state.set_google_api_key(
            this.div.querySelector('[data-google-api-key]').value,
        );
        this.app.reset_maps();
        this.hide();
    }
}
