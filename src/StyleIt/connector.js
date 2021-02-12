import DomUtilis from "./utilis/DomUtilis";
import CopyPaste from "./services/copyPaste/copyPaste.service";
import Inpsector from "./services/Inspector/Inspector.service";
import KeyPress from "./services/keyPress/KeyPress";

import { elementToJson, JsonToElement, wrapNakedTextNodes } from "./services/elements.service";
import Observer from "./services/observer/observer";

//TODO:review
export default class Connector {
    constructor() {
    }

    Connect(element, options) {
        if (typeof element === "string") {
            element = document.getElementById(element);
            if (!element) {
                //TODO: use the validator
                console.error('[-] =>connectWith should be element id or dom element..');
                return null;
            }
        } else if (DomUtilis.isElement(element)) {
            // valid..
            document.execCommand('defaultParagraphSeparator', false, 'p');
        } else {
            //TODO: use the validator
            console.error('[-] =>connectWith should be element id or dom element..');
            return null;
        }
        const RenderInnerHTML = (element) => {
            const emptyElement = (node) => {
                return new Promise((resolve) => {
                    while (node.firstElementChild) {
                        node.firstElementChild.remove();
                    }
                    resolve();
                })
            }
            wrapNakedTextNodes(element);

            const jsonContent = elementToJson(element);

            const renderedElement = JsonToElement(jsonContent);

            emptyElement(element).then(() => element.innerHTML = renderedElement.innerHTML);
        }
        const usePlugins = (element, options) => {
            return {
                copyPaste: new CopyPaste(element, options),
                inspector: new Inpsector(element, options.onInspect),
                keyPress: new KeyPress(element, options),
                observer: new Observer(element)
            }
        }
        RenderInnerHTML(element);
        // element.contentEditable = 'true';
        this.plugins = usePlugins(element, options);
        return element;
    }
    //TODO: destory events..
    //question: how to use the events ? 


    Destroy() {
        for (const key in this.plugins) {
            if (this.plugins.hasOwnProperty(key)) {
                const plugin = this.plugins[key];
                plugin.Destroy();
            }
        }
    }
}

