import { normalizeClassName } from "./className.service";
import { UseRules } from "../rules/rules";
import { getSelectedElement } from "./elements.service";

export function getInheirtCss(fromElement, toElement) {
    var intailStyle = {};
    var currectElement = fromElement;

    while (currectElement && currectElement.ischildOf(toElement.parentElement)) {
        let map = getStyle(currectElement);
        for (const style in map) {
            if (map.hasOwnProperty(style)) {
                const value = map[style];
                // text-decoration  could be twice like underline and strike therough.. 
                if (!intailStyle[style])
                    intailStyle[style] = value;
            }
        }
        currectElement = currectElement.parentElement;
    }
    return intailStyle;
}
export function removeStyle(element, key, value) {
    element.style[key] = element.style[key].replace(value, "");
    Array.from(element.querySelectorAll(`[style*='${key}']`)).forEach(el => {
        el.style[key] = el.style[key].replace(value, "");
    })
}
//TOGGLE
export function toggleStyle(element, key, value, isOn) {
    if (isOn) {
        element.style[key] = element.style[key] + " " + value;
    } else {
        element.style[key] = element.style[key].replace(value, "");
    }
    normalizeStyle(element);
    normalizeClassName(element);
    Array.from(element.querySelectorAll(`[style*='${value}']`)).forEach(child => {
        child.style[key] = child.style[key].replace(value, "");
        normalizeStyle(child);
        normalizeClassName(child);
    })
}
//EXTEND
//TODO: fix name
export function setStyles(element, jsonStyle) {
    for (const key in jsonStyle) {
        if (jsonStyle.hasOwnProperty(key)) {
            const style = jsonStyle[key];
            element.style[key] = style;
        }
    }
}
//TOGGLE
//TODO: fix name
export function setStyle(element, key, value) {
    element.style[key] = value;
    if(key === "color"){
        UseRules({element:element,key:'color',value:value});
    }
    Array.from(element.querySelectorAll(`[style*='${key}']`)).forEach(el => {
        el.style[key] = null;
        normalizeStyle(el);
    });
    //experimental: style the text decorations with color..
    //TODO:review
    // UseRules({element:element,key:key,value:value});
}
export const collectStyleFromSelectedElement = (connectecElement) =>{   
    const selectedElement = getSelectedElement();                
    return getInheirtCss(selectedElement,connectecElement);
}

export function normalizeStyle(element) {
    if(!element) return null;
    //TODO:review
    const style = element.getAttribute('style');
    if (!style) {
        element.removeAttribute('style');
    } else {
        const collectStyles = getStyle(element);
        for (const key in collectStyles) {
            if (collectStyles.hasOwnProperty(key)) {
                Array.from(element.querySelectorAll(`[style*='${collectStyles[key]}']`)).forEach(el => {
                    el.style[key] = null;
                    normalizeStyle(el);
                });
            }
        }
    }
}
export function JsonObjectToStyleString(styles) {
    let collectStyles = [];
    for (const key in styles) {
        if (styles.hasOwnProperty(key)) {
            const style = styles[key];
            collectStyles.push(`${key}:${style}`);
        }
    }
    return collectStyles.join(';');
}
export function getStyle(el) {
    if (!el || !el.style) return {};
    let styles = {};
    let style = el.getAttribute('style');
    if (style) {
        let collectStyles = style.split(';');
        if (Array.isArray(collectStyles)) {
            collectStyles.forEach(style => {

                const keyValue = style.split(':');
                if (keyValue[1] && keyValue[0])
                    styles[keyValue[0].trim()] = keyValue[1].trim();
            })
        }

    }
    return styles;
}