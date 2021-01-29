import { void_elements } from "../../constants/void_elms";
import { walkOnElement, wrapNakedTextNodes } from "../elements.service";
import { pasteHtmlAtCaret, setCaretAt } from "../range.service";
import { getInheirtCss, setStyles } from "../style.service";

const normalizePasedElement = (target) => {

  walkOnElement(target, (node) => {
    if (node !== target && node.parentElement && node.style.diaplay !== "inline") {
      const samePArent = node.parentElement.closest(node.nodeName);
      if (samePArent && samePArent !== target) {
        node.unwrap();
        return samePArent;
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
        // document.body.appendChild(container)
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
              debugger
            }else if(void_elements[n.nodeName] && n.nodeName !== "BR"){
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
  }
  paste(event) {
    this.pasteWithStyles(event);
  };
  pasteWithStyleExp(event) {
    function removePostionsStylesFromElement(HtmlContainer) {
      Array.from(HtmlContainer.querySelectorAll(`[style*='position']`)).forEach(el => {
        el.style.position = "";
      });
    }

    function createTempPastedElement() {
      let HtmlContainer = document.createElement("div");
      HtmlContainer.style.opacity = 0;
      HtmlContainer.style.position = "fixed";
      HtmlContainer.style.left = "-9999px";
      return HtmlContainer;
    }

    let HtmlContainer = null;
    try {
      HtmlContainer = createTempPastedElement();
      const data = event.clipboardData || window.clipboardData;
      HtmlContainer.innerHTML = data.getData('text/html').trim();
      removePostionsStylesFromElement(HtmlContainer);
      if (!HtmlContainer.innerHTML) {
        HtmlContainer.innerHTML = data.getData('text/plain').trim();
        document.execCommand("inserttext", false, HtmlContainer.innerHTML);
        //todo: stop here..
        return null;
      }
      document.body.appendChild(HtmlContainer);
      let htmlNodes = [];
      const recurse = (el, callback) => {
        el.childNodes.forEach(node => {
          callback(node);
          if (node.nodeType === 1) {
            recurse(node, callback);
          }
        });

      };

      recurse(HtmlContainer, (node) => {
        if (node.nodeType === 3 && node.textContent.trim()) {
          const span = document.createElement("span");
          for (const key in this.stylesToPaste) {
            if (Object.hasOwnProperty.call(this.stylesToPaste, key)) {
              span.style[key] = "inherit";
            }
          }
          node.wrap(span);
          htmlNodes.push(span);
        }
      });
      htmlNodes.forEach(s => {

        if (!s.textContent.trim())
          return;
        const collectedStyles = window.getComputedStyle(s);
        for (const key in this.stylesToPaste) {
          if (Object.hasOwnProperty.call(collectedStyles, key)) {
            const value = collectedStyles[key];
            if (value) {
              if (value === "inherit") {
                s.style[key] = "";
              } else if (value.includes("none")) {
                s.style[key] = "";
              } else if (value.replace(/ /gm, "").includes("(0,0,0")) {
                s.style[key] = "";
              } else if (value === "normal") {
                s.style[key] = "";
              } else {
                s.style[key] = value;

              }
            }

          }
        }
      });
      const newNodes = []
      htmlNodes.forEach((span, index) => {
        if (index > 0) {
          let firstRect = htmlNodes[index - 1].getBoundingClientRect();
          let currentRect = span.getBoundingClientRect();

          if (!(firstRect.top <= currentRect.bottom && currentRect.top <= firstRect.bottom)) {
            // newNodes.push(document.createElement("br"));
            let spaceHeight = 17;

            const sumBR = Math.floor((currentRect.top - firstRect.bottom) / spaceHeight);
            if (sumBR <= 0) {
              newNodes.push(document.createElement("br"));
            } else {
              for (let i = 0; i < sumBR; i++) {
                newNodes.push(document.createElement("br"));
              }
            }
          }
          span.innerHTML = " " + span.innerHTML
          newNodes.push(span);

        } else {
          newNodes.push(span);
        }
      });
      document.execCommand("inserthtml", false, newNodes.map(n => n.outerHTML).join(""))
      wrapNakedTextNodes(this.target);
    }
    catch (err) {
      throw Error(err);
    }
    finally {
      if (HtmlContainer && HtmlContainer.parentNode) {
        HtmlContainer.parentNode.removeChild(HtmlContainer);
      }
    }
  }
  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    let content = data.getData('text/plain').trim();
    content = content.replace(/\n/g,"<br/>")
    const id = "this-is-temp-container-for-plain-text";
    debugger
    // document.execCommand('inserttext', false, content);
    pasteHtmlAtCaret(`<p id="${id}">${content}</p>`);
    const copiedElement = this.target.querySelector(`#${id}`);
    if (copiedElement) {
      setCaretAt(copiedElement);
      if(copiedElement.parentElement !== this.target && copiedElement.parentElement.nodeName !== "SPAN"){
        copiedElement.unwrap();
      }else{
        copiedElement.removeAttribute("id");
      }
      Array.from(this.target.children).forEach(child=>{
        if(!child.textContent.trim()){
          this.target.removeChild(child);
        }
      })
    }

    if (this.onPaste) {
      content = this.onPaste(content)
    }
  }
  pasteWithStyles(event) {
    event.preventDefault();
debugger
    const data = event.clipboardData || window.clipboardData;
    const copied = data.getData('styleit/html').trim();
    //on copied on the editor localy
    if (copied) {
      const id = "this-is-temp-id-for-paste-content-into-the-dom";
      pasteHtmlAtCaret(`<div id="${id}">${copied}</div>`);
      const copiedElement = this.target.querySelector(`#${id}`);
      if (copiedElement) {
        normalizePasedElement(copiedElement);
        setCaretAt(copiedElement);
        copiedElement.unwrap();
      }

      wrapNakedTextNodes(this.target);
    } else {
      // if copied not from the local editor
      // check if experimental paste was activate
      if (this.stylesToPaste) {
        this.pasteWithStyleExp(event);
      } else {

        this.pastePlainText(event);
      }
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

