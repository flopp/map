const parse_float = (str) => {
    if (!((/[0-9]/).test(str))) {
        return null;
    }
    if (!((/^(\+|-)?[0-9]*\.?[0-9]*$/).test(str))) {
        return null;
    }
    return parseFloat(str);
};

const parse_int = (str) => {
    if (!((/[0-9]/).test(str))) {
        return null;
    }
    if (!((/^(\+|-)?[0-9]+$/).test(str))) {
        return null;
    }
    return parseFloat(str);
};

const create_text_input = (label, data_tag, placeholder) => {
    return $(`
        <div class="field">
            <label class="label">${label}</label>
            <div class="control">
                <input class="input" type="text" ${data_tag} placeholder="${placeholder}">
            </div>
        </div>`);
};

const create_color_input = (label, data_tag, placeholder) => {
    return $(`
        <div class="field">
            <label class="label">${label}</label>
            <div class="control">
                <input class="input" type="color" ${data_tag} placeholder="${placeholder}">
            </div>
        </div>`);
};

const create_select_input = (label, data_tag) => {
    return $(`
        <div class="field">
            <label class="label">${label}</label>
            <div class="control">
                <div class="select">
                    <select ${data_tag}></select>
                </div>
            </div>
        </div>`);
};

const create_button = (label, callback) => {
    const button = $(`<button class="button">${label}</button>`).click(callback);
    return $('<div class="control">').append(button);
};

const create_dropdown = (menu_id, items) => {
    const dropdown = $('<div class="dropdown is-right">');
    dropdown.click((event) => {
        event.stopPropagation();
        dropdown.toggleClass('is-active');
    });

    const trigger = $('<div class="dropdown-trigger">');
    dropdown.append(trigger);
    const dropdown_button = $(`<button class="button is-white" aria-haspopup="true" aria-controls="${menu_id}">
        <span class="icon is-small"><i class="fas fa-ellipsis-v aria-hidden="true"></i></span>
    </button>`);
    trigger.append(dropdown_button);

    const menu = $(`<div class="dropdown-menu" id="${menu_id}" role="menu">`);
    dropdown.append(menu);
    const menu_content = $('<div class="dropdown-content">');
    menu.append(menu_content);

    items.forEach((item) => {
        const dropdown_item = $(`<a href="#" class="dropdown-item">${item.label}</a>`);
        dropdown_item.click(item.callback);
        menu_content.append(dropdown_item);
    });

    return dropdown;
};

export {parse_float, parse_int, create_button, create_dropdown, create_text_input, create_color_input, create_select_input};
