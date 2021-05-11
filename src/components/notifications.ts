import {Notification} from "./notification";
import {create_element} from "./utilities";

export class Notifications {
    private next_id: number = 0;
    private notifications: Map<number, Notification>|null = null;
    private container: HTMLElement|null = null;
    private readonly max: number = 3;

    constructor() {
        // We need DOM to be ready
        if (
            document.readyState === "interactive" ||
            document.readyState === "complete"
        ) {
            this.init();
        } else {
            window.addEventListener("DOMContentLoaded", (): void => {
                this.init();
            });
        }
    }

    public init(): void {
        this.notifications = new Map<number, Notification>();
        this.container = create_element("div", [], {id: "notification-container"});
        document.body.appendChild(this.container);
    }

    public message(text: string, type: string): void {
        if (this.container === null) {
            return;
        }

        if (this.notifications!.size >= this.max) {
            let hide_count = 1 + this.notifications!.size - this.max;
            this.notifications!.forEach((value: Notification): void => {
                if (hide_count > 0) {
                    value.hide();
                }
                hide_count -= 1;
            });
        }

        const id = this.next_id;
        this.next_id += 1;

        const notification = new Notification(this, id, text, type);
        this.notifications!.set(id, notification);
        this.container.insertBefore(notification.get_div(), this.container.firstChild);
    }

    public removeNotification(notification: Notification): void {
        this.container!.removeChild(notification.get_div());
        this.notifications!.delete(notification.get_id());
    }
}
