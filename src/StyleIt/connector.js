/* eslint no-console: ["error", { allow: ["warn", "error","log"] }] */
import DomUtilis from './utilis/DomUtilis';
import CopyPaste from './services/copyPaste/copyPaste.service';
import Inpsector from './services/Inspector/Inspector.service';
import KeyPress from './services/keyPress/KeyPress';
import { wrapNakedTextNodes } from './services/elements.service';
import { normalizeElement } from './services/textEditor.service';

// TODO:review
export default class Connector {

  connect(element, options) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
      if (!element) {
        // TODO: use the validator
        console.error('[-] =>target should be element id or dom element..');
        return null;
      }
    }
    if (DomUtilis.isElement(element)) {
      if (document.execCommand) {
        document.execCommand('defaultParagraphSeparator', false, 'p');
        document.execCommand('styleWithCSS', true, null);
      }
    } else {
      // TODO: use the validator
      console.error('[-] =>connectWith should be element id or dom element..');
      return null;
    }
    const usePlugins = (_element, _options) => ({
      copyPaste: new CopyPaste(_element, _options),
      inspector: new Inpsector(_element, _options.onInspect),
      keyPress: new KeyPress(_element, _options)
    });

    Array.from(element.querySelectorAll('[contenteditable]')).forEach(editable => {
      wrapNakedTextNodes(editable);
      normalizeElement(editable);
    });

    this.createDefaultStyle();
    this.plugins = usePlugins(element, options);
    return element;
  }
  createDefaultStyle() {
    const style = document.createElement('style');
    style.innerHTML = `
            [contenteditable]{
                min-height:10px;
            }
            `;
    document.head.appendChild(style);
  }

  // TODO: destory events..
  destroy() {
    for (const key in this.plugins) {
      if (Object.prototype.hasOwnProperty.call(this.plugins, key)) {
        const plugin = this.plugins[key];
        if (plugin.destroy) {
          plugin.destroy();
        }
      }
    }
  }
}

