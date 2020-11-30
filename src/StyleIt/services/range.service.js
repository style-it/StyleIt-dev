
export function createInnerWrapperElement(element, options) {
  if (typeof (options) !== "object") options = {};
  let innerSpan = document.createElement(options.el || "span");
  Array.from(element.childNodes).forEach(child => innerSpan.appendChild(child));
  element.appendChild(innerSpan);
  return innerSpan;
}
export function GetClosestBlockElement(element) {
  if (window.getComputedStyle(element).display === "block") return element;
  let parentElement = element.parentElement;
  while (parentElement && window.getComputedStyle(parentElement).display !== "block") {
    if (parentElement.parentElement) {
      parentElement = parentElement.parentElement;
    } else {
      break;
    }
  }
  return parentElement;
}
//TODO:review
  export function wrapRangeWithBlockElement(limitElement) {
    const wrapElementWithBlock = (el) =>{
      let wEl = "div";
      if(el.nodeName === "SPAN"){
        wEl = "p";
      }
      const wrapper = document.createElement(wEl);
      el.wrap(wrapper);
      return wrapper;
    }
    const elements = [];
    let nodes = wrapRangeWithElement();
    nodes.forEach(el => {
      const blockEl = GetClosestBlockElement(el);
      if (blockEl) {
        if( blockEl.ischildOf(limitElement)){
          const founded = elements.find(block=>blockEl.ischildOf(block));
          if(!founded)
          elements.push(blockEl);
        }else{
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
    }
    return elements;
  }
  export function wrapRangeWithElement(wrapTag) {
    const ranges = getRanges();
    return ranges.map(r => {
      return wrapRangeText(wrapTag, r);
    }).flat();
  }
  export function getRanges() {
    let ranges = [];

    const sel = window.getSelection();

    for (let i = 0; i < sel.rangeCount; i++) {
      ranges[i] = sel.getRangeAt(i);
    }
    return ranges;
  }
  // return all text nodes that are contained within `el`
  export function getTextNodes(el) {
    el = el || document.body

    var doc = el.ownerDocument || document,
      walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false),
      textNodes = [],
      node = walker.nextNode();

    while (node) {
      textNodes.push(node);
      node = walker.nextNode();
    }
    return textNodes
  }
  export function rangesIntersect(rangeA, rangeB) {
    return rangeA.compareBoundaryPoints(Range.END_TO_START, rangeB) === -1 &&
      rangeA.compareBoundaryPoints(Range.START_TO_END, rangeB) === 1
  }
  export function createRangeFromNode(node) {
    var range = node.ownerDocument.createRange()
    try {
      range.selectNode(node)
    } catch (e) {
      range.selectNodeContents(node)
    }
    return range
  }
  export function getCaretCharacterOffsetWithin(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
      sel = win.getSelection();
      if (sel.rangeCount > 0) {
        var range = win.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }
    } else if ((sel = doc.selection) && sel.type != "Control") {
      var textRange = sel.createRange();
      var preCaretTextRange = doc.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint("EndToEnd", textRange);
      caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
  }
  export function setCaretAt(element, charIndex) {
    var node = element;
    node.focus();
    var textNode = Array.from(node.childNodes).filter(child => child.nodeType === Node.TEXT_NODE);
    var range = document.createRange();
    range.setStart(textNode[0], charIndex);
    range.setEnd(textNode[0], charIndex);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  export function pasteHtmlAtCaret(html) {
    var sel, range;
    if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        // Range.createContextualFragment() would be useful here but is
        // only relatively recently standardized and is not supported in
        // some browsers (IE9, for one)
        let el;
        if (typeof (html) === "string") {
          el = document.createElement("div");
          el.innerHTML = html;
        }
        else if (typeof (html) === "object") {
          el = html;
        }

        var frag = document.createDocumentFragment(), node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);

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
      return range.intersectsNode(node)
    } else {
      return rangesIntersect(range, createRangeFromNode(node))
    }
  }
  export function getRangeTextNodes(range) {
    var container = range.commonAncestorContainer,
      nodes = getTextNodes(container.parentNode || container)

    return nodes.filter((node) => {
      return rangeIntersectsNode(range, node) && isNonEmptyTextNode(node)
    })
  }
  export function isNonEmptyTextNode(node) {
    return node.textContent.length > 0
  }
  export function removeElement(el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
  export function replaceNode(replacementNode, node) {
    if (typeof node.parentNode !== "undefined") {
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
      console.warn("Could not select text in node: Unsupported browser.");
    }
  }
  export function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
  export function createWrapperFunction(wrapperEl, range) {
    var startNode = range.startContainer,
      endNode = range.endContainer,
      startOffset = range.startOffset,
      endOffset = range.endOffset

    return function wrapNode(node) {
      var currentRange = document.createRange(),
        currentWrapper = wrapperEl.cloneNode()

      currentRange.selectNodeContents(node);
      if (node === startNode && startNode.nodeType === 3) {
        currentRange.setStart(node, startOffset)
        startNode = currentWrapper
        startOffset = 0
      }
      if (node === endNode && endNode.nodeType === 3) {
        currentRange.setEnd(node, endOffset)
        endNode = currentWrapper;
        endOffset = 1
      }
      currentRange.surroundContents(currentWrapper)
      return currentWrapper
    }
  }
  export function getAllNodes() {
    var nodes, range;
    if (typeof range === 'undefined') {
      // get the current selection if no range is specified
      range = window.getSelection().getRangeAt(0)
    }
    if (range.isCollapsed) {
      // nothing to wrap
      return []
    }
    nodes = getRangeTextNodes(range)
    nodes = nodes.map(node => {
      if (node !== null) {
        while (node.nodeType === 3) {
          node = node.parentNode;
        }
        return node;
      }
      return null;
    });
    return nodes
  }
  export function wrapRangeText(wrapperEl, range) {
    var nodes, wrapNode;

    if (typeof range === 'undefined') {
      // get the current selection if no range is specified
      range = window.getSelection().getRangeAt(0)
    }

    if (range.isCollapsed) {
      // nothing to wrap
      return []
    }

    if (typeof wrapperEl === 'undefined') {
      wrapperEl = 'span'
    }

    if (typeof wrapperEl === 'string') {
      // assume it's a tagname
      wrapperEl = document.createElement(wrapperEl);
    }

    wrapNode = createWrapperFunction(wrapperEl, range)

    nodes = getRangeTextNodes(range)

    nodes = nodes.map(wrapNode);
    return nodes
  }
  export function setSelectionBetweenTwoNodes(firstFlag, lastFlag,options = {}) {
     const _options = {remove:true};
     Object.assign(_options,options);
        document.getSelection().setBaseAndExtent(firstFlag, 0, lastFlag, lastFlag.childNodes.length);
        if(_options.remove){
          [firstFlag, lastFlag].forEach(e => e.unwrap());
        }
  }
  export function setSelectionFlags(firstElement, LastElement) {
    const selection = window.getSelection();
    const firstFlag = document.createElement('text-selection');
    firstFlag.setAttribute('zero-space', firstElement.textContent.length === 0)
    const lastFlag = document.createElement('text-selection');
    lastFlag.setAttribute('zero-space', LastElement.textContent.length === 0)

    firstElement.prepend(firstFlag); //Set flag the first
    LastElement.appendChild(lastFlag); //Set Flag at last
    return { firstFlag, lastFlag };
  }
  export function getSelectedHTML() {
    var range;
    if (window.getSelection) {
      var selection = window.getSelection();
      if (selection.focusNode === null) return;
      range = selection.getRangeAt(0);
      if (range.collapsed) {
        return;
      }
      var content = range.extractContents();
      return {
        content: content,
        range: range
      }
    }
  }
  export function saveSelection() {
    if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        return sel.getRangeAt(0);
      }
    } else if (document.selection && document.selection.createRange) {
      return document.selection.createRange();
    }
    return null;
  };
  export function restoreSelection(range) {
    if (range) {
      if (window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.selection && range.select) {
        range.select();
      }
    }
  }


