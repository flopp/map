const is_string = (s: any): boolean => Object.prototype.toString.call(s) === "[object String]";

const is_number = (s: any): boolean => Object.prototype.toString.call(s) === "[object Number]";

const parse_float = (str: string|number): number | null => {
    if (is_number(str)) {
        return str as number;
    }

    const s = is_string(str) ? (str as string) : `${str}`;

    if (!/[0-9]/.test(s)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]*(\.|,)?[0-9]*$/.test(s)) {
        return null;
    }

    return parseFloat(s.replace(",", "."));
};

const parse_int = (str: string|number): number | null => {
    if (is_number(str)) {
        const n = str as number;
        if (Number.isInteger(n)) {
            return n;
        }

        return null;
    }

    const s = is_string(str) ? (str as string) : `${str}`;

    if (!/[0-9]/.test(s)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]+$/.test(s)) {
        return null;
    }

    return parseFloat(s);
};

const create_element = (
    type: string,
    classes: string[] = [],
    attributes: Record<string, string | null> = {},
): HTMLElement => {
    const element = document.createElement(type);
    classes.forEach((cls: string): void => {
        element.classList.add(cls);
    });
    for (const key of Object.keys(attributes)) {
        const value = attributes[key];
        element.setAttribute(key, value !== null ? value : "");
    }

    return element;
};

const remove_element = (node: HTMLElement | null): void => {
    if (node === null) {
        return;
    }
    if (node.parentNode === null) {
        return;
    }
    node.parentNode.removeChild(node);
};

const create_text_input = (
    label_text: string,
    data_tag: string,
    placeholder: string,
): HTMLElement => {
    const field = create_element("div", ["field"]);
    const label = create_element("label", ["label"], {"data-i18n": label_text});
    label.textContent = label_text;
    field.append(label);
    const control = create_element("div", ["control"]);
    const input = create_element("input", ["input", "is-fullwidth"], {
        type: "text",
        [data_tag]: null,
        placeholder,
        "data-i18n": placeholder,
        "data-i18n-target": "placeholder",
    });
    control.append(input);
    field.append(control);

    return field;
};

const create_color_input = (
    label_text: string,
    data_tag: string,
    placeholder: string,
): HTMLElement => {
    const field = create_element("div", ["field"]);
    const label = create_element("label", ["label"], {"data-i18n": label_text});
    label.textContent = label_text;
    field.append(label);
    const control = create_element("div", ["control"]);
    const input = create_element("input", ["input", "is-fullwidth"], {
        type: "color",
        [data_tag]: null,
        placeholder,
        "data-i18n": placeholder,
        "data-i18n-target": "placeholder",
    });
    control.append(input);
    field.append(control);

    return field;
};

const create_select_input = (data_tag: string): {div: HTMLDivElement; select: HTMLSelectElement} => {
    const control = create_element("div", ["control"]);
    const div = create_element("div", ["select", "is-fullwidth"]) as HTMLDivElement;
    const select = create_element("select", [], {[data_tag]: null}) as HTMLSelectElement;
    div.append(select);
    control.append(div);

    return {div, select};
};

const create_button = (label_text: string, callback: () => void): HTMLElement => {
    const control = create_element("div", ["control"]);
    const button = create_element("button", ["button"]);
    button.textContent = label_text;
    button.addEventListener("click", callback);
    control.append(button);

    return control;
};

const create_icon = (icon: string, classes: string[] = []): SVGSVGElement => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    classes.forEach((c: string): void => {
        svg.classList.add(c);
    });
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        `assets/feather-sprite.svg#${icon}`,
    );
    svg.append(use);

    return svg;
};

const create_icon_button = (icon: string, tooltip_i18n: string, button_classes: string[], icon_classes: string[], callback: (event: Event) => void): HTMLElement => {
    button_classes.unshift("button");
    const button = create_element("button", button_classes, {"data-i18n": tooltip_i18n, "data-i18n-target": "title", title: tooltip_i18n});
    icon_classes.unshift("icon");
    button.append(create_icon(icon, icon_classes));
    button.addEventListener("click", callback);

    return button;
};

interface ILabelCallback {
    label: string;
    callback(): void;
}
const create_dropdown = (items: ILabelCallback[]): HTMLElement => {
    const dropdown = create_element("div", ["dropdown", "is-right"]);
    dropdown.addEventListener("click", (event: MouseEvent): void => {
        event.stopPropagation();
        dropdown.classList.toggle("is-active");
    });

    const trigger = create_element("div", ["dropdown-trigger"]);
    dropdown.append(trigger);

    const dropdown_button = create_element("button", ["button", "is-white"]);
    const svg = create_icon("more-vertical", ["icon", "icon16"]);
    dropdown_button.append(svg);
    trigger.append(dropdown_button);

    const menu = create_element("div", ["dropdown-menu"]);
    dropdown.append(menu);

    const menu_content = create_element("div", ["dropdown-content", "has-background-info-light"]);
    menu.append(menu_content);

    items.forEach((item: ILabelCallback): void => {
        const dropdown_item = create_element("a", ["dropdown-item"], {
            href: "#",
        });
        dropdown_item.textContent = item.label;
        dropdown_item.addEventListener("click", (): void => {
            item.callback();
        });
        menu_content.append(dropdown_item);
    });

    return dropdown;
};

const encode_parameters = (parameters: Record<string, string | number | boolean>): string =>
    Object.keys(parameters)
        .reduce((a: string[], k: string): string[] => {
            a.push(`${k}=${encodeURIComponent(parameters[k])}`);

            return a;
        }, [])
        .join("&");

const xml_escape = (s: string): string => {
    const escapes: Map<string, string> = new Map();
    escapes.set(">", "&gt;");
    escapes.set("<", "&lt;");
    escapes.set("'", "&apos;");
    escapes.set("\"", "&quot;");
    escapes.set("&", "&amp;");
    const re = new RegExp("([&\"<>'])", "g");

    return s.replace(re, (_: string, group: string): string => escapes.get(group)!);
};

export {
    parse_float,
    parse_int,
    create_element,
    create_button,
    create_icon_button,
    create_dropdown,
    create_text_input,
    create_color_input,
    create_select_input,
    create_icon,
    encode_parameters,
    is_number,
    is_string,
    remove_element,
    xml_escape,
};
