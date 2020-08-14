
import { wrapRangeWithElement, setSelectionFlags, setSelectionBetweenTwoNodes, pasteHtmlAtCaret} from '../range.service';
import { normalizeElement } from '../textEditor.service';
import { getInheirtCss, setStyles, getStyle, normalizeStyle } from '../style.service';
// import { elementToJson } from '../elements.service';
import { splitHTML } from '../../utilis/splitHTML';

//TODO:review
//should we use the clipboard as string ? or pass in other way as json ? 
export default class CopyPaste {
    constructor(target) {
        this.uniqeID = 'styleit-copy-paste-on-action';
        if (!target) {
            //TODO: use the validator
            console.error('[-] Copy Paste => target is null');
            return null;
        }
        this.target = target;
        this.onPaste = (e) => {
            const stringToHTML = function (str) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(str, 'text/html');
                return doc.body;
            };
            const clip = e.clipboardData.getData('text/html');
            const markup = stringToHTML(clip);
            const isLocalElement = markup.querySelector(`.${this.uniqeID}`);
            if (isLocalElement) {
                // review: should we create new on every paste ?
                pasteHtmlAtCaret(isLocalElement.outerHTML);
                let pastedElement = this.target.querySelector(`.${this.uniqeID}`);
                if (pastedElement) {
                    Array.from(pastedElement.querySelectorAll('span')).forEach(child => {
                        const style = getStyle(child);
                        normalizeStyle(child);
                        for (const key in style) {
                            if (style.hasOwnProperty(key)) {
                                const foundedEl = child.parentElement.closest(`[style*='${key}']`);
                                if (foundedEl) {
                                    splitHTML(child, foundedEl);
                                }
                            }
                        }
                    });
                    Array.from(this.target.querySelectorAll(`.${this.uniqeID}`)).forEach(flag => flag.classList.remove(this.uniqeID));
                    normalizeElement(this.target);
                }

            }
            else {
                let paste = (e.clipboardData || window.clipboardData).getData('text');
                const selection = window.getSelection();
                if (!selection.rangeCount) return false;
                selection.deleteFromDocument();
                selection.getRangeAt(0).insertNode(document.createTextNode(paste));
            }
            e.preventDefault();
        }
        this.onCopy = (e) => {
            //review: what should we can do here... it always array of one element..
            const ranges = wrapRangeWithElement();
            if(ranges.length === 0){
                console.warn('no selected elements..');
            }
            // set flags to keep text selection..
            let nodes = ranges.map(el => {
                //clone the nodes and unwrap the wrapped textnodes on the dom..
                const collectStyle = getInheirtCss(el, this.target);
                setStyles(el, collectStyle);
                return el.cloneNode(true);
            });
            
            const { firstFlag, lastFlag } = setSelectionFlags(ranges[0], ranges[ranges.length - 1]);
            ranges.forEach(we => we.unwrap());
            
            setSelectionBetweenTwoNodes(firstFlag, lastFlag);
            this.target.normalize();

            const element = document.createElement('span');

            nodes = nodes.reduce(function(filtered, node) {
                //TODO: filtered by the valid tags..
                if (node.nodeName === "SPAN") {
                   filtered.push(node.outerHTML);
                }
                return filtered;
              }, []);
              element.innerHTML = nodes.join("");
            element.className = this.uniqeID;
            // this.savedJson = elementToJson(element);
            e.clipboardData.setData('text/html', element.outerHTML);
            e.preventDefault();
        }

        this.target.addEventListener('paste', this.onPaste);
        this.target.addEventListener('copy', this.onCopy);
    }
    destroy() {
        this.target.removeEventListener('paste', this.onPaste);
        this.target.removeEventListener('copy', this.onCopy);
    }
}