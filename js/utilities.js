const parse_float = (str) => {
    if (!/[0-9]/.test(str)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]*\.?[0-9]*$/.test(str)) {
        return null;
    }
    return parseFloat(str);
};

const parse_int = (str) => {
    if (!/[0-9]/.test(str)) {
        return null;
    }
    if (!/^(\+|-)?[0-9]+$/.test(str)) {
        return null;
    }
    return parseFloat(str);
};

const create_element = (type, classes = [], attributes = {}) => {
    const element = document.createElement(type);
    classes.forEach((cls) => {
        element.classList.add(cls);
    });
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
};

const remove_element = (node) => {
    if (node === null) {
        return;
    }
    node.parentNode.removeChild(node);
};

const create_text_input = (label_text, data_tag, placeholder) => {
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

const create_color_input = (label_text, data_tag, placeholder) => {
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

const create_select_input = (label_text, data_tag) => {
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

const create_button = (label_text, callback) => {
    const control = create_element('div', ["control"]);
    const button = create_element('button', ["button"]);
    button.textContent = label_text;
    button.addEventListener('click', callback);
    control.appendChild(button);
    return control;
};

const create_dropdown = (items) => {
    const dropdown = create_element("div", ["dropdown", "is-right"]);
    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdown.classList.toggle('is-active');
    });

    const trigger = create_element('div', ["dropdown-trigger"]);
    dropdown.appendChild(trigger);

    const dropdown_button = create_element('button', ["button", "is-white"]);
    dropdown_button.innerHTML = '<svg class="icon icon16"><use xlink:href="img/feather-sprite.svg#more-vertical"/></svg>';
    trigger.appendChild(dropdown_button);

    const menu = create_element('div', ["dropdown-menu"]);
    dropdown.appendChild(menu);

    const menu_content = create_element('div', ["dropdown-content", "has-background-info-light"]);
    menu.appendChild(menu_content);

    items.forEach((item) => {
        const dropdown_item = create_element('a', ["dropdown-item"], {"href": "#"});
        dropdown_item.textContent = item.label;
        dropdown_item.addEventListener('click', item.callback);
        menu_content.appendChild(dropdown_item);
    });

    return dropdown;
};

const encode_parameters = (parameters) => {
    return Object.keys(parameters).reduce(
        (a, k) => {
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
    encode_parameters,
    remove_element,
};
