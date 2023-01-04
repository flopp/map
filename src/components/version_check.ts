import {App} from "./app";
import {MapStateObserver} from "./map_state_observer";
import {Version} from "./version";

export class VersionCheck extends MapStateObserver {
    private readonly interval_s = 60 * 60 * 6; // 6 hours
    private last_check_s = Date.now() / 1000;
    private readonly build_date = new Date(Version.build_date * 1000);

    public constructor(app: App) {
        super(app);

        console.log("This build date", this.build_date);
        this.check();
    }

    private check(): void {
        this.last_check_s = Date.now() / 1000;

        fetch("version.json", {
            referrer: this.app.map_state.create_link(),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`status=${response.status}`);
                }

                return response.json();
            })
            .then((json) => {
                if (!json.hasOwnProperty("build_date")) {
                    throw new Error(`Key "build_date" is missing: ${json}`);
                }

                const build_date_s = json.build_date;
                const build_date = new Date(build_date_s * 1000);
                console.log("Latest build date", build_date);
                if (build_date_s > Version.build_date + this.interval_s) {
                    console.log(`App is outdated, you might want to reload the page. current=${this.build_date.toString()} available=${build_date.toString()}`);
                }
            })
            .catch((error) => {
                console.error(
                    "Failed to fetch version.json:", error);
            });
    }

    public update_state(_changes: number, _marker_id: number = -1): void {
        const now_s = Date.now() / 1000;
        if (now_s < this.last_check_s + this.interval_s) {
            return;
        }

        this.check();
    }
}
