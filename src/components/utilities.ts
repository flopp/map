function parse_float(str: string): number {
    if (!/[0-9]/.test(str)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]*\.?[0-9]*$/.test(str)) {
        return null;
    }
    return parseFloat(str);
}

function parse_int (str: string): number {
    if (!/[0-9]/.test(str)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]+$/.test(str)) {
        return null;
    }
    return parseFloat(str);
}

function create_element (type: string, classes: string[] = [], attributes: Record<string, string> = {}): HTMLElement {
    const element = document.createElement(type);
    classes.forEach((cls: string): void => {
        element.classList.add(cls);
    });
    for (const key of Object.keys(attributes)) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

function remove_element (node: HTMLElement): void {
    if (node === null) {
        return;
    }
    node.parentNode.removeChild(node);
};

function create_text_input(label_text: string, data_tag: string, placeholder: string): HTMLElement {
    const field = create_element('div', ["field"]);
    const label = create_element('label', ["label"], {"data-i18n": label_text});
    label.textContent = label_text;
    field.appendChild(label);
    const control = create_element('div', ["control"]);
    const input = create_element('input', ["input", "is-fullwidth"], {
        "type": "text",
        [data_tag]: null,
        "placeholder": placeholder,
        "data-i18n": placeholder,
        "data-i18n-target": "placeholder"
    });
    control.appendChild(input);
    field.appendChild(control);
    return field;
};

function create_color_input(label_text: string, data_tag: string, placeholder: string): HTMLElement {
    const field = create_element('div', ["field"]);
    const label = create_element('label', ["label"], {"data-i18n": label_text});
    label.textContent = label_text;
    field.appendChild(label);
    const control = create_element('div', ["control"]);
    const input = create_element('input', ["input", "is-fullwidth"], {
        "type": "color",
        [data_tag]: null,
        "placeholder": placeholder,
        "data-i18n": placeholder,
        "data-i18n-target": "placeholder"
    });
    control.appendChild(input);
    field.appendChild(control);
    return field;
};

function create_select_input(label_text: string, data_tag: string): HTMLElement {
    const field = create_element('div', ["field"]);
    const label = create_element('label', ["label"], {"data-i18n": label_text});
    label.textContent = label_text;
    field.appendChild(label);
    const control = create_element('div', ["control"]);
    const div = create_element('div', ["select", "is-fullwidth"]);
    const select = create_element('select', [], {[data_tag]: null});
    div.appendChild(select);
    control.appendChild(div);
    field.appendChild(control);
    return field;
};

function create_button(label_text: string, callback: () => void): HTMLElement {
    const control = create_element('div', ["control"]);
    const button = create_element('button', ["button"]);
    button.textContent = label_text;
    button.addEventListener('click', callback);
    control.appendChild(button);
    return control;
};

function create_icon(icon: string, classes: string[] = []): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    classes.forEach((c: string): void => {
        svg.classList.add(c);
    });
    const use = document.createElementNS("http://www.w3.org/2000/svg", 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `assets/feather-sprite.svg#${icon}`);
    svg.appendChild(use);
    return svg;
};

interface LabelCallback {
    label: string,
    callback: () => void
};
function create_dropdown(items: LabelCallback[]): HTMLElement {
    const dropdown = create_element("div", ["dropdown", "is-right"]);
    dropdown.addEventListener('click', (event: MouseEvent): void => {
        event.stopPropagation();
        dropdown.classList.toggle('is-active');
    });

    const trigger = create_element('div', ["dropdown-trigger"]);
    dropdown.appendChild(trigger);

    const dropdown_button = create_element('button', ["button", "is-white"]);
    dropdown_button.innerHTML = '<svg class="icon icon16"><use xlink:href="assets/feather-sprite.svg#more-vertical"/></svg>';
    trigger.appendChild(dropdown_button);

    const menu = create_element('div', ["dropdown-menu"]);
    dropdown.appendChild(menu);

    const menu_content = create_element('div', ["dropdown-content", "has-background-info-light"]);
    menu.appendChild(menu_content);

    items.forEach((item: LabelCallback): void => {
        const dropdown_item = create_element('a', ["dropdown-item"], {"href": "#"});
        dropdown_item.textContent = item.label;
        dropdown_item.addEventListener('click', item.callback);
        menu_content.appendChild(dropdown_item);
    });

    return dropdown;
};

function encode_parameters(parameters: Record<string, string|number|boolean>): string {
    return Object.keys(parameters).reduce(
        (a: string[], k: string): string[] => {
            a.push(`${k}=${encodeURIComponent(parameters[k])}`);
            return a;
        },
        []
    ).join('&');
};

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
