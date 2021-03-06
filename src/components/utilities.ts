const parse_float = (str: string): number | null => {
    if (!/[0-9]/.test(str)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]*\.?[0-9]*$/.test(str)) {
        return null;
    }

    return parseFloat(str);
};

const parse_int = (str: string): number | null => {
    if (!/[0-9]/.test(str)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]+$/.test(str)) {
        return null;
    }

    return parseFloat(str);
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

const create_select_input = (label_text: string, data_tag: string): HTMLElement => {
    const field = create_element("div", ["field"]);
    const label = create_element("label", ["label"], {"data-i18n": label_text});
    label.textContent = label_text;
    field.append(label);
    const control = create_element("div", ["control"]);
    const div = create_element("div", ["select", "is-fullwidth"]);
    const select = create_element("select", [], {[data_tag]: null});
    div.append(select);
    control.append(div);
    field.append(control);

    return field;
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

export {
    parse_float,
    parse_int,
    create_element,
    create_button,
    create_dropdown,
    create_text_input,
    create_color_input,
    create_select_input,
    create_icon,
    encode_parameters,
    remove_element,
};
