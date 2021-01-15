
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
          container.appendChild(sel.getRangeAt(i).cloneContents());
        }
        html = container.innerHTML;
      }
    } else if (typeof document.selection) {
      if (document.selection.type === "Text") {
        html = document.selection.createRange().htmlText;
      }
    }
    // navigator.clipboard.writeText(html);

    event.clipboardData.setData('text/html', html);


  }
  paste(event) {
    // document.execCommand("DefaultParagraphSeparator", false, "h2");
    if (this.stylesToPaste) {
      this.pasteWithStyles(event);
    } else {
      this.pastePlainText(event);
    }

  };
  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    let content = data.getData('text/plain').trim();
    if (this.onPaste) {
      content = this.onPaste(content)
    }
    document.execCommand('inserttext', false, content);
  }
  pasteWithStyles(event) {
    event.preventDefault();
    let textContentContainer = document.createElement("div");
    textContentContainer.style.display = "none";
    let HtmlContainer = document.createElement("div");
    HtmlContainer.style.display = "none";
    try {
      const data = event.clipboardData || window.clipboardData;
      textContentContainer.innerText = data.getData('text/plain').trim();;
      HtmlContainer.innerHTML = data.getData('text/html').trim();
      if (!HtmlContainer.innerHTML) {
        HtmlContainer.innerHTML = data.getData('text/plain').trim();;
      }
      document.body.appendChild(textContentContainer);
      document.body.appendChild(HtmlContainer);

      const htmlNodes = [];
      const recurse = (el, callback) => {
        el.childNodes.forEach(node => {
          callback(node);
          if (node.nodeType === 1) {
            recurse(node, callback);
          }
        });

      };



      recurse(HtmlContainer, (node) => {
        if (node.nodeType === 3) {
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
        for (const key in collectedStyles) {
          if (Object.hasOwnProperty.call(collectedStyles, key)) {
            const value = collectedStyles[key];
            if (this.stylesToPaste[key]) {
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
      const textNodes = [];
      recurse(textContentContainer, (node => {
        textNodes.push(node);
      }));
      htmlNodes.forEach(el => {
        const replaced = textContentContainer.innerHTML.replace(el.textContent, el.outerHTML);;
        textContentContainer.innerHTML = replaced;
      });
      let content = textContentContainer.innerHTML;
      if (this.onPaste) {
        this.onPaste(event)
      }
      document.execCommand("inserthtml",false,`<br/>`);
      document.execCommand('inserthtml', false, content);
    }
    catch (error) {
      console.error(error);
    }
    finally {
      textContentContainer.parentNode.removeChild(textContentContainer);
      HtmlContainer.parentNode.removeChild(HtmlContainer);
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