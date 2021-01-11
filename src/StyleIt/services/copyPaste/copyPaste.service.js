
const validStyles = {
  "textDecoration": true,
  "fontSize": true,
  "fontStyle": true,
  // "lineHeight": true,
  "color": true,
  "backgroundColor": true,
  "fontWeight": true,
  "textShadow": true,
  "fontFamily": true

}
const onPaste = (event) => {
  document.execCommand("DefaultParagraphSeparator", false, "p");
  event.preventDefault();
  let textContentContainer;
  let HtmlContainer;
  try {
    const data = event.clipboardData || window.clipboardData;
    textContentContainer = document.createElement("div");
    textContentContainer.innerText = data.getData('text/plain').trim();;
    HtmlContainer = document.createElement("div");
    HtmlContainer.innerHTML = data.getData('text/html').trim();
    document.body.appendChild(textContentContainer);
    document.body.appendChild(HtmlContainer);

    const htmlNodes = [];
    const recurse = (el, callback) => {
      el.childNodes.forEach(node => {
        callback(node);
        if (node.nodeType === 1) {
          recurse(node, callback);
        }
      })

    }



    recurse(HtmlContainer, (node) => {
      if (node.nodeType === 3) {
        const span = document.createElement("span");
        for (const key in validStyles) {
          if (Object.hasOwnProperty.call(validStyles, key)) {
            span.style[key] = "inherit";
          }
        }
        node.wrap(span);
        htmlNodes.push(span);
      }
    });
    htmlNodes.forEach(s => {
      if (!s.textContent.trim()) return;
      const collectedStyles = window.getComputedStyle(s);
      for (const key in collectedStyles) {
        if (Object.hasOwnProperty.call(collectedStyles, key)) {
          const value = collectedStyles[key];
          if (validStyles[key]) {
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
    const textNodes = []
    recurse(textContentContainer, (node => {
      textNodes.push(node)
    }));
    htmlNodes.forEach(el => {
      const replaced = textContentContainer.innerHTML.replace(el.textContent, el.outerHTML);;
      textContentContainer.innerHTML = replaced
    });
    document.execCommand('inserthtml', false, textContentContainer.innerHTML);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    textContentContainer.parentNode.removeChild(textContentContainer);
    HtmlContainer.parentNode.removeChild(HtmlContainer);
  }
};

export default class CopyPaste {

  constructor(target) {
    this.target = target;
    this.start();
  }
  start() {
    this.target.addEventListener("paste", onPaste);
  }
  destroy() {
    this.target.removeEventListener("paste", onPaste);
  }
}