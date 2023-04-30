import {App} from "./app";
import {Dialog} from "./dialog";

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
        `In den letzten Tagen musste ich flopp.net grundlegend umbauen - quasi eine Operation am lebenden Patienten.
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
        - added line length display directly to the map,
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
    new NewsArticle(
        "2022-01-03",
        `And... here's another larger update:

        - there's now a satellite base map with roads and labels (World Imagery layer  + OSM overlay),
        - new markers have shorter names (A, B, C, ...),
        - lines are included in the GPX export
        - the line list was simplified a lot (including inline editing of line endpoints),
        - the marker and line list automatically scroll to new objects,
        - notifications are placed on the left side to not overlap with the sidebar.

        Best regards,
        Florian aka. Flopp`,
        `Und... hier ist ein weiteres größeres Update:

        - es gibt jetzt eine Satelliten-Basiskarte mit Straßen und Markierungen (World Imagery Layer + OSM Overlay),
        - neue Marker haben kürzere Namen (A, B, C, ...),
        - Linien sind im GPX-Export enthalten
        - die Linienliste wurde stark vereinfacht (einschließlich der Inline-Bearbeitung von Linienendpunkten),
        - die Marker- und Linienliste scrollt automatisch zu neuen Objekten,
        - Benachrichtigungen werden auf der linken Seite platziert, damit sie sich nicht mit der Seitenleiste überschneiden.

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-01-05",
        `Update:

        - Searching for a place name will now produce a list of search results.
        - Dragging of markers on the map can be disabled to prevent unvoluntary modification of Marker positions (dragging is disabled by default).
        - A yes/no dialog is displayed before deleting all markers/lines.
        - There's now an <a href="https://blog.flopp.net" target="_blank">additional website with documentation and news (blog.flopp.net)</a>; there will be links to specific documentation pages (look for "?" buttons).
        - Marker updates have been optimized; the map should now behave more smoothly.

        Best regards,
        Florian aka. Flopp`,
        `Update:

        - Bei der Suche nach einem Ortsnamen wird nun eine Liste mit Suchergebnissen angezeigt.
        - Das Ziehen von Markern auf der Karte kann deaktiviert werden um eine ungewollte Änderung der Markerpositionen zu verhindern (das Ziehen ist standardmäßig deaktiviert).
        - Vor dem Löschen aller Marker/Linien wird ein Ja/Nein-Dialog angezeigt.
        - Es gibt jetzt eine <a href="https://blog.flopp.net" target="_blank">zusätzliche Website mit Dokumentation und Neuigkeiten (blog.flopp.net)</a>; es wird Links zu spezifischen Dokumentationsseiten geben ("?"-Knöpfe).
        - Die Aktualisierung von Markern wurde optimiert; die Karte sollte sich nun flüssiger verhalten.

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-01-12",
        `A small Update:

        - Fix JSON and GPX import.
        - Increase maximum zoom levels.
        - Make "edit" the first action button.
        - Make "Degrees+Minutes" the default coordinates format.
        - Display warning message in the link dialog if link gets to long."

        Best regards,
        Florian aka. Flopp`,
        `Ein kleines Update:

        - JSON und GPX Import korrigiert.
        - Maximale Zoomstufen erhöht.
        - "Bearbeiten" ist jetzt der erste Marker-Action-Knopf.
        - "Degrees+Minutes" ist jetzt das Standard-Koordinatenformat.
        - Im Link-Dialog wird eine Warning angezeigt, wenn der Link zu lang ist.

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-01-25",
        `A very small Update:

        - Fix GPX export of a map with lines.

        Best regards,
        Florian aka. Flopp`,
        `Ein sehr kleines Update:

        - GPX Export von Karten mit Linien korrigiert.

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-02-03",
        `Another small update:

        - Fix marker creation after location search; thanks to Alex for reporting this issue!)

        Best regards,
        Florian aka. Flopp`,
        `Ein weiteres kleines Update:

        - Markererzeugung direkt nach einer Suche funktioniert jetzt wieder korrekt - vielen Dank an Alex für den Fehlerreport!

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-02-18",
        `- Fix a typo (thanks to Grillzombie)
        - Add documentation for the <a href="https://blog.flopp.net/the-markers-sidebar/" target="_blank">Markers sidebar</a>

        Best regards,
        Florian aka. Flopp`,
        `- Schreibfehler korrigiert (Danke Grillzombie)
        - Dokumentation für die <a href="https://blog.flopp.net/the-markers-sidebar/" target="_blank">Marker-Seitenleiste</a>

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-02-23",
        `- Sorting of the markers list by name and distance to the map's center (thanks to David and Dirk for the suggestion)
      
        Best regards,
        Florian aka. Flopp`,
        `- Sortieren der Marker-Liste nach Name oder Distanz zum Kartenzentrum (Danke David und Dirk für den Vorschlag)
      
        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-02-26",
        `- Add a button to the markers sidebar that allows for opening the "Create Multiple Markers" dialog (thanks to Gerti for the suggestion)
        - Changing of the sidebar buttons order (thanks Gerti) 
        - Focusing of the "yes" button in confirmation dialogs (thanks Michael)

        There's also a <a href="https://blog.flopp.net/update-sorting-usability/" target="_blank">news article</a> for all the changes.

        Best regards,
        Florian aka. Flopp`,
        `- Neuer Button in der Marker-Seitenleiste um den "Mehrere Marker Erzeugen"-Dialog aufzurufen (Danke Gerti für den Vorschlag)
        - Reihenfolge der Seitenleisten-Buttons geändert (Danke Gerti) 
        - Fokussieren des "Ja"-Buttons in Bestätigungsdialogen (Danke Michael)

        Es gibt auch einen <a href="https://blog.flopp.net/update-sorting-usability/" target="_blank">News-Beitrag im Blog</a> dazu.

        Beste Grüße,
        Florian aka. Flopp`,
    ),
    new NewsArticle(
        "2023-04-30",
        `Add an option (via the Marker Settings dialog) to have filled or unfilled circles.`,
        `Neue Option (in den Markereinstellungen) um Markerkreise gefüllt oder ungefüllt darzustellen.`, 
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
        super.focusCancel();
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
