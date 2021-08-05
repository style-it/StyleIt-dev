// class and style not includes yet..
export function getInheirtAttributes(fromElement, toElement) {
  let attributes = {};
  let currectElement = fromElement;
  while (currectElement && currectElement.ischildOf(toElement.parentElement)) {
    let attrs = currectElement.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      if (attrs[i].name !== 'class' && attrs[i].name !== 'style') {
        if (!attributes[attrs[i].name]) {
          attributes[attrs[i].name] = attrs[i].value;
        }
      }
    }
    currectElement = currectElement.parentElement;
  }
  return attributes;
}
export function getAttributes(element, getAll) {
  let attributes = {};
  let attrs = element.attributes;
  for (let i = attrs.length - 1; i >= 0; i--) {
    if (getAll || !getAll && attrs[i].name !== 'class' && attrs[i].name !== 'style') {
      if (!attributes[attrs[i].name]) {
        attributes[attrs[i].name] = attrs[i].value;
      }
    }
  }
  return attributes;
}
export function removeAllAttrs(element) {
  if (element && !element.attributes) {
    console.error('element not have attributes..');
    return null;
  }
  Array.from(element.attributes).forEach(attr => element.removeAttribute(attr.nodeName));
}
