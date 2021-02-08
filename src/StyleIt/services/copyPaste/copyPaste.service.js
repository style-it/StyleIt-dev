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
    const isShifted = event.shiftKey;
    if(isShifted){
      this.pastePlainText(event);
    }else{
      this.pasteWithStyles(event);
    }

  };
  
  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    let copied = data.getData('text/plain').trim();
    copied = copied.replace(/\n/g, "<br/>")
    if(!copied.trim()){
      return;
    }
    const p = document.createElement("p");
    p.innerHTML = copied;

    // document.execCommand('inserttext', false, content);
    pasteHtmlAtCaret(p);
      setCaretAt(p);

      if (p.parentElement !== this.target) {
        p.unwrap();

      } 
      Array.from(this.target.children).forEach(child => {
        if (!child.textContent.trim()) {
          this.target.removeChild(child);
        }
      })
    

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
      const p = document.createElement("p");
      p.innerHTML = copied;
      pasteHtmlAtCaret(p);
      let parentBlock = GetClosestBlockElement(p);
      if (parentBlock && p.children.length === 1) {
        if (block_elments[p.children[0].nodeName]) {
          p.children[0].unwrap();
        }
        setCaretAt(p);
        normalizePasedElement(parentBlock);

      } else if (parentBlock && p.children.length > 1) {
        const firstChild = p.firstChild;
        p.parentElement.insertBefore(firstChild, p);
        const sameNode = firstChild.parentElement.closest("h1,h2,h3,h4,h5,h6,p");
        if (sameNode) {
          firstChild.unwrap();
        }
        parentBlock.insertAfter(p);
      }
      normalizePasedElement(p);
      setCaretAt(p);
      p.unwrap();

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

