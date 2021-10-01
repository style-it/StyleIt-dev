import { wrapNakedTextNodes } from '../elements.service';
import { getClosestBlockElement, insertAfter, pasteHtmlAtCaret, setCaretAt } from '../range.service';
import { void_elements } from '../../constants/void_elms';
import { getCleanText } from '../textEditor.service';

export default class KeyPress {

  constructor(target, options = {}) {
    if (!target) {
      return null;
    }
    this.target = target;
    this.target.addEventListener('keydown', this.onDefaultKeyPress);
    if (options.plugins && typeof options.plugins.keyPress === 'boolean' && options.plugins.keyPress === false) {
      return;
    }
    if (typeof options.onKeyPress === 'function') {
      this.onKeyPress = options.onKeyPress;
    }
    this.keypress = e => {
      if (e.keyCode === 8) {
        const _target = e.target;
        if (getCleanText(_target.textContent) === '') {
          e.preventDefault();
          return;
        }
      } else if (e.keyCode === 13) {
        if (e.shiftKey) {
          pasteHtmlAtCaret('</br>&#8203;');
          e.preventDefault();
          return;
        }

        const range = document.createRange();
        const selection = window.getSelection();
        let blockElement = getClosestBlockElement(selection.anchorNode);

        if (blockElement === this.target || !blockElement) {
          return false;
        }
        const range2extract = selection.getRangeAt(0);
        range2extract.extractContents();
        range.setStart(selection.anchorNode, selection.anchorOffset);
        range.setEnd(blockElement, blockElement.childNodes.length);
        selection.removeAllRanges();
        selection.addRange(range);
        if (selection.isCollapsed) {
          if (blockElement && !this.target.textContent.trim()) {
            if (blockElement !== this.target) {
              Array.from(this.target.children).forEach(c => {
                if (c !== blockElement && !c.textContent.trim()) {
                  c.unwrap();
                }
              });
              blockElement.innerHTML = `${blockElement.innerHTML}&#8203;`;
              setCaretAt(blockElement);
              e.preventDefault();
            }
          }
          return false;
        } else {
          e.preventDefault();
        }

        const docFragment = range.extractContents();
        Array.from(docFragment.children).forEach(child => {
          if (child.nodeType === 1 && !child.textContent.trim() && !void_elements[child.nodeName]) {
            child.unwrap();
          }
        });

        const el = document.createElement(blockElement.nodeName || 'p');
        el.appendChild(docFragment);
        if (!el.textContent.trim()) {
          el.innerHTML = '&#8203;';
        }
        insertAfter(el, blockElement);
        Array.from(el.previousSibling.attributes).forEach(attr => {
          el.setAttribute(attr.name, attr.value);
        });

        const br = document.createElement('br');
        blockElement.appendChild(br);

        selection.removeAllRanges();
        wrapNakedTextNodes(this.target, { expect: blockElement });
        setCaretAt(el, 0);
      }
      if (typeof this.onKeyPress === 'function') {
        this.onKeyPress(e);
      }
    };

    this.target.addEventListener('keydown', this.keypress);

    this.destroy = () => {
      if (this.target) {
        this.target.addEventListener('keydown', this.onDefaultKeyPress);
        this.target.removeEventListener('keydown', this.keypress);
        this.target = null;
      }
    };
  }
  onDefaultKeyPress(e) {
    const key = e.key;
    if (key === "ArrowLeft" || key === "ArrowRight") {
      const removeZeroWidthOnDetected = (textNode) =>{
        console.log(textNode.textContent.indexOf('​') !== -1, textNode.nextSibling && textNode.nextSibling.textContent.indexOf('​') !== -1);
        if(textNode.nodeType === 3 && textNode.textContent.indexOf('​') !== -1 && !getCleanText(textNode.textContent)){
          textNode.textContent = "";
        }
      }
      const getSelectionStart = () => {
        return document.getSelection().anchorNode;
      }
      let selectedNode = getSelectionStart();
      removeZeroWidthOnDetected(selectedNode);
      if(selectedNode.nextSibling && selectedNode.nextSibling.nodeType === 1 && selectedNode.nextSibling.firstChild && selectedNode.nextSibling.firstChild.nodeType === 3){
        removeZeroWidthOnDetected(selectedNode.nextSibling.firstChild);
      }
    }
  }
}
