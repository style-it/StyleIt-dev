import DomUtilis from "./utilis/DomUtilis";
import CopyPaste from "./services/copyPaste/copyPaste.service";
import  Inpsector  from "./services/Inspector/Inspector.service";

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
        } else {
               //TODO: use the validator
            console.error('[-] =>connectWith should be element id or dom element..');
            return null;
        }
        // element.contentEditable = 'true';
        this.plugins = this.usePlugins(element,options);
        return element;
    }
    //TODO: destory events..
    //question: how to use the events ? 
    usePlugins(element,options){    
        return {
            copyPaste:new CopyPaste(element),
            inspector:new Inpsector(element,options.onInspect)
        }
    }
}

