import {create_element} from "./utilities";
import {Notifications} from "./notifications";

export class Notification {
    private parent: Notifications;
    private id: number;
    private hiding: boolean;
    private div: HTMLElement;

    constructor(parent: Notifications, id: number, text: string, type: string) {
        const self = this;
        this.parent = parent;
        this.id = id;
        this.hiding = false;
        this.div = create_element('div', ["notification", `is-${type}`]);
        this.div.innerHTML = text;
        this.div.addEventListener('click', (): void => {
            self.hide();
        });
        this.div.addEventListener('touchend', (): void => {
            self.hide();
        });
        setTimeout((): void => {
            self.hide();
        }, 5000);
    }

    public get_id(): number {
        return this.id;
    }

    public get_div(): HTMLElement {
        return this.div;
    }

    public hide(): void {
        const self = this;
        if (this.hiding) {
            return;
        }
        this.hiding = true;
        this.div.classList.add("notification-fadeOut");
        this.div.addEventListener(
            'animationend',
            (): void => {
                self.parent.removeNotification(self);
            },
            false,
        );
    }
}
