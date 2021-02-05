import { block_elments } from "../../constants/block_elms";
import { void_elements } from "../../constants/void_elms";
import { walkOnElement, wrapNakedTextNodes } from "../elements.service";
import { pasteHtmlAtCaret, setCaretAt,GetClosestBlockElement } from "../range.service";
import { getInheirtCss, setStyles } from "../style.service";


const normalizePasedElement = (target) => {

  walkOnElement(target, (node) => {
    if (node !== target && node.parentElement && block_elments[node.nodeName]) {
      const blockParent = node.parentElement.closest(node.nodeName);
      if (blockParent && blockParent !== target) {
        node.unwrap();
        return blockParent;
      }
    }
  })

}

export default class CopyPaste {

  constructor(target, options) {
    this.target = target;
    this.stylesToPaste = typeof options.stylesToPaste === "object" ? options.stylesToPaste : null;
    this.onCopy = typeof options.onCopy === "function" ? options.onCopy : null;
    this.onPaste = typeof options.onPaste === "function" ? options.onPaste : null;
    this.paste = this.paste.bind(this);
    this.copy = this.copy.bind(this);
    this.start();
  }

  copy(event) {
    let html = "";
    if (typeof window.getSelection) {
      var sel = window.getSelection();
      if (sel.rangeCount) {
        const container = document.createElement("div");
        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
          let copiedNode = sel.getRangeAt(i).cloneContents();
          container.appendChild(copiedNode);

          Array.from(container.childNodes).forEach(n => {
            if (n.nodeType === 3) {
              const parentCopiedNode = sel.getRangeAt(i).startContainer.parentNode;
              const collectedCSS = getInheirtCss(parentCopiedNode, this.target);
              const span = document.createElement("span");
              span.textContent = copiedNode.textContent;
              span.style = collectedCSS;
              setStyles(span, collectedCSS);
              n.wrap(span);

            } else if (void_elements[n.nodeName] && n.nodeName !== "BR") {
              n.parentElement.removeChild(n);
            }
          })

        }
        html = container;
      }
    } else if (typeof document.selection) {
      if (document.selection.type === "Text") {
        html = document.selection.createRange().htmlText;
      }
    }
    event.preventDefault();
    event.clipboardData.setData('styleit/html', html.innerHTML);
    event.clipboardData.setData('text/plain', html.textContent);
    if(this.onCopy){
      this.onCopy(event);

    }
  }
  paste(event) {
    this.pasteWithStyles(event);
  };
  
  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    let content = data.getData('text/plain').trim();
    content = content.replace(/\n/g, "<br/>")
    if(!content.trim()){
      return;
    }
    const id = "this-is-temp-container-for-plain-text";

    // document.execCommand('inserttext', false, content);
    pasteHtmlAtCaret(`<p id="${id}">${content}</p>`);
    const copiedElement = this.target.querySelector(`#${id}`);
    if (copiedElement) {
      setCaretAt(copiedElement);

      if (copiedElement.parentElement === this.target) {
        copiedElement.removeAttribute("id");
      } else {
        copiedElement.parentNode.removeChild(copiedElement);
      }
      Array.from(this.target.children).forEach(child => {
        if (!child.textContent.trim()) {
          this.target.removeChild(child);
        }
      })
    }

    if (this.onPaste) {
      this.onPaste(event,"plainText");
    }
  }
  pasteWithStyles(event) {
    event.preventDefault();
    const data = event.clipboardData || window.clipboardData;
    const copied = data.getData('styleit/html').trim();
    //on copied on the editor localy
    if (copied) {
      const id = "this-is-temp-id-for-paste-content-into-the-dom";
      pasteHtmlAtCaret(`<div id="${id}">${copied}</div>`);
      const copiedElement = this.target.querySelector(`#${id}`);
      let parentBlock = GetClosestBlockElement(copiedElement);
      if (parentBlock && copiedElement.children.length === 1) {
        if (block_elments[copiedElement.children[0].nodeName]) {
          copiedElement.children[0].unwrap();
        }
        setCaretAt(copiedElement);
        normalizePasedElement(parentBlock);

      } else if (parentBlock && copiedElement.children.length > 1) {
        const firstChild = copiedElement.firstChild;
        copiedElement.parentElement.insertBefore(firstChild, copiedElement);
        const sameNode = firstChild.closest(firstChild.nodeName);
        if (sameNode) {
          firstChild.unwrap();
        }
        parentBlock.insertAfter(copiedElement);
      }
      normalizePasedElement(copiedElement);
      setCaretAt(copiedElement);
      copiedElement.unwrap();

      wrapNakedTextNodes(this.target);
      if (this.onPaste) {
        this.onPaste(event,"formattedText");
      }
    } else {
        this.pastePlainText(event);
    }
  }

  start() {
    this.target.addEventListener("paste", this.paste);
    this.target.addEventListener("copy", this.copy);
  }
  destroy() {
    this.target.removeEventListener("paste", this.paste);
    this.target.removeEventListener("copy", this.copy);

  }
}

