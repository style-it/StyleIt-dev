/* eslint no-console: ["error", { allow: ["warn", "error","log"] }] */
/* eslint max-params: ["error", 4]*/
import { block_elments_queryString } from '../constants/block_elms';
import { getSelectedElement } from './elements.service';
import { getCleanText } from './textEditor.service';

export function createInnerWrapperElement(element, options) {
  if (typeof options !== 'object') {options = {};}
  let innerSpan = document.createElement(options.el || 'span');
  Array.from(element.childNodes).forEach(child => innerSpan.appendChild(child));
  element.appendChild(innerSpan);
  return innerSpan;
}
export function getClosestBlockElement(element) {
  if (!element) {
    return null;
  }
  if (element.nodeType !== 1) {
    element = element.parentElement;
  } if (element) {
    const block = element.closest(block_elments_queryString);
    return block;
  }

}

export function getRanges() {
  const sel = window.getSelection();
  return sel.getRangeAt(0);
}

// return all text nodes that are contained within `el`
export function getTextNodes(el) {
  el = el || document.body;

  let doc = el.ownerDocument || document,
    walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false),
    textNodes = [],
    node = walker.nextNode();

  while (node) {
    if (getCleanText(node.textContent)) {textNodes.push(node);}
    node = walker.nextNode();
  }
  return textNodes;
}
export function rangesIntersect(rangeA, rangeB) {
  return rangeA.compareBoundaryPoints(Range.END_TO_START, rangeB) === -1 &&
    rangeA.compareBoundaryPoints(Range.START_TO_END, rangeB) === 1;
}
export function createRangeFromNode(node) {
  let range = node.ownerDocument.createRange();
  try {
    range.selectNode(node);
  } catch (e) {
    range.selectNodeContents(node);
  }
  return range;
}
export function getCaretCharacterOffsetWithin(element) {
  let caretOffset = 0;
  let doc = element.ownerDocument || element.document;
  let win = doc.defaultView || doc.parentWindow;
  let sel;
  if (typeof win.getSelection !== 'undefined') {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      let range = win.getSelection().getRangeAt(0);
      let preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
  } else if ((sel = doc.selection) && sel.type !== 'Control') {
    let textRange = sel.createRange();
    let preCaretTextRange = doc.body.createTextRange();
    preCaretTextRange.moveToElementText(element);
    preCaretTextRange.setEndPoint('EndToEnd', textRange);
    caretOffset = preCaretTextRange.text.length;
  }
  return caretOffset;
}
export function setCaretAt(element, charIndex = 0) {

  let node = element;
  node.focus();
  let textNode = Array.from(node.childNodes).filter(child => child.nodeType === Node.TEXT_NODE);
  if (textNode.length === 0) {
    textNode = element;
    while (textNode && textNode.firstChild && textNode.nodeType !== 3) {
      textNode = textNode.firstChild;
    }
    if (textNode) {
      textNode = [textNode];
    }
  }

  let range = document.createRange();
  range.setStart(textNode[0], charIndex);
  range.setEnd(textNode[0], charIndex);
  range.collapse(true);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

}
export function pasteHtmlAtCaret(html) {
  let node;
  let lastNode;
  const selectedElement = getSelectedElement();
  const contenteditable = selectedElement.closest('[contenteditable]');
  let isValid = true;
  if (contenteditable) {
    if (!contenteditable.isContentEditable) {
      isValid = false;
    }
  } else {
    isValid = false;
  }
  if (!isValid) {
    return null;
  }
  let sel, range;
  if (window.getSelection) {
    // IE9 and non-IE
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.deleteContents();

      // Range.createContextualFragment() would be useful here but is
      // only relatively rece ntly standardized and is not supported in
      // some browsers (IE9, for one)
      let el;
      if (typeof html === 'string') {
        el = document.createElement('div');
        el.innerHTML = html;
        let frag = document.createDocumentFragment();
        do {
          node = el.firstChild;
          if (node) {
            lastNode = frag.appendChild(node);
          }
        }
        while (node);
        range.insertNode(frag);
      } else if (typeof html === 'object') {
        range.insertNode(html);

      }

      // Preserve the selection
      if (lastNode) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }
}
export function rangeIntersectsNode(range, node) {
  if (range.intersectsNode) {
    return range.intersectsNode(node);
  } else {
    return rangesIntersect(range, createRangeFromNode(node));
  }
}
export function isNonEmptyTextNode(node) {
  return node.textContent.length > 0;
}
export function getRangeTextNodes(range) {
  let container = range.commonAncestorContainer,
    nodes = getTextNodes(container.parentNode || container);

  return nodes.filter(node => rangeIntersectsNode(range, node) && isNonEmptyTextNode(node));
}

