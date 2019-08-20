import Clipboard from 'clipboard';

export class LinkDialog {
    constructor (map_state) {
        this.map_state = map_state;

        const self = this;

        this.clipboard = new Clipboard('#btn-copy-link');
        this.clipboard.on('success', () => {
            alert("TODO: copied");
        });
        this.clipboard.on('error', () => {
            alert("TODO: copy failed");
        });

        $("#link-dialog [data-cancel]").click(() => {
            self.hide();
        });
    }

    show() {
        $("#link-dialog").addClass("is-active");
        const link = this.map_state.create_link();
        $("#input-link").val(link);
    }

    hide() {
        $("#link-dialog").removeClass("is-active");
    }
}

