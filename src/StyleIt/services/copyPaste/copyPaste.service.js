
import { EVENTS } from '../events/events';
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
    this.onPaste = (event) => {
      document.execCommand("defaultParagraphSeparator", false, "p");
      function walkTheDOM(node, func) {
        func(node);
        node = node.firstChild;
        while (node) {
          walkTheDOM(node, func);
          node = node.nextSibling;
        }
      }

      const target = event.target;
      const block = target.closest(`#${this.target.id}`);
      if (block) {
        const data = event.clipboardData || window.clipboardData;
        let clip = data.getData('text/html').trim();
        if (!clip) {
          clip = data.getData('text/plain').trim();
          clip = clip.replace(/\n/g, "<br/>")
        }
        //TODO: regex all togheter!
        let markup = clip;
        ["<html>", "<body>", "<!--StartFragment-->", "<!--EndFragment-->", "</body>", "</html>"].
          forEach(rep => markup = markup.replace(rep, ""));
        const temp = document.createElement("div");
        temp.innerHTML = markup.replace(/<!--([\s\S]*?)-->/g, "");

        const nodes = [];
        // Example usage: Process all Text nodes on the page
        const notValid = ["META", "LINK", "SCRIPT", "TCXSPAN", "O:P", "STYLE"];

        walkTheDOM(temp, function (node) {
          if (!notValid.includes(node.nodeName)) {
            nodes.push(node);
          }
        });

        const rendered = document.createElement("div");
        document.body.appendChild(rendered);

        nodes.forEach((newEl, index) => {
          rendered.appendChild(newEl);
          if (newEl.textContent && newEl.nodeType === 1 && newEl.nodeName !== "br") {
            const computed = window.getComputedStyle(newEl);
            if (computed.display === "block") {
              const br = document.createElement("br");
              newEl.insertAfter(br);
            }
          }
          if (newEl.nodeType !== 3 && newEl.nodeName !== "BR") {
            newEl.remove();
          }
        });
        const arr = Array.from(rendered.childNodes);
        for (let index = 0; index < arr.length; index++) {
          const element = arr[index];
          if (!element.textContent.trim()) {
            element.remove();
          } else {
            if (!arr[arr.length - 1].textContent.trim()) {
              arr[arr.length - 1].remove();
            }
            break;
          }
        }
        event.preventDefault();

        document.execCommand("insertHTML", false, rendered.innerHTML);
        // pasteHtmlAtCaret(rendered);
        rendered.remove();
        if (typeof (EVENTS["paste"]) === "function") {
          EVENTS["paste"](rendered.innerHTML);
        }
      }
    }
    this.target.addEventListener('paste', this.onPaste);
    this.target.addEventListener('copy', this.onCopy);
  }
  Destroy() {
    this.target.removeEventListener('paste', this.onPaste);
    this.target.removeEventListener('copy', this.onCopy);
    this.target = null;
  }
}