import { getStyle, JsonObjectToStyleString } from "./style.service";
import { void_elements } from "../constants/void_elms";
import { block_elments_queryString } from "../constants/block_elms";
import { inline_elements } from "../constants/inline_elems";
import { removeElement } from "./range.service";

export function wrapNakedTextNodes(target) {

    target.normalize();

    Array.from(target.childNodes).forEach(c => {

        if (c.nodeType === 1 && !c.textContent.trim() && c.children.length === 0 && !void_elements[c.nodeName]) {
            removeElement(c);
            return;
        }
        if (c.parentElement === target && c.textContent.trim() && ((c.nodeType === 1 && inline_elements[c.nodeName] && !c.parentElement.closest(block_elments_queryString)) || c.nodeType === 3)) {
            const p = document.createElement("p");
            c.wrap(p);

            while (p.nextSibling && (p.nextSibling.nodeType === 3 || inline_elements[p.nextSibling.nodeName])) {
                p.appendChild(p.nextSibling);
            }

            p.normalize();
        }
    })
}

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
export function jsonToElement(jsonObject, parentElement) {
  //TODO: create parentelement and jsonobject validation   
    const renderAttrs = (jsElement, element) => {
        if (jsElement.classList) {
            element.classList = [...jsElement.classList];
        }
        if (jsElement.style) {
            const collectedStyle = JsonObjectToStyleString(jsElement.style);
            element.style = collectedStyle;
        }
        if (jsElement.attrs) {
            for (const attr in jsElement.attrs) {
                if (Object.hasOwnProperty.call(jsElement.attrs, attr)) {
                    const value = jsElement.attrs[attr];
                    element.setAttribute(attr, value);
                }
            }
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
                case "#comment":
                    element = document.createComment(jsElement.textContent)
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
    if (!parentElement) {
        parentElement = createHtmlElement(jsonObject);
    }
    if (Array.isArray(jsonObject.children)) {
        jsonObject.children.forEach(jsChild => {
            const htmlElement = createHtmlElement(jsChild);
            if (htmlElement) {
                parentElement.appendChild(htmlElement);
                jsonToElement(jsChild, htmlElement);
            } else {
                console.error('cant create dom element from json', jsChild);
            }
        });
    }
    return parentElement;
}
export function elementToJson(node) {

    const nodeType = node.nodeName;
    let isShouldRenderAttrs = true;
    let json = {};
    let isValid = true;


    switch (nodeType) {
        case "#text":
            json.tag = nodeType;
            json.textContent = node.textContent.replace(/\u200B/g, '');
            isShouldRenderAttrs = false;
            //question: replace \n ?
            if (!json.textContent.trim()) isValid = false;
            break;
        case "#comment":
            json.tag = nodeType;
            json.textContent = node.textContent.replace(/\u200B/g, '');
            isShouldRenderAttrs = false;
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
        json.attrs = {};
        //TODO: get attrs 
        Array.from(node.attributes).forEach(attr => {
            switch (attr.name) {
                case "style":
                    const style = getStyle(node);
                    if (Object.keys(style).length > 0) {
                        json.style = style;
                    }
                    break;
                case "class":
                    if (node.classList && node.classList.length > 0)
                        json.classList = [...node.classList];
                    break;
                default:
                    json.attrs[attr.name] = attr.value;
                    break;
            }
        })



        if (node.childNodes && node.childNodes.length > 0)
            json.children = [...node.childNodes].map((cn) => elementToJson(cn)).filter(v => v);
    }

    return json;

}