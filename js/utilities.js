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

const create_text_input = (label_text, data_tag, placeholder) => {
    const field = document.createElement('div');
    field.classList.add("field");
    const label = document.createElement('label');
    label.classList.add("label");
    label.setAttribute("data-i18n", label_text);
    label.textContent = label_text;
    field.appendChild(label);
    const control = document.createElement('div');
    control.classList.add("control");
    const input = document.createElement('input');
    input.classList.add("input");
    input.classList.add("is-fullwidth");
    input.setAttribute("type", "text");
    input.setAttribute(data_tag, null);
    input.setAttribute("placeholder", placeholder);
    input.setAttribute("data-i18n", placeholder);
    input.setAttribute("data-i18n-target", "placeholder");
    control.appendChild(input);
    field.appendChild(control);
    return field;
};

const create_color_input = (label_text, data_tag, placeholder) => {
    const field = document.createElement('div');
    field.classList.add("field");
    const label = document.createElement('label');
    label.classList.add("label");
    label.setAttribute("data-i18n", label_text);
    label.textContent = label_text;
    field.appendChild(label);
    const control = document.createElement('div');
    control.classList.add("control");
    const input = document.createElement('input');
    input.classList.add("input");
    input.classList.add("is-fullwidth");
    input.setAttribute("type", "color");
    input.setAttribute(data_tag, null);
    input.setAttribute("placeholder", placeholder);
    input.setAttribute("data-i18n", placeholder);
    input.setAttribute("data-i18n-target", "placeholder");
    control.appendChild(input);
    field.appendChild(control);
    return field;
};

const create_select_input = (label_text, data_tag) => {
    const field = document.createElement('div');
    field.classList.add("field");
    const label = document.createElement('label');
    label.classList.add("label");
    label.setAttribute("data-i18n", label_text);
    label.textContent = label_text;
    field.appendChild(label);
    const control = document.createElement('div');
    control.classList.add("control");
    const div = document.createElement('div');
    div.classList.add("select");
    div.classList.add("is-fullwidth");
    const select = document.createElement('select');
    select.setAttribute(data_tag, null);
    div.appendChild(select);
    control.appendChild(div);
    field.appendChild(control);
    return field;
};

const create_button = (label_text, callback) => {
    const control = document.createElement('div');
    control.classList.add("control");
    const button = document.createElement('button');
    button.classList.add("button");
    button.textContent = label_text;
    button.addEventListener('click', callback);
    control.appendChild(button);
    return control;
};

const create_dropdown = (items) => {
    const dropdown = document.createElement('div');
    dropdown.classList.add("dropdown");
    dropdown.classList.add("is-right");
    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdown.classList.toggle('is-active');
    });

    const trigger = document.createElement('div');
    trigger.classList.add("dropdown-trigger");
    dropdown.appendChild(trigger);

    const dropdown_button = document.createElement('button');
    dropdown_button.classList.add("button");
    dropdown_button.classList.add("is-white");
    dropdown_button.innerHTML = '<svg class="icon icon16"><use xlink:href="img/feather-sprite.svg#more-vertical"/></svg>';
    trigger.appendChild(dropdown_button);

    const menu = document.createElement('div');
    menu.classList.add("dropdown-menu");
    dropdown.appendChild(menu);

    const menu_content = document.createElement('div');
    menu_content.classList.add("dropdown-content");
    menu_content.classList.add("has-background-info-light");
    menu.appendChild(menu_content);

    items.forEach((item) => {
        const dropdown_item = document.createElement('a');
        dropdown_item.classList.add("dropdown-item");
        dropdown_item.setAttribute("href", "#");
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
    create_button,
    create_dropdown,
    create_text_input,
    create_color_input,
    create_select_input,
    encode_parameters,
};
