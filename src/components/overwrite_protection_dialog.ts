import {App} from "./app";
import {create_element} from "./utilities";

export class OverwriteProtectionDialog {
    private readonly _app: App;
    private readonly _modal: HTMLDivElement;
    private readonly _keepButton: HTMLButtonElement;
    private _onClose: ((overwrite: boolean) => void) | null = null;

    public constructor(app: App) {
        this._app = app;

        this._modal = create_element("div", ["modal"], {
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "overwrite-protection-title",
        }) as HTMLDivElement;

        const background = create_element("div", ["modal-background"]);
        background.addEventListener("click", (): void => this.close(false));
        this._modal.append(background);

        const card = create_element("div", ["modal-card"]);

        const header = create_element("header", ["modal-card-head"]);

        const title = create_element("h2", ["modal-card-title"], {
            id: "overwrite-protection-title",
            "data-i18n": "dialog.overwrite-protection.title",
        });
        header.append(title);

        const closeButton = create_element("button", ["delete"], {
            type: "button",
            "aria-labelledby": "overwrite-protection-close-label",
        }) as HTMLButtonElement;
        closeButton.addEventListener("click", (): void => this.close(false));
        const closeLabel = create_element("span", ["is-sr-only"], {
            id: "overwrite-protection-close-label",
            "data-i18n": "dialog.overwrite-protection.keep",
        });
        closeButton.append(closeLabel);
        header.append(closeButton);
        card.append(header);

        const body = create_element("section", ["modal-card-body"]);
        const message = create_element("p", [], {
            "data-i18n": "dialog.overwrite-protection.message",
        });
        body.append(message);

        const statistics = create_element("div", ["content"]);
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

        const footer = create_element("footer", ["modal-card-foot"]);

        const overwriteButton = create_element("button", ["button", "is-danger"], {
            type: "button",
            "data-i18n": "dialog.overwrite-protection.overwrite",
        }) as HTMLButtonElement;
        overwriteButton.addEventListener("click", (): void => this.close(true));
        footer.append(overwriteButton);

        this._keepButton = create_element("button", ["button"], {
            type: "button",
            "data-i18n": "dialog.overwrite-protection.keep",
        }) as HTMLButtonElement;
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
        const row = create_element("p") as HTMLParagraphElement;
        const label = create_element("strong", [], {
            "data-i18n": labelKey,
        });
        row.append(label, document.createTextNode(": "));

        const markerCount = create_element("span", [], {
            "data-statistic": `${dataName}-markers`,
        });
        row.append(markerCount, document.createTextNode(" "));
        const markersLabel = create_element("span", [], {
            "data-i18n": "dialog.overwrite-protection.markers",
        });
        row.append(markersLabel, document.createTextNode(", "));

        const lineCount = create_element("span", [], {
            "data-statistic": `${dataName}-lines`,
        });
        row.append(lineCount, document.createTextNode(" "));
        const linesLabel = create_element("span", [], {
            "data-i18n": "dialog.overwrite-protection.lines",
        });
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
