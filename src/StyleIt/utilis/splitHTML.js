/* eslint no-console: ["error", { allow: ["warn", "error","log"] }] */
import DomUtilis from './DomUtilis';
import { getInheirtCss } from '../services/style.service';
import { getInheirtAttributes } from '../services/attr.service';
import { getInheirtClassNames } from '../services/className.service';

export function splitHTML(fromElement, toElement, options = {}) {
  const {tag = 'span'} = options;
  if (fromElement === toElement) {
    return null;
  }
  if (!fromElement.ischildOf(toElement)) {
    console.log(fromElement, toElement);
    console.error('fromElement must be child of toElement');
    return null;
  }
  if (!DomUtilis.isElement(fromElement) || !DomUtilis.isElement(toElement)) {
    console.error('fromElement && toElement must be dom elements..');
    return null;
  }
  const setAttrs = (_fromElement, _toElement) => {
    const styles = getInheirtCss(_fromElement, _toElement);
    const attrs = getInheirtAttributes(_fromElement, _toElement);
    const className = getInheirtClassNames(_fromElement, _toElement);
    const template = document.createElement(tag);
    template.className = className.join(' ');
    for (const style in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, style)) {
        const value = styles[style];
        template.style[style] = value;
      }
    }
    for (const attr in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, attr)) {
        const value = attrs[attr];
        template.setAttribute(attr, value);
      }
    }
    return template;
  };
  fromElement.createSelection();
  const centerElement = document.getSelectedElement();
  const centerTemplate = setAttrs(centerElement, toElement);
  // center
  centerTemplate.appendChild(fromElement);
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  // left
  range.setStart(toElement, 0);
  const leftElement = document.getSelectedElement();
  const leftTemplate = setAttrs(leftElement, toElement);
  let leftRange = range.extractContents();
  leftTemplate.appendChild(leftRange);
  // right
  range.setEnd(toElement, toElement.childNodes.length);
  const rightElement = document.getSelectedElement();
  const rightTemplate = setAttrs(rightElement, toElement);
  let rightRange = range.extractContents();
  rightTemplate.appendChild(rightRange);
  const split = {
    left: leftTemplate,
    center: centerTemplate,
    right: rightTemplate
  };
  toElement.innerHTML = '';
  for (const el in split) {
    if (Object.prototype.hasOwnProperty.call(split, el)) {
      const element = split[el];
      toElement.appendChild(element);
    }
  }
  toElement.unwrap();
  return split;

}
