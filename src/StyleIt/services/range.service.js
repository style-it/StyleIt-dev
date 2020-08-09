//question : should we use class as now or export functions ? 
export class Ranger {

  insertRangeAtDom() {
    const ranges = this.getRanges();
    return ranges.map(r => {
      return this.wrapRangeText(undefined, r);
    }).flat();

  }

  getRanges() {
    let ranges = [];

    const sel = window.getSelection();

    for (let i = 0; i < sel.rangeCount; i++) {
      ranges[i] = sel.getRangeAt(i);
    }
    return ranges;
  }
  // return all text nodes that are contained within `el`
  getTextNodes(el) {
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
  getSelectedElement() {
    var node = document.getSelection();
    if (node !== null) {
      var ancNode = node.anchorNode;
      if (ancNode !== null) {
        while (ancNode.nodeType === 3) {
          ancNode = ancNode.parentNode;
        }
        // const el = (ancNode.nodeType === 3 ? ancNode.parentNode : node);
        return ancNode;
      }
      return null;
    }
  }

  // return true if `rangeA` intersects `rangeB`
  rangesIntersect(rangeA, rangeB) {
    return rangeA.compareBoundaryPoints(Range.END_TO_START, rangeB) === -1 &&
      rangeA.compareBoundaryPoints(Range.START_TO_END, rangeB) === 1
  }

  // create and return a range that selects `node`
  createRangeFromNode(node) {
    var range = node.ownerDocument.createRange()
    try {
      range.selectNode(node)
    } catch (e) {
      range.selectNodeContents(node)
    }
    return range
  }
  setCaretAt(element, charIndex) {
    var node = element;
    node.focus();
    var textNode = Array.from(node.childNodes).filter(child=>child.nodeType === Node.TEXT_NODE);
    
    var caret = charIndex; 
    var range = document.createRange();
    range.setStart(textNode[0], caret);
    range.setEnd(textNode[0], caret);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  pasteHtmlAtCaret(html) {
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
        var el = document.createElement("div");
        el.innerHTML = html;
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
  // return true if `node` is fully or partially selected by `range`
  rangeIntersectsNode(range, node) {
    if (range.intersectsNode) {
      return range.intersectsNode(node)
    } else {
      return this.rangesIntersect(range, this.createRangeFromNode(node))
    }
  }

  // return all non-empty text nodes fully or partially selected by `range`
  getRangeTextNodes(range) {
    var container = range.commonAncestorContainer,
      nodes = this.getTextNodes(container.parentNode || container)

    return nodes.filter((node) => {
      return this.rangeIntersectsNode(range, node) && this.isNonEmptyTextNode(node)
    })
  }

  // returns true if `node` has text content
  isNonEmptyTextNode(node) {
    return node.textContent.length > 0
  }

  // remove `el` from the DOM
  remove(el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }

  // replace `node` with `replacementNode`
  replaceNode(replacementNode, node) {
    if (typeof node.parentNode !== "undefined") {
      this.remove(replacementNode)
      node.parentNode.insertBefore(replacementNode, node)
      this.remove(node)
    }
  }
  selectText(node) {
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
  insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  // create a node wrapper function
  createWrapperFunction(wrapperEl, range) {
    var startNode = range.startContainer,
      endNode = range.endContainer,
      startOffset = range.startOffset,
      endOffset = range.endOffset

    return function wrapNode(node) {
      var currentRange = document.createRange(),
        currentWrapper = wrapperEl.cloneNode()

      currentRange.selectNodeContents(node)
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
  getAllNodes() {
    var nodes, range;
    if (typeof range === 'undefined') {
      // get the current selection if no range is specified
      range = window.getSelection().getRangeAt(0)
    }
    if (range.isCollapsed) {
      // nothing to wrap
      return []
    }
    nodes = this.getRangeTextNodes(range)
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
  wrapRangeText(wrapperEl, range) {
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

    wrapNode = this.createWrapperFunction(wrapperEl, range)

    nodes = this.getRangeTextNodes(range)
    nodes = nodes.map(wrapNode)

    return nodes
  }
  setSelectionBetweenTwoNodes(firstFlag, lastFlag) {
    document.getSelection().setBaseAndExtent(firstFlag, 0, lastFlag, lastFlag.childNodes.length);
    [firstFlag, lastFlag].forEach(e => e.unwrap());
  }
  setSelectionFlags(firstElement, LastElement) {
    const firstFlag = document.createElement('text-selection');
    const lastFlag = document.createElement('text-selection');
    firstElement.prepend(firstFlag); //Set flag the first
    LastElement.appendChild(lastFlag); //Set Flag at last
    return { firstFlag, lastFlag };
  }
  getSelectedHTML() {
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
  saveSelection() {
    if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        return sel.getRangeAt(0);
      }
    } else if (document.selection && document.selection.createRange) {
      return document.selection.createRange();
    }
    return null;
  }
  restoreSelection(range) {
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
}
