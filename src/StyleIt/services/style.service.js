/* eslint max-params: ["error", 4]*/

import { normalizeClassName } from './className.service';
import { useRules } from '../rules/rules';
import { getSelectedElement } from './elements.service';
import { getClosestBlockElement } from './range.service';

export function getStyle(el) {
  if (!el || !el.style) {return {};}
  let styles = {};
  let style = el.getAttribute('style');
  if (style) {
    let collectStyles = style.split(';');
    if (Array.isArray(collectStyles)) {
      collectStyles.forEach(_style => {
        const keyValue = _style.split(':');
        if (keyValue[1] && keyValue[0]) {styles[keyValue[0].trim()] = keyValue[1].trim();}
      });
    }
  }
  return styles;
}

export function normalizeStyle(element) {
  if (!element) {return null;}
  // TODO:review
  const style = element.getAttribute('style');
  if (!style) {
    element.removeAttribute('style');
  } else {
    const collectStyles = getStyle(element);
    for (const key in collectStyles) {
      if (Object.prototype.hasOwnProperty.call(collectStyles, key)) {
        Array.from(element.querySelectorAll(`[style*='${collectStyles[key]}']`)).forEach(el => {
          el.style[key] = null;
          normalizeStyle(el);
        });
      }
    }
  }
}

export function getInheirtCss(fromElement, toElement) {
  let intailStyle = {};
  let currectElement = fromElement;

  while (currectElement && currectElement.ischildOf(toElement.parentElement)) {
    let map = getStyle(currectElement);
    for (const style in map) {
      if (Object.prototype.hasOwnProperty.call(map, style)) {
        const value = map[style];
        // text-decoration  could be twice like underline and strike therough..
        if (!intailStyle[style]) {intailStyle[style] = value;}
      }
    }
    currectElement = currectElement.parentElement;
  }
  return intailStyle;
}
export function removeStyle(element, key, value) {
  element.style[key] = element.style[key].replace(value, '');
  Array.from(element.querySelectorAll(`[style*='${key}']`)).forEach(el => {
    el.style[key] = el.style[key].replace(value, '');
  });
}
// TOGGLE
export function toggleStyle(element, key, value, isOn) {
  if (isOn) {
    element.style[key] = `${element.style[key]} ${value}`;
  } else {
    element.style[key] = element.style[key].replace(value, '');
  }
  normalizeStyle(element);
  normalizeClassName(element);
  Array.from(element.querySelectorAll(`[style*='${value}']`)).forEach(child => {
    child.style[key] = child.style[key].replace(value, '');
    normalizeStyle(child);
    normalizeClassName(child);
  });
}
// EXTEND
// TODO: fix name
export function setStyles(element, jsonStyle) {
  for (const key in jsonStyle) {
    if (Object.prototype.hasOwnProperty.call(jsonStyle, key)) {
      const style = jsonStyle[key];
      element.style[key] = style;
    }
  }
}
// TOGGLE
// TODO: fix name
export function setStyle(element, key, value) {
  element.style[key] = value;
  if (key === 'color') {
    useRules({ element: element, key: 'color', value: value });
  }
  Array.from(element.querySelectorAll(`[style*='${key}']`)).forEach(el => {
    el.style[key] = null;
    normalizeStyle(el);
  });
  // experimental: style the text decorations with color..
  // TODO:review
  // UseRules({element:element,key:key,value:value});
}
export const collectStyleFromSelectedElement = connectecElement => {
  const selectedElement = getSelectedElement();
  if (!selectedElement) {return {};}
  const collectedStyles = getInheirtCss(selectedElement, connectecElement);
  if (selectedElement.closest('u')) {
    collectedStyles.underline = true;
  }
  if (selectedElement.closest('b,strong,bold')) {
    collectedStyles.bold = true;
  }
  if (selectedElement.closest('s')) {
    collectedStyles.lineThrough = true;
  }
  if (selectedElement.closest('i,em')) {
    collectedStyles.italic = true;
  }
  if (selectedElement.closest('mark')) {
    collectedStyles.mark = true;
  }
  return collectedStyles;
};
export function JsonObjectToStyleString(styles) {
  let collectStyles = [];
  for (const key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      const style = styles[key];
      collectStyles.push(`${key}:${style}`);
    }
  }
  return collectStyles.join(';');
}

export function findBlockAndStyleIt(element, key, value) {
  let blockElement = getClosestBlockElement(element);
  if (blockElement) {
    blockElement.style[key] = value;
    Array.from(blockElement.querySelectorAll(`[style*='${key}']`)).forEach(el => el.style[key] = null);
    return true;
  }
  return false;
}
