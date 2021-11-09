/* eslint consistent-this: ["error", "that"]*/
import { block_elments } from '../constants/block_elms';

class DomUtilis {

  isElement(obj) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return typeof obj === 'object' &&
        obj.nodeType === 1 && typeof obj.style === 'object' &&
        typeof obj.ownerDocument === 'object';
    }
  }

  wrap(el, wrapper) {
    // el should be array
    let elements = [];
    if (Array.isArray(el)) {
      elements = el;
    } else {
      elements = [el];
    }

    const parents = elements.map(e => e.parentNode);
    let parentsDiff = parents.filter((p, _, self) => self[0] !== p);
    if (parentsDiff.length !== 0) {
      return;
    }
    parents[0].insertBefore(wrapper, elements[0]);
    elements.forEach(_el => wrapper.appendChild(_el));

    return true;
  }
}
export default new DomUtilis();

Document.prototype.getSelectedElement = function () {
  let e = document.getSelection();
  if (e !== null) {
    let t = e.anchorNode;
    if (t !== null) {
      for (; t.nodeType === 3;) {t = t.parentNode;} return t;
    } return null;
  }
};
Element.prototype.wrap = wrapper => {
  if (typeof wrapper === 'string') {wrapper = document.createElement(wrapper);}
  this.parentNode.insertBefore(wrapper, this);
  wrapper.appendChild(this);
  return wrapper;
};
function _createSelection() {
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(this);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
Element.prototype.createSelection = _createSelection;
Text.prototype.createSelection = _createSelection;
Element.prototype.__closest = function (s) {
  let that;
  that = this;
  if (!document.documentElement.contains(that)) {return null;}
  do {
    if (that.matches(s) && that.isContentEditable && !block_elments[that.nodeName]) {
      return that;
    }
    if (that.parentElement && block_elments[that.parentElement.nodeName]) {
      return null;
    }
    // eslint-disable-next-line consistent-this
    that = that.parentElement.isContentEditable ? that.parentElement : null;
  } while (that !== null);
  return null;

};
Element.prototype.ischildOf = function (parent) {
  if (!parent) {return false;}
  let node = this.parentNode;
  while (node != null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};
const _wrap = function (wrapper) {
  if (!this.parentNode) {return false;}
  this.parentNode.insertBefore(wrapper, this);
  wrapper.appendChild(this);
  return wrapper;
};
Text.prototype.wrap = _wrap;
Element.prototype.wrap = _wrap;
Element.prototype.insertAfter = function (newNode) {
  this.parentNode.insertBefore(newNode, this.nextSibling);
};
Element.prototype.replaceNode = function (replacementNode) {
  if (this.parentNode) {
    this.parentNode.insertBefore(replacementNode, this);
    this.remove();
    return replacementNode;
  }
};
Element.prototype.unwrap = function () {
  const range = document.createRange();
  range.selectNodeContents(this);
  const extraContents = range.extractContents();
  this.replaceNode(extraContents);
  return extraContents;
};
