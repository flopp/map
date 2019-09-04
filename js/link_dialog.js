import Clipboard from 'clipboard';

export class LinkDialog {
    constructor (app) {
        this.app = app;
        const self = this;

        this.clipboard = new Clipboard('#btn-copy-link');
        this.clipboard.on('success', () => {
            self.app.message("The link has been copied to the clipboard.");
        });
        this.clipboard.on('error', () => {
            self.app.message_error("Copying of the link failed.");
        });

        $("#link-dialog [data-cancel]").click(() => {
            self.hide();
        });
    }

    show() {
        $("#link-dialog").addClass("is-active");
        const link = this.app.map_state.create_link();
        $("#input-link").val(link);
    }

    hide() {
        $("#link-dialog").removeClass("is-active");
    }
}

