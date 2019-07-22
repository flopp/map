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

export {parse_float, parse_int};
