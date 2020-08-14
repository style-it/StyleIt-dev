import Core from './StyleIt/index';
import { Modes } from './StyleIt/constants/Modes';
export default class StyleIt {
  //expose only the relevant methods..
  constructor(target, config) {
    //TODO: validate target & config..
    const styleIt = new Core(target, config);
    if (styleIt) {
      this.ExecCmd = styleIt.execCmd;
      this.ExecClassName = styleIt.ExecClassName;
      this.Save = styleIt.Save;
      this.Load = styleIt.Load;
      this.Destroy = styleIt.Destroy;
      this.Modes = Modes;
      //========================================//
      this.ExecClassName = this.ExecClassName.bind(styleIt);
      this.ExecCmd = this.ExecCmd.bind(styleIt);
      this.Save = this.Save.bind(styleIt);
      this.Load = this.Load.bind(styleIt);
      this.Destroy = this.Destroy.bind(styleIt);
    }
  }
}

(function () {

  const init = () => {
    window.addEventListener('DOMContentLoaded', (event) => {
      const root = document.createElement('div');
      root.id = 'root';
      root.innerHTML = `<div id="editor" contenteditable="true">
  <p>
  Hello world<thisTagGoingToBeIgnore>im ignored</thisTagGoingToBeIgnore>
  </p>
  </div>
  <style>
  .test{
	letter-spacing:0.2em;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: #b50064;
  text-shadow: 3px 2px 3px #0a0a0a, 1px 3px 6px #000000;
  }
  </style>
  `;
      document.body.appendChild(root);
      //================================================================
      const config = {
        onInspect: (styles) => {
          inspect.innerHTML = `<code>${JSON.stringify(styles)}</code>`
        },
        style: {
          selectionColor: "blue",
          caretColor: "red"
        }
      }
      const styleIt = new StyleIt('editor', config);
//================================================================
      const btns = [
        { text: "toggle class", onclick: () => styleIt.ExecClassName("test") },
        { text: "B", onclick: () => styleIt.ExecCmd("font-weight", "bold", styleIt.Modes.Toggle) },
        { text: "U", onclick: () => styleIt.ExecCmd("text-decoration", "underline", styleIt.Modes.Toggle) },
        { text: "50px", onclick: () => styleIt.ExecCmd("font-size", "50px", styleIt.Modes.Extend) },
        { text: "30px", onclick: () => styleIt.ExecCmd("font-size", "30px", styleIt.Modes.Extend) },
        { text: "Red", onclick: () => styleIt.ExecCmd("color", "red", styleIt.Modes.Extend) },
        { text: "yellow", onclick: () => styleIt.ExecCmd("color", "yellow", styleIt.Modes.Extend) },
        { text: "blue", onclick: () => styleIt.ExecCmd("color", "blue", styleIt.Modes.Extend) },
        { text: "green", onclick: () => styleIt.ExecCmd("color", "green", styleIt.Modes.Extend) },

      ]
      btns.forEach(btn => {
        const _btn = root.addElement('button');
        _btn.onclick = btn.onclick;
        _btn.innerHTML = btn.text;
      });
      root.addElement('div');
      const key = root.addElement('input');
      const value = root.addElement('input');

      const ok = root.addElement('button');
      ok.innerHTML = "go"
      ok.onclick = () => {
        styleIt.ExecCmd(key.value, value.value, styleIt.Modes.Extend);
      }
      
      const inspect = root.addElement('div');
      const save = root.addElement('button');
      save.innerHTML = "Save"
      let savedData;
      save.onclick=()=>{      
        savedData = styleIt.Save();
        inspect.innerHTML = JSON.stringify(savedData);
      }

      const load = root.addElement('button');
      load.innerHTML = "Load"
      load.onclick=()=>{
        if(savedData)
        styleIt.Load(savedData);
      }
    });
  }
  init();
  Element.prototype.addElement = function (type) {
    const element = document.createElement(type);
    this.appendChild(element);
    return element;
  }

})();