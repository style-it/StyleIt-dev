import { wrapNakedTextNodes } from "../elements.service";
import { pasteHtmlAtCaret, setCaretAt } from "../range.service";
import { getInheirtCss, setStyle, setStyles } from "../style.service";
import { normalizeElement } from "../textEditor.service";

export default class CopyPaste {

  constructor(target, options) {
    this.target = target;
    this.pasteCommonKeyCode = "this-is-temp-holder-of-paste-content-from-local";
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
        container.classList.add(this.pasteCommonKeyCode)
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
            }
          })

        }
        html = container.outerHTML;
      }
    } else if (typeof document.selection) {
      if (document.selection.type === "Text") {
        html = document.selection.createRange().htmlText;
      }
    }
    // navigator.clipboard.writeText(html);
    event.preventDefault();
    event.clipboardData.setData('text/html', html);


  }
  paste(event) {
    this.pasteWithStyles(event);
  };
  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    let content = data.getData('text/plain').trim();

    document.execCommand('inserttext', false, content);
    if (this.onPaste) {
      content = this.onPaste(content)
    }
  }
  pasteWithStyles(event) {
    event.preventDefault();
    let HtmlContainer = document.createElement("div");
    HtmlContainer.style.opacity = 0;
    try {
      const data = event.clipboardData || window.clipboardData;
      HtmlContainer.innerHTML = data.getData('text/html').trim();
      const localElement = HtmlContainer.querySelector(`.${this.pasteCommonKeyCode}`);
      if (localElement) {
        pasteHtmlAtCaret(localElement.outerHTML);
        const local = this.target.querySelector(`.${this.pasteCommonKeyCode}`);
        Array.from(local.childNodes).forEach(n => {
          if (n.nodeType === 1 && (n.parentElement.closest(n.nodeName) || !n.textContent.trim())) {
            n.unwrap();
          }
        });
        normalizeElement(local);
        setCaretAt(local);
        local.unwrap();
        wrapNakedTextNodes(this.target);
        return null;
      } else {
        if (!this.stylesToPaste) {
          this.pastePlainText(event);

        } else {
          Array.from(HtmlContainer.querySelectorAll(`[style*='position']`)).forEach(el => {
            el.style.position = "";
          })
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
      }

    }
    catch (error) {
      console.error(error);
    }
    finally {
      if (HtmlContainer && HtmlContainer.parentNode) {
        HtmlContainer.parentNode.removeChild(HtmlContainer);
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