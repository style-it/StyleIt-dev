import DomUtilis from './DomUtilis';
import { getStyle, normalizeStyle } from '../services/style.service';
import { getClasses, normalizeClassName } from '../services/className.service';
import { getAttributes } from '../services/attr.service';
import { normalizeElement } from '../services/textEditor.service';
import { inline_elements } from '../constants/inline_elems';

/**
 *  * Returns the new merge element
 * @param {Element} DomElement - element to merge with his first child
 */
export const mergeNodeContect = node => {

  if (!DomUtilis.isElement(node)) {
    // console.error('one of the props is not dom element.., please insert two element to merge..');
    return null;
  }
  if (!inline_elements[node.nodeName] || node.nodeType !== Node.ELEMENT_NODE) {
    // console.error('[mergeNodeContect] node is not a span');
    return null;
  }
  let commonTag = node.nodeName;

  const firstChild = node.firstElementChild;
  if (!firstChild) {
    // console.error('[mergeNodeContect] first child not found');
    return null;
  }
  if (firstChild.nodeName !== commonTag || firstChild.nodeType !== Node.ELEMENT_NODE) {
    // console.error('[mergeNodeContect] firstChild is not a span');
    return null;
  }
  if (node.textContent !== firstChild.textContent) {
    // console.error('[mergeNodeContect] text content is different');
    return null;
  }
  const _elementProps = {
    style: getStyle(node),
    classes: getClasses(node),
    attrs: getAttributes(node)
  };
  for (const style in _elementProps.style) {
    if (Object.prototype.hasOwnProperty.call(_elementProps.style, style)) {
      const styleValue = _elementProps.style[style];
      firstChild.style[style] = `${firstChild.style[style]} ${styleValue}`.trim();
    }

  }
  normalizeStyle(firstChild);
  for (const attr in _elementProps.attrs) {
    if (Object.prototype.hasOwnProperty.call(_elementProps.attrs, attr)) {
      const attrValue = _elementProps.attrs[attr];
      firstChild.setAttribute(attr, attrValue);
    }

  }
  firstChild.classList.add(..._elementProps.classes);
  normalizeClassName(firstChild);
  if (firstChild.parentElement) { firstChild.parentElement.unwrap(); }
  return firstChild;
};
export function mergeTwoNodes(elementOne, elementTwo) {
  let tag;
  if (!DomUtilis.isElement(elementOne) || !DomUtilis.isElement(elementTwo)) {
    // console.error('one of the props is not dom element.., please insert two element to merge..');
    return null;
  }
  if (!inline_elements[elementOne.nodeName]) {
    return null;
  }
  tag = elementOne.nodeName;
  if (elementOne.nodeName !== elementTwo.nodeName) {
    // console.error('one of the props is not dom element.., please insert two element to merge..');
    return null;
  }
  const _elementsData = [{
    style: getStyle(elementOne),
    classes: getClasses(elementOne),
    attrs: getAttributes(elementOne)
  },
  {
    style: getStyle(elementTwo),
    classes: getClasses(elementTwo),
    attrs: getAttributes(elementTwo)
  }];
  const getCommonClasses = (classes1, classes2) => {
    if (!classes1 || !classes2) { return []; }
    const c1 = [...classes1];
    const c2 = [...classes2];
    return c1.filter(c => c2.includes(c));
  };
  const getCommonStyles = (style1, style2) => {
    const commmonStyles = {};
    for (const s in style1) {
      if (!style2[s]) { continue; }

      const style1Values = style1[s];
      const style2Values = style2[s];
      if (style2Values === style1Values) {
        commmonStyles[s] = style2Values;
      }
    }
    return commmonStyles;
  };
  const collectedAttrs = {};
  let isShouldBeWrapped = true;
  for (const attr in _elementsData[0].attrs) {
    if (Object.prototype.hasOwnProperty.call(_elementsData[0].attrs, attr)) {
      const firstAttrValue = _elementsData[0].attrs[attr];
      const SecAttrValue = _elementsData[1].attrs[attr];
      if (firstAttrValue !== SecAttrValue) {
        isShouldBeWrapped = false;
        break;
      }
      collectedAttrs[attr] = firstAttrValue;
    }
  }
  if (!isShouldBeWrapped) {
    return null;
  }
  const commoncLasses = getCommonClasses(_elementsData[0].classes, _elementsData[1].classes);
  const commonStyles = getCommonStyles(_elementsData[0].style, _elementsData[1].style);
  const buildWrappingElement = (_commonStyles, _commoncLasses, _collectedAttrs) => {
    const wrapper = document.createElement(tag);

    for (const key in _collectedAttrs) {
      if (Object.hasOwnProperty.call(_collectedAttrs, key)) {
        const value = _collectedAttrs[key];
        wrapper.setAttribute(key, value);
      }
    }
    // handle styles
    for (const s in _commonStyles) {
      if (Object.prototype.hasOwnProperty.call(_commonStyles, s)) {
        wrapper.style[s] = _commonStyles[s];
      }
    }

    // handle classes
    if (_commoncLasses.length > 0) {
      wrapper.classList.add(..._commoncLasses);
    }
    if (wrapper.nodeName === 'SPAN' && wrapper.attributes.length === 0) {
      wrapper.unwrap();
      return null;
    } else {
      wrapper.normalize();
    }
    return wrapper;
  };
  const wrapper = buildWrappingElement(commonStyles, commoncLasses, collectedAttrs);
  if (!wrapper) {
    // console.error('wrapper is null')
    return null;
  }
  const clearElementClasses = (node, _commoncLasses) => {
    node.classList.remove(..._commoncLasses);
    normalizeClassName(node);
  };
  const clearElementStyles = (node, _commonStyles) => {
    for (const s in _commonStyles) {
      if (Object.prototype.hasOwnProperty.call(_commonStyles, s)) {
        node.style[s] = null;
      }
    }
  };
  const clearAttrs = (node, attrs) => {
    for (const key in attrs) {
      if (Object.hasOwnProperty.call(attrs, key)) {
        node.removeAttribute(key);
      }
    }
  };
  const elements = [elementOne, elementTwo];
  elements.forEach(e => {
    clearElementClasses(e, commoncLasses);
    clearElementStyles(e, commonStyles);
    clearAttrs(e, collectedAttrs);
  });

  DomUtilis.wrap(elements, wrapper);
  elements.forEach(el => el.unwrap());
  [...wrapper.children].forEach(c => {
    normalizeElement(c);
  });
  return wrapper;
}

export function mergeCommonValuesObject(obj1, obj2) {
  let commonValues = {};
  for (const key in obj1) {
    if (obj2[key] && obj2[key] === obj1[key]) {
      commonValues[key] = obj1[key];
    }
  }
  return commonValues;
}

export function mergeCommonArrays(arr1, arr2) {
  const mergeArr = [];
  Array.from(arr1).forEach(item => {
    if (arr2.findIndex(i => i === item) > 0) {
      mergeArr.push(item);
    }
  });
  return mergeArr;
}
