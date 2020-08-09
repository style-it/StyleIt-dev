class Ranger {

    // return all text nodes that are contained within `el`
    getTextNodes(el) {
      el = el || document.body
  
      var doc = el.ownerDocument || document,
        walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false),
        textNodes = [],
        node
  
      while (node = walker.nextNode()) {
        textNodes.push(node)
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
    getEverything(el) {
      el = el || document.body
      var doc = el.ownerDocument || document,
        walker = doc.createTreeWalker(el, NodeFilter.SHOW_ALL, null, false),
        textNodes = [],
        node;
      var index = 0;
      while (node = walker.nextNode()) {
        if (textNodes) {
          if (node.parentElement) {
            var prevParent = textNodes[(index - 1) === 0 ? 0: index];
            if(prevParent){
              if (!this.ischildOf(prevParent,node)) {
                textNodes.push(node);
              }
            }
          } else {
            textNodes.push(node);
            index++;
          }
        }
      }
      return textNodes
    }
    ischildOf(parent, child) {
      let node = child.parentNode;
      while (node != null) {
        if (node == parent) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
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
  getSelectionCoords() {
    var doc = window.document;
    var sel = doc.selection,
        range, rects, rect;
    var x = 0,
        y = 0;
    if (sel) {
        if (sel.type != "Control") {
            range = sel.createRange();
            range.collapse(true);
            x = range.boundingLeft;
            y = range.boundingTop;
        }
    } else if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0).cloneRange();
            if (range.getClientRects) {
                range.collapse(true);
                rects = range.getClientRects();
                if (rects.length > 0) {
                    rect = rects[0];
                }
                x = rect.left;
                y = rect.top;
            }
            // Fall back to inserting a temporary element
            if (x == 0 && y == 0) {
                var span = doc.createElement("span");
                if (span.getClientRects) {
                    // Ensure span has dimensions and position by
                    // adding a zero-width space character
                    span.appendChild(doc.createTextNode("\u200b"));
                    range.insertNode(span);
                    rect = span.getClientRects()[0];
                    x = rect.left;
                    y = rect.top;
                    var spanParent = span.parentNode;
                    spanParent.removeChild(span);
  
                    // Glue any broken text nodes back together
                    spanParent.normalize();
                }
            }
        }
    }
    return {
        x: x,
        y: y
    };
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
  
  // unwrap `el` by replacing itself with its contents
  unwrap(el) {
    if(!el) return;
    var range = document.createRange()
    range.selectNodeContents(el)
    var extraContents = range.extractContents();
    this.replaceNode(extraContents, el)
    return extraContents;
  
  }
  
  
  
  // undo the effect of `wrapRangeText`, given a resulting array of wrapper `nodes`
  undo(nodes) {
    nodes.forEach(function (node) {
      var parent = node.parentNode
      unwrap(node)
      parent.normalize();
    })
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
  wrap(el, wrapper)   {
    if(typeof wrapper === "string") wrapper = document.createElement(wrapper);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    return wrapper;
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
        endNode = currentWrapper
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
    });
    return nodes
  }
  wrapRangeText(wrapperEl, range) {
    var nodes, wrapNode, wrapperObj = {}
  
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
      wrapperEl = document.createElement(wrapperEl)
    }
  
    wrapNode = this.createWrapperFunction(wrapperEl, range)
  
    nodes = this.getRangeTextNodes(range)
    nodes = nodes.map(wrapNode)
  
    wrapperObj.nodes = nodes
    wrapperObj.unwrap = function () {
      if (this.nodes.length) {
        undo(this.nodes)
        this.nodes = []
      }
    }
    return wrapperObj
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
