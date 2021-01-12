
// const validStyles = {
//   "textDecoration": true,
//   "fontSize": true,
//   "fontStyle": true,
//   // "lineHeight": true,
//   "color": true,
//   "backgroundColor": true,
//   "fontWeight": true,
//   "textShadow": true,
//   "fontFamily": true

// }


export default class CopyPaste {

  constructor(target, options) {
    this.target = target;
    this.stylesToPaste = typeof options.stylesToPaste === "object" ? options.stylesToPaste : null;
    this.onPaste = this.onPaste.bind(this);
    this.start();
  }
  onCopy (){
    const selection = window.getSelection().toString();
          let splits = selection.split("\n");
          let count = 0;
          let startIndex = 0;
          splits.forEach((t,index)=>{
            if(t === ""){
              if(!startIndex) startIndex = index;
              count++;
            }else{
              if(count > 1 && startIndex){
                let sum = Math.floor(count/2);
                splits.splice(startIndex,sum);
              }
              count=0;
              startIndex = 0;
            }
          })
          let rendered ="";    
          splits.forEach((t,index)=>{
            if(t.trim()){
              t = t;
            }else{
              t = "\n"
            }
  
              rendered+=t;
          })
          navigator.clipboard.writeText(rendered).then(function() {
          
        });
  }
  onPaste(event) {
    if (this.stylesToPaste) {
      this.pasteWithStyles(event);
    } else {
      this.pastePlainText(event);
    }

  };
  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    const content = data.getData('text/plain').trim();
    document.execCommand('inserttext', false, content);
  }
  pasteWithStyles(event) {
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
      document.execCommand('inserthtml', false, textContentContainer.innerHTML);
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
    this.target.addEventListener("paste", this.onPaste);
    this.target.addEventListener("copy", this.onCopy);
  }
  destroy() {
    this.target.removeEventListener("paste", this.onPaste);
    this.target.removeEventListener("copy", this.onCopy);

  }
}