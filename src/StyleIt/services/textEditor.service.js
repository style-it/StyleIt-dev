import { normalizeClassName } from './className.service';
import { normalizeStyle } from './style.service';
import { mergeNodeContect, mergeTwoNodes } from '../utilis/merger';
import { inline_elements } from '../constants/inline_elems';

export function isEmptyTextNode(text) {
  return text.trim().replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u200f/g, '');
}
export function getCleanText(text) {
  return text.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
}

export function normalizeElement(el) {
  if (!el) {return;}
  if (!el.isContentEditable) {
    return;
  }
  function _normalize(element) {
    element.normalize();
    normalizeClassName(element);
    normalizeStyle(element);
    if (element && inline_elements[element.nodeName] && !isEmptyTextNode(element.textContent)) {
      element.unwrap();
      return null;
    }
    if (element && element.nodeName === 'SPAN' && element.attributes.length === 0) {
      element.unwrap();
      return null;
    }
    // if (element && inline_elements[element.nodeName] && element.parentElement && element.parentElement.__closest(element.nodeName)) {
    //   element.unwrap();
    //   return null;
    // }
    return element;
  }
  const recurse = element => {
    Array.from(element.children).forEach(child => {
      recurse(child);
      _normalize(child);
    });
    const mergeNodesStyles = _element => {
      let merged = false;
      Array.from(_element.children).forEach(child => {
        let wrapper = child;
        while (wrapper !== null) {
          const nextElement = wrapper.nextSibling;
          if (!nextElement) {
            break;
          }
          wrapper = mergeTwoNodes(wrapper, nextElement);
          merged = merged || wrapper !== null;
        }
      });
      return merged;
    };

    const mergeNodesContent = _element => {
      let merged = false;
      Array.from(_element.children).forEach(child => {
        let wrapper = child;
        while (wrapper && wrapper.nodeType === 1) {
          wrapper = mergeNodeContect(wrapper);
          merged = merged || wrapper !== null;
        }
      });
      return merged;
    };
    let mergedStyles = false;
    let mergedContent = false;
    do {
      element = _normalize(element);
      if (element) {
        mergedStyles = mergeNodesStyles(element);
        mergedContent = mergeNodesContent(element);
      }

    } while (mergedContent && element);
  };
  recurse(el);
}

export function removeZeroSpace(textNodes) {
  if (!Array.isArray(textNodes)) {
    textNodes = [textNodes];
  }
  textNodes.forEach(el => {
    if (el.nodeType === Node.TEXT_NODE && el.parentElement && el.parentElement.nodeName !== 'TEXT-SELECTION') {
      el.textContent = el.textContent.replace(/\u200B/g, '');
    }
  });
}
