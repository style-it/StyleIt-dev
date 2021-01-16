import { wrapNakedTextNodes } from "../elements.service";
import { GetClosestBlockElement, insertAfter, pasteHtmlAtCaret, setCaretAt } from "../range.service";


export default class KeyPress {

    constructor(target, options) {
        if (!target) {
            console.error('[-] keyPress => target is null');
            return null;
        }
        this.target = target;


        this.keypress = (e) => {
            if(e.keyCode === 8){
                const target = e.target;
                if (target.textContent.replace(/\s/g, "").replace(/[\u200B-\u200D\uFEFF]/g, '') === "") {
                    e.preventDefault();
                    return;
                  }

                // if(!target.textContent){
                //     e.preventDefault();
                //     pasteHtmlAtCaret(" &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")
                //     debugger
                //     wrapNakedTextNodes(this.target);
                //     return false;
                // }
            }
            else if (e.keyCode === 13) {
                e.preventDefault();
                if(e.shiftKey){
                    pasteHtmlAtCaret("<br/>")
                    // document.execCommand('inserthtml', false, );
                    return false;
                }
                // document.execCommand('inserttext', false, "\n");
                // return false;
                const range = document.createRange();
                const selection = window.getSelection();
                e.preventDefault();
                var blockElement = GetClosestBlockElement(selection.anchorNode);
                range.setStart(selection.focusNode, selection.focusOffset);
                range.setEnd(blockElement,blockElement.childNodes.length);
                selection.removeAllRanges();
                selection.addRange(range);
                const docFragment = range.extractContents();
                Array.from(docFragment.children).forEach(child => {
                    if (child.nodeType === 1 && !child.textContent.trim()) {
                        child.unwrap();
                    }
                });
              
                const el = document.createElement(blockElement.nodeName);
                el.appendChild(docFragment);
                insertAfter(el, blockElement);
                selection.removeAllRanges();

            }

            // const ctrl = "^";
            // const alt = "!";
            // const shift  = "+";

            // /*
            // ["^+66",() => {}];
            // */
            // if (e.ctrlKey) {
            //     this.keys.forEach(key => {
            //         if (Array.isArray(key) && key.length === 2 && key[0] === e.keyCode && typeof(key[1]) === "function") {
            //             e.preventDefault();
            //             key[1]();
            //         }
            //     })
            // }

        }


        this.target.addEventListener('keydown', this.keypress);

        this.Destroy = () => {
            this.target.removeEventListener('keydown', this.keypress);
            this.target = null;
        }
    }
}