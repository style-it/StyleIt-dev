import { getStyle, JsonObjectToStyleString } from "./style.service";
import { Types } from '../constants/elementTypes';
import Levels from '../constants/Levels.json';

export function  getSelectedElement(){
    var node = document.getSelection();
    if (node !== null) {
      var ancNode = node.anchorNode;
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
        const nodeType = Types[jsElement.tag];
        let element;
        let isShouldRenderAttrs;
        switch (nodeType) {
            case Types["#text"]:
                element = document.createTextNode(jsElement.textContent);
                break;
            case Types.A:
                element = document.createElement(nodeType);
                element.href = jsElement.href;
                element.target = jsElement.target;
                break;
            case Types.SPAN:
            case Types.DIV:
            case Types.P:
                element = document.createElement(nodeType);
                isShouldRenderAttrs = true;
                break;
            case Types.BR:
                element = document.createElement(nodeType);
                break;
            default:
                console.log("this tag element is not on the valids elements", nodeType)
                break;
        }
        if (isShouldRenderAttrs && element) {
            renderAttrs(jsElement, element);
        }
        return element;
    }
    if(!parentElement && jsonObject.type === Levels['0']) {
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
    const nodeType = Types[node.nodeName];

    let json = {};
    let isValid = true;

    if (Levels[level]) {
        json.type = Levels[level];
        level++;
    }

    switch (nodeType) {
        case Types["#text"]:
            json.tag = nodeType;
            json.textContent = node.textContent.replace(/\u200B/g,'');
            //question: replace \n ?
            if(!json.textContent.trim()) isValid = false;
            break;
        case Types.A:
            json.tag = nodeType;
            json.href = node.href;
            json.target = node.target;
            break;
        case Types.DIV:
        case Types.SPAN:
        case Types.BR:
        case Types.P:
            json.tag = nodeType;
            break;
        default:
            console.log("this tag element is not on the valids elements", node.nodeName)
            //TODO: should we unwrap this node ? 
            break;
    }
    if(!isValid) return null;
    //TODO: get attrs 
    const style = getStyle(node);
    if (Object.keys(style).length > 0) {
        json.style = style;
    }
    if (node.classList && node.classList.length > 0)
        json.classList = [...node.classList];

    if (node.childNodes && node.childNodes.length > 0)
        json.children = [...node.childNodes].map((cn) => elementToJson(cn, level)).filter(v=>v);
    return json;

}