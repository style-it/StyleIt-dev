import { normalizeClassName } from "./className.service";
import { normalizeStyle } from "./style.service";
import { mergeNodeContect, mergeTwoNodes } from "../utilis/merger";

/**
 * @param {Element} DomElement - element to normalize
 */
export function normalizeElement(el) {
   
    const recurse = (element) => {
        Array.from(element.children).forEach((child) => {
            recurse(child);
            _normalize(child);
        })
        const mergeNodesStyles = element => {
            let merged = false;
            Array.from(element.children).forEach((element) => {
                let wrapper = element;
                while (wrapper !== null) {
                    const nextElement = wrapper.nextSibling;
                    if (!nextElement)
                        break;
                    wrapper = mergeTwoNodes(wrapper, nextElement);
                    merged = merged || wrapper !== null;
                }
            })
            return merged;
        }
        
        const mergeNodesContent = element => {
            let merged = false;
            Array.from(element.children).forEach((child) => {
                let wrapper = child;
                while (wrapper !== null) {
                    wrapper = mergeNodeContect(wrapper);
                    merged = merged || wrapper !== null;
                }
            })
            return merged;
        }
        let mergedStyles = false;
        let mergedContent  = false;
        do {
            _normalize(element);
             mergedStyles = mergeNodesStyles(element);
            mergedContent = mergeNodesContent(element);
        } while (mergedContent);
    }
    el.normalize();
    recurse(el);
  
    function _normalize(element) {
        element.normalize();
        normalizeClassName(element);
        normalizeStyle(element);
        //TODO: normalizr attributes (no:style,className)
        if (element && element.nodeName === "SPAN" && (!element.textContent.trim() || element.attributes.length === 0)) {
            const unwrapped = element.unwrap();
            unwrapped.normalize();
            //TODO: check the return;
            return unwrapped.parentElement;
        }
    }
}
