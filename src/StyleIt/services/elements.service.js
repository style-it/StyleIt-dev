import { getStyle, JsonObjectToStyleString } from "./style.service";
import Levels from '../constants/Levels.json';
import { void_elements } from "../constants/void_elms";
import { setCaretAt } from "./range.service";

export function wrapNakedTextNodes(target) {
    target.normalize();

    Array.from(target.childNodes).forEach(c => {

        if (c.nodeType === 1 && !c.textContent.trim() && c.children.length === 0 && !void_elements[c.nodeName]) {
            c.parentNode.removeChild(c);
        }
        if (((c.nodeType === 3 && c.parentElement === target) || c.nodeType === 1 && window.getComputedStyle(c).display === "inline") && !c.parentElement.closest("p") && c.textContent.trim()) {
            const p = document.createElement("p");
            c.wrap(p);
            while(p.nextSibling && (p.nextSibling.nodeType === 3 || window.getComputedStyle(p.nextSibling).display === "inline") ){
                p.appendChild(p.nextSibling);
            }
            // while(p.previousSibling && (p.previousSibling.nodeType === 3 || window.getComputedStyle(p.previousSibling).display === "inline") ){
            //     p.prepend(p.previousSibling);
            // }
            p.normalize();
            setCaretAt(p, 1);
        }
    })
}

// export function wrapNakedTextNodes(target) {
//     target.normalize();
//     // target is the main contenteditable element
//     // so 
//     Array.from(target.childNodes).forEach(c => {

//         if (c.nodeType === 1 && !c.textContent.trim() && c.children.length === 0 && !void_elements[c.nodeName]) {
//             c.parentNode.removeChild(c);
//         }
//         if (((c.nodeType === 3 && c.parentElement === target)) && !c.parentElement.closest("p") && c.textContent.trim()) {
//             const p = document.createElement("p");
//             c.wrap(p);
//             p.normalize();
//             setCaretAt(p, 1);   
//         }
//     })
// }
export function walkTheDOM(node, func) {
    if (!node) return null;
    func(node);
    node = node.firstChild;
    while (node) {
        walkTheDOM(node, func);
        node = node.nextSibling;
    }
}
export function walkOnElement(node, func) {
    if (!node) return null;
    const continueWith = func(node);
    if (continueWith) {
        node = continueWith;
    }
    node = node.firstElementChild;
    while (node) {
        walkOnElement(node, func);
        node = node.nextElementSibling;
    }
}
export function getSelectedElement() {
    var node = document.getSelection();
    if (node) {
        var ancNode = node.focusNode;
        if (ancNode !== null) {
            while (ancNode.nodeType === 3) {
                ancNode = ancNode.parentNode;
            }
            // const el = (ancNode.nodeType === 3 ? ancNode.parentNode : node);
            return ancNode;
        }
        return null;
    }
}
export function JsonToElement(jsonObject, parentElement) {
    //TODO: create parentelement and jsonobject validation   
    const renderAttrs = (jsElement, element) => {
        if (jsElement.classList) {
            element.classList = [...jsElement.classList];
        }
        if (jsElement.style) {
            const collectedStyle = JsonObjectToStyleString(jsElement.style);
            element.style = collectedStyle;
        }
        //TODO: other attrs...
    }
    const createHtmlElement = (jsElement) => {
        const nodeType = jsElement.tag;
        let element;
        let isShouldRenderAttrs;
        switch (nodeType) {
            case "#text":
                element = document.createTextNode(jsElement.textContent);
                break;
            case "A":
                element = document.createElement(nodeType);
                element.href = jsElement.href;
                element.target = jsElement.target;
                break;
            default:
                element = document.createElement(nodeType);
                isShouldRenderAttrs = true;
                break;
        }
        if (isShouldRenderAttrs && element) {
            renderAttrs(jsElement, element);
        }
        return element;
    }
    if (!parentElement && jsonObject.type === Levels['0']) {
        parentElement = createHtmlElement(jsonObject);
    }
    if (Array.isArray(jsonObject.children)) {
        jsonObject.children.forEach(jsChild => {
            const htmlElement = createHtmlElement(jsChild);
            if (htmlElement) {
                parentElement.appendChild(htmlElement);
                JsonToElement(jsChild, htmlElement);
            } else {
                console.error('cant create dom element from json', jsChild);
            }
        });
    }
    return parentElement;
}
export function elementToJson(node, level) {

    if (typeof (level) !== "number") level = 0;
    const nodeType = node.nodeName;
    let isShouldRenderAttrs = true;
    let json = {};
    let isValid = true;

    if (Levels[level]) {
        json.type = Levels[level];
        level++;
    }

    switch (nodeType) {
        case "#text":
            json.tag = nodeType;
            json.textContent = node.textContent.replace(/\u200B/g, '');
            isShouldRenderAttrs = false;
            //question: replace \n ?
            if (!json.textContent.trim()) isValid = false;
            break;
        case "A":
            json.tag = nodeType;
            json.href = node.href;
            json.target = node.target;
            break;
        default:
            json.tag = nodeType;
            //TODO: should we unwrap this node ? 
            break;
    }
    if (!isValid) return null;
    if (isShouldRenderAttrs) {
        //TODO: get attrs 
        const style = getStyle(node);
        if (Object.keys(style).length > 0) {
            json.style = style;
        }
        if (node.classList && node.classList.length > 0)
            json.classList = [...node.classList];

        if (node.childNodes && node.childNodes.length > 0)
            json.children = [...node.childNodes].map((cn) => elementToJson(cn, level)).filter(v => v);
    }

    return json;

}