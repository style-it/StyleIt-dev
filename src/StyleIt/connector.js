import DomUtilis from "./utilis/DomUtilis";
import CopyPaste from "./services/copyPaste/copyPaste.service";
import Inpsector from "./services/Inspector/Inspector.service";
import KeyPress from "./services/keyPress/KeyPress";
import { wrapNakedTextNodes } from "./services/elements.service";

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
        } 
         if (DomUtilis.isElement(element)) {
            // valid..
            document.execCommand('defaultParagraphSeparator', false, 'p');
            document.execCommand("styleWithCSS", true, null);
        } else {
            //TODO: use the validator
            console.error('[-] =>connectWith should be element id or dom element..');
            return null;
        }
      
        const usePlugins = (element, options) => {
            return {
                copyPaste: new CopyPaste(element, options),
                inspector: new Inpsector(element, options.onInspect),
                keyPress: new KeyPress(element, options),
            }
        }
        Array.from(element.querySelectorAll("[contenteditable]")).forEach(editable=>{    
            wrapNakedTextNodes(editable);
        });
        this.createDefaultStyle();
        this.plugins = usePlugins(element, options);
        return element;
    }
    createDefaultStyle() {
        const style = document.createElement("style");
        style.innerHTML = `
            [contenteditable]{
                min-height:10px;
            }
            `;
        document.head.appendChild(style);
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

