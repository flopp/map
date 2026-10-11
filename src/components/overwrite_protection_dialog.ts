import {App} from "./app";

export class OverwriteProtectionDialog {
    private readonly _app: App;
    private readonly _modal: HTMLDivElement;
    private readonly _keepButton: HTMLButtonElement;
    private _onClose: ((overwrite: boolean) => void) | null = null;

    public constructor(app: App) {
        this._app = app;

        this._modal = document.createElement("div");
        this._modal.className = "modal";
        this._modal.setAttribute("role", "dialog");
        this._modal.setAttribute("aria-modal", "true");
        this._modal.setAttribute("aria-labelledby", "overwrite-protection-title");

        const background = document.createElement("div");
        background.className = "modal-background";
        background.addEventListener("click", (): void => this.close(false));
        this._modal.append(background);

        const card = document.createElement("div");
        card.className = "modal-card";

        const header = document.createElement("header");
        header.className = "modal-card-head";

        const title = document.createElement("h2");
        title.id = "overwrite-protection-title";
        title.className = "modal-card-title";
        title.dataset.i18n = "dialog.overwrite-protection.title";
        header.append(title);

        const closeButton = document.createElement("button");
        closeButton.className = "delete";
        closeButton.type = "button";
        closeButton.setAttribute("aria-labelledby", "overwrite-protection-close-label");
        closeButton.addEventListener("click", (): void => this.close(false));
        const closeLabel = document.createElement("span");
        closeLabel.id = "overwrite-protection-close-label";
        closeLabel.className = "is-sr-only";
        closeLabel.dataset.i18n = "dialog.overwrite-protection.keep";
        closeButton.append(closeLabel);
        header.append(closeButton);
        card.append(header);

        const body = document.createElement("section");
        body.className = "modal-card-body";
        const message = document.createElement("p");
        message.dataset.i18n = "dialog.overwrite-protection.message";
        body.append(message);

        const statistics = document.createElement("div");
        statistics.className = "content";
        statistics.append(
            this.create_statistics_row(
                "dialog.overwrite-protection.current-map",
                "overwrite-protection-current",
            ),
            this.create_statistics_row(
                "dialog.overwrite-protection.linked-map",
                "overwrite-protection-linked",
            ),
        );
        body.append(statistics);
        card.append(body);

        const footer = document.createElement("footer");
        footer.className = "modal-card-foot";

        const overwriteButton = document.createElement("button");
        overwriteButton.className = "button is-danger";
        overwriteButton.type = "button";
        overwriteButton.dataset.i18n = "dialog.overwrite-protection.overwrite";
        overwriteButton.addEventListener("click", (): void => this.close(true));
        footer.append(overwriteButton);

        this._keepButton = document.createElement("button");
        this._keepButton.className = "button";
        this._keepButton.type = "button";
        this._keepButton.dataset.i18n = "dialog.overwrite-protection.keep";
        this._keepButton.addEventListener("click", (): void => this.close(false));
        footer.append(this._keepButton);
        card.append(footer);

        this._modal.append(card);
        document.body.append(this._modal);
        this._app.localize(this._modal);
    }

    public show(
        currentMarkers: number,
        currentLines: number,
        linkedMarkers: number,
        linkedLines: number,
        onClose: (overwrite: boolean) => void,
    ): void {
        this.set_statistics("overwrite-protection-current", currentMarkers, currentLines);
        this.set_statistics("overwrite-protection-linked", linkedMarkers, linkedLines);
        this._onClose = onClose;
        this._modal.classList.add("is-active");
        document.addEventListener("keydown", this.onKeyDown);
        this._keepButton.focus();
    }

    private create_statistics_row(labelKey: string, dataName: string): HTMLParagraphElement {
        const row = document.createElement("p");
        const label = document.createElement("strong");
        label.dataset.i18n = labelKey;
        row.append(label, document.createTextNode(": "));

        const markerCount = document.createElement("span");
        markerCount.dataset.statistic = `${dataName}-markers`;
        row.append(markerCount, document.createTextNode(" "));
        const markersLabel = document.createElement("span");
        markersLabel.dataset.i18n = "dialog.overwrite-protection.markers";
        row.append(markersLabel, document.createTextNode(", "));

        const lineCount = document.createElement("span");
        lineCount.dataset.statistic = `${dataName}-lines`;
        row.append(lineCount, document.createTextNode(" "));
        const linesLabel = document.createElement("span");
        linesLabel.dataset.i18n = "dialog.overwrite-protection.lines";
        row.append(linesLabel);

        return row;
    }

    private set_statistics(dataName: string, markers: number, lines: number): void {
        this._modal.querySelector(`[data-statistic="${dataName}-markers"]`)!.textContent =
            `${markers}`;
        this._modal.querySelector(`[data-statistic="${dataName}-lines"]`)!.textContent = `${lines}`;
    }

    private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            this.close(false);
        }
    };

    private close(overwrite: boolean): void {
        if (this._onClose === null) {
            return;
        }

        this._modal.classList.remove("is-active");
        document.removeEventListener("keydown", this.onKeyDown);
        const onClose = this._onClose;
        this._onClose = null;
        onClose(overwrite);
    }
}