export function removeElement(el) {
  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }
}
export function replaceNode(replacementNode, node) {
  if (node.parentNode) {
    removeElement(replacementNode);
    node.parentNode.insertBefore(replacementNode, node);
    removeElement(node);
  }
}
export function selectText(node) {
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    console.warn('Could not select text in node: Unsupported browser.');
  }
}
export function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
export function createWrapperFunction(wrapperEl, range) {
  let startNode = range.startContainer,
    endNode = range.endContainer,
    startOffset = range.startOffset,
    endOffset = range.endOffset;

  return function wrapNode(node) {
    let currentRange = document.createRange(),
      currentWrapper = wrapperEl.cloneNode();

    currentRange.selectNodeContents(node);
    if (node === startNode && startNode.nodeType === 3) {
      currentRange.setStart(node, startOffset);
      startNode = currentWrapper;
      startOffset = 0;
    }
    if (node === endNode && endNode.nodeType === 3) {
      currentRange.setEnd(node, endOffset);
      endNode = currentWrapper;
      endOffset = 1;
    }
    currentRange.surroundContents(currentWrapper);
    let parentEl = currentWrapper;
    while (parentEl.textContent === parentEl.parentElement.textContent && parentEl.nodeName === parentEl.parentNode.nodeName) {
      parentEl = parentEl.parentNode;
    }
    if (parentEl !== currentWrapper) {
      currentWrapper.unwrap();
    }
    return parentEl;
  };
}
export const querySelectorUnderSelection = querySelector => {
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  const allSelected = [];

  let commonAncestorContainer = range.commonAncestorContainer;

  if (commonAncestorContainer.nodeType === 3) {
    commonAncestorContainer = commonAncestorContainer.parentElement;
  }
  if (!commonAncestorContainer) {
    return allSelected;
  }
  if (!commonAncestorContainer.isContentEditable) {
    return [];
  }
  const elements = Array.from(commonAncestorContainer.querySelectorAll(querySelector));
  let el;

  for (let i = 0; i < elements.length; i++) {
    el = elements[i];
    // The second parameter says to include the element
    // even if it's not fully selected
    if (selection.containsNode(el, true)) {
      allSelected.push(el);
    }
  }
  if (allSelected.length === 0) {
    const selected = getSelectedElement();
    if (selected) {
      const closestElement = selected.closest(querySelector);
      if (closestElement) {

        allSelected.push(closestElement);
      }
    }
  }
  return allSelected;
};
export function getAllNodes() {
  let nodes, range;
  if (typeof range === 'undefined') {
    // get the current selection if no range is specified
    range = window.getSelection().getRangeAt(0);
  }
  if (range.collapsed) {
    // nothing to wrap

    return [];
  }
  nodes = getRangeTextNodes(range);
  nodes = nodes.map(node => {
    if (node !== null) {
      while (node.nodeType === 3) {
        node = node.parentNode;
      }
      return node;
    }
    return null;
  });
  return nodes;
}
export function wrapRangeText(wrapperEl, range) {
  let nodes, wrapNode;

  if (!range) {
    // get the current selection if no range is specified
    range = window.getSelection().getRangeAt(0);
  }

  if (range.collapsed) {
    const ghostSpan = document.createElement('span');
    ghostSpan.innerHTML = '&#8203;';
    pasteHtmlAtCaret(ghostSpan);
    setCaretAt(ghostSpan);
    // nothing to wrap
    return [ghostSpan];
  }

  if (!wrapperEl) {
    wrapperEl = 'span';
  }

  if (typeof wrapperEl === 'string') {
    // assume it's a tagname
    wrapperEl = document.createElement(wrapperEl);
  }

  wrapNode = createWrapperFunction(wrapperEl, range);
  nodes = getRangeTextNodes(range);
  nodes = nodes.map(wrapNode);

  return nodes;
}
export function wrapRangeWithElement(wrapTag) {
  const ranges = getRanges();
  return wrapRangeText(wrapTag, ranges);

}
export function setSelectionBetweenTwoNodes(firstFlag, lastFlag, options = {}) {
  const _options = { remove: true };
  Object.assign(_options, options);
  document.getSelection().setBaseAndExtent(firstFlag, 0, lastFlag, lastFlag.childNodes.length);
  if (_options.remove) {
    [firstFlag, lastFlag].forEach(e => e.unwrap());
  }
}
export function setSelectionFlags(firstElement, LastElement) {
  if (!firstElement || !LastElement) {
    return;
  }
  const firstFlag = document.createElement('text-selection');
  firstFlag.setAttribute('zero-space', firstElement.textContent.length === 0);
  const lastFlag = document.createElement('text-selection');
  lastFlag.setAttribute('zero-space', LastElement.textContent.length === 0);

  firstElement.prepend(firstFlag); // Set flag the first
  LastElement.appendChild(lastFlag); // Set Flag at last
  return { firstFlag, lastFlag };
}
export function getSelectedHTML() {
  let range;
  if (window.getSelection) {
    let selection = window.getSelection();
    if (selection.focusNode === null) {return;}
    range = selection.getRangeAt(0);
    if (range.collapsed) {
      return;
    }
    let content = range.extractContents();
    return {
      content: content,
      range: range
    };
  }
}
export function saveSelection() {
  if (window.getSelection) {
    let sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) {
    return document.selection.createRange();
  }
  return null;
}
export function restoreSelection(range) {
  if (range) {
    if (window.getSelection) {
      let sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (document.selection && range.select) {
      range.select();
    }
  }
}

// TODO:review
export function wrapRangeWithBlockElement(limitElement) {
  const wrapElementWithBlock = el => {
    let wEl = 'div';
    if (el.nodeName === 'SPAN') {
      wEl = 'p';
    }
    const wrapper = document.createElement(wEl);
    el.wrap(wrapper);
    return wrapper;
  };
  const elements = [];
  let nodes = wrapRangeWithElement();
  nodes.forEach(el => {
    const blockEl = getClosestBlockElement(el);
    if (blockEl) {
      if (blockEl.ischildOf(limitElement)) {
        const founded = elements.find(block => blockEl.ischildOf(block));
        if (!founded) {elements.push(blockEl);}
      } else {
        const _wrapper = wrapElementWithBlock(el);
        elements.push(_wrapper);
      }
    } else {
      const _wrapper = wrapElementWithBlock(el);
      elements.push(_wrapper);

    }
  });
  return {
    nodes: nodes,
    blocks: elements
  };
}
