import {App} from "./app";
import {Dialog} from "./dialog";
import {Storage} from "./storage";

class NewsArticle {
    public date: string;
    public text_en: string;
    public text_de: string;

    public constructor(date: string, text_en: string, text_de: string) {
        this.date = date;
        this.text_en = text_en;
        this.text_de = text_de;
    }

    public getText(language: string): string {
        if (language.toLowerCase().startsWith("en")) {
            if (this.text_en.length > 0) {
                return this.text_en;
            }

            return this.text_de;
        }

        if (language.toLowerCase().startsWith("de")) {
            if (this.text_de.length > 0) {
                return this.text_de;
            }

            return this.text_en;
        }

        if (this.text_en.length > 0) {
            return this.text_en;
        }

        return this.text_de;
    }
}

const news_articles: NewsArticle[] = [
    new NewsArticle("2022-12-27", "Hello World!", "Hallo Welt!"),
    new NewsArticle(
        "2022-12-28",
        `In the last few days I had to fundamentally rebuild flopp.net.
        The reason for this is mainly licensing complications with Google Maps, which is why Google Maps has been removed completely and the map is now 100% based on freely available content.
        The conversion is not yet complete and functionalities are still missing (e.g. GPX import/export), which will be added soon.
        I have already received a lot of constructive feedback that I will incorporate into the further development - thank you for that!

        Best regards,
        Florian aka. Flopp`,
        `In den letzten Tagen musste ich flopp.net grundlegend umbauen - quasi eine Operation am lebenden Partienten.
        Grund dafür sind hauptsächlich Lizenz-Komplikationen mit Google Maps, weswegen Google Maps komplett entfernt wurde und die Karte nun 100% auf frei verfügbaren Inhalten basiert.
        Der Umbau ist noch nicht komplett vollzogen und es fehlen noch Funktionalitäten (z.B. GPX Import/Export), die bald nachgereicht werden.
        Ich habe auch schon viel konstruktives Feedback erhalten, das ich in die Weiterentwicklung einfließen lassen werde - vielen Dank dafür!

        Beste Grüße,
        Florian aka. Flopp`),
    new NewsArticle(
        "2022-01-01",
        `The rebuild of <b>flopp.net</b> continues. Due to your feedback, I've
        - fixed the map state import function (JSON),
        - add GPX export and import,
        - added line length display directl to the map,
        - added french translation,
        - added support for numbers with a decimal comma instead of decimal point,
        - added the possibility to create markers from the "search" sidebar,
        - reintroduced action buttons instead of menus for markers and lines.

        I hope you had a good start into the new year!
        <i>Florian aka. Flopp</i>`,
        `Der Umbau von <b>flopp.net</b> geht weiter. Aufgrund eurer Rückmeldungen habe ich
        - die Importfunktion (JSON) korrigiert,
        - GPX-Export und -Import hinzugefügt,
        - eine Linien-Längen-Anzeige direkt in der Karte hinzugefügt,
        - die Web-App ins Französische übersetzt,
        - Unterstützung für Dezimalzahlen mit Komma statt Punkt als Dezimal-Separator hinzugefügt,
        - die Möglichkeit, Marker direkt auf der "Suche"-Seitenleiste zu erzeugen, hinzugefügt,
        - Action-Buttons statt Menüs für Marker und Linien wieder eingeführt.

        Ich hoffe ihr, hattet alle einen guten Start ins neue Jahr!
        <i>Florian aka. Flopp</i>`,
    ),
];

export class NewsDialog extends Dialog {
    public shown: number;

    public constructor(app: App) {
        super("news-dialog", app);
        this.shown = -1;

        const older = (document.querySelector("#news-dialog-older") as HTMLButtonElement);
        const newer = (document.querySelector("#news-dialog-newer") as HTMLButtonElement);
        older.addEventListener("click", () => {
            this.older();
        });
        newer.addEventListener("click", () => {
            this.newer();
        });
    }

    public show(): void {
        this.shown = news_articles.length - 1;
        this._app.map_state.storage.set_int("news.shown", this.shown);

        this.updateContent();

        super.show();
    }

    public maybeShow(): void {
        const shown = this._app.map_state.storage.get_int("news.shown", -1);

        if (shown < news_articles.length-1) {
            this.show();
        }
    }

    public older(): void {
        this.shown -= 1;
        if (this.shown < 0) {
            this.shown = 0;
        }

        this.updateContent();
    }

    public newer(): void {
        this.shown += 1;
        if (this.shown >= news_articles.length) {
            this.shown = news_articles.length-1;
        }

        this.updateContent();
    }

    public updateContent(): void {
        const textEl = (document.querySelector("#news-dialog-text") as HTMLParagraphElement);
        const dateEl = (document.querySelector("#news-dialog-date") as HTMLParagraphElement);

        if (this.shown < 0 || this.shown >= news_articles.length) {
            textEl.textContent = "n/a";
            dateEl.textContent = "n/a";
        } else {
            const article = news_articles[this.shown];
            dateEl.textContent =  article.date;
            textEl.innerHTML = article.getText(this._app.map_state.language).split("\n").join("<br />");
        }

        const older = (document.querySelector("#news-dialog-older") as HTMLButtonElement);
        const newer = (document.querySelector("#news-dialog-newer") as HTMLButtonElement);
        older.disabled = this.shown <= 0;
        newer.disabled = this.shown >= news_articles.length-1;
    }
}
