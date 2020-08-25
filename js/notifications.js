class Notification {
    constructor(parent, id, text, type) {
        const self = this;
        this.parent = parent;
        this.id = id;
        this.hiding = false;
        this.div = document.createElement('div');
        this.div.className = `notification is-${type}`;
        this.div.innerHTML = text;
        this.div.addEventListener('click', () => {
            self.hide();
        });
        this.div.addEventListener('touchend', () => {
            self.hide();
        });
        setTimeout(() => {
            self.hide();
        }, 5000);
    }

    hide() {
        const self = this;
        if (this.hiding) {
            return;
        }
        this.hiding = true;
        this.div.className += ' notification-fadeOut';
        this.div.addEventListener(
            'animationend',
            () => {
                self.parent.removeNotification(self);
            },
            false,
        );
    }
}

export class Notifications {
    constructor() {
        const self = this;

        this.next_id = 0;
        this.notifications = new Map();
        this.container = null;
        this.max = 3;

        // We need DOM to be ready
        if (
            document.readyState === 'interactive' ||
            document.readyState === 'complete'
        ) {
            this.init();
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                self.init();
            });
        }
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        document.body.appendChild(this.container);
    }

    message(text, type) {
        if (!this.container) {
            return;
        }

        if (this.notifications.size >= this.max) {
            var hide_count = 1 + this.notifications.size - this.max;
            this.notifications.forEach((value) => {
                if (hide_count > 0) {
                    value.hide();
                }
                hide_count -= 1;
            });
        }

        const id = this.next_id;
        this.next_id += 1;

        const notification = new Notification(this, id, text, type);
        this.notifications.set(id, notification);
        this.container.insertBefore(notification.div, this.container.firstChild);
    }

    removeNotification(notification) {
        this.container.removeChild(notification.div);
        this.notifications.delete(notification.id);
    }
}
