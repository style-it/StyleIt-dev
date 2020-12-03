export   const TARGETS = {
    _blank: "_blank",
    _self: "_self",
    _parent: "_parent",
    _top: "_top"
}
export  const resetURL = (src) => {
    src = src.replace(/https:/g, '');
    src = src.replace(/http:/g, '');
    src = src.replace(/mailto:/g, '');
    src = src.replace(/tel:/g, '');
    src = src.replace(/\//g, '');
    return src;
}
export   const createTempLinkElement = (href) => {
    const Atag = document.createElement("a");
    Atag.href = href;
    return Atag;
}