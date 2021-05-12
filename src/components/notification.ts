import {Notifications} from "./notifications";
import {create_element} from "./utilities";

export class Notification {
    private readonly parent: Notifications;
    private readonly id: number;
    private hiding: boolean;
    private readonly div: HTMLElement;

    public constructor(parent: Notifications, id: number, text: string, type: string) {
        this.parent = parent;
        this.id = id;
        this.hiding = false;
        this.div = create_element("div", ["notification", `is-${type}`]);
        this.div.innerHTML = text;
        this.div.addEventListener("click", (): void => {
            this.hide();
        });
        this.div.addEventListener("touchend", (): void => {
            this.hide();
        });
        setTimeout((): void => {
            this.hide();
        }, 5000);
    }

    public get_id(): number {
        return this.id;
    }

    public get_div(): HTMLElement {
        return this.div;
    }

    public hide(): void {
        if (this.hiding) {
            return;
        }
        this.hiding = true;
        this.div.classList.add("notification-fadeOut");
        this.div.addEventListener(
            "animationend",
            (): void => {
                this.parent.removeNotification(this);
            },
            false,
        );
    }
}
