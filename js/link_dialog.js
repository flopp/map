import Clipboard from 'clipboard';

export class LinkDialog {
    constructor(app) {
        const self = this;

        this.div = document.querySelector('#link-dialog');
        this.app = app;

        this.clipboard = new Clipboard('#link-dialog-copy-button');
        this.clipboard.on('success', () => {
            self.app.message(self.app.translate('dialog.link.copied_message'));
        });
        this.clipboard.on('error', () => {
            self.app.message_error(
                self.app.translate('dialog.link.failed_message'),
            );
        });

        this.div.querySelectorAll('[data-cancel]').forEach((el) => {
            el.onclick = () => {
                self.hide();
            };
        });
    }

    show() {
        this.div.classList.add('is-active');
        const link = this.app.map_state.create_link();
        document.querySelector('#link-dialog-input').value = link;
    }

    hide() {
        this.div.classList.remove('is-active');
    }
}
