/* eslint no-console: ["error", { allow: ["warn", "error","log"] }] */
/* eslint max-params: ["error", 4]*/
import {
  wrapRangeWithElement,
  setSelectionFlags,
  setSelectionBetweenTwoNodes,
  createInnerWrapperElement,
  getClosestBlockElement,
  querySelectorUnderSelection
} from './services/range.service';
import Modes from './constants/Modes.json';
import { setStyle, toggleStyle, collectStyleFromSelectedElement, findBlockAndStyleIt } from './services/style.service';
import { normalizeElement } from './services/textEditor.service';
import Connector from './connector';
import './components/custom/textSelected';
import { elementToJson, jsonToElement, getSelectedElement, wrapNakedTextNodes } from './services/elements.service';
import { EVENTS } from './services/events/events';
import { createTempLinkElement, resetURL, TARGETS } from './services/link.service';
import { void_elements } from './constants/void_elms';
import { block_elments, block_elments_queryString } from './constants/block_elms';
import { inline_elements, inline_elemets_arr } from './constants/inline_elems';
import spliterHtml from 'spliter-html';
export default class Core {

  // *target => can be Id of Element that should contain Editor instance or the element itself..
  // *config =>  configuration passed t   o Tool constructor
  // TODO: add target validations..;
  constructor(target, config) {
    this.__config = {
      onInspect: void 0
    };

    this.on = (key, callback) => {
      if (typeof key !== 'string') {
        console.error('key must be a string..');
      }
      if (typeof callback !== 'function') {
        console.error('callback must be a function..');
      }
      EVENTS[key] = callback;
    };
    this.Connector = new Connector();
    this.modeHandlers = {
      [Modes.Toggle]: (v, key, value, options) => this.onToggle(v, key, value, options),
      [Modes.Extend]: (v, key, value, options) => this.onExtend(v, key, value, options)
    };
    this.config = config ? Object.assign(this.__config, config) : this.__config;
    this.events = {
      styleChanged: this.config.onInspect
    };
    this.connectedElement = this.Connector.connect(target, this.config);
  }
  save(element) {
    return elementToJson(element || this.connectedElement);
  }
  load(json) {
    return jsonToElement(json, this.connectedElement);
  }
  destroy() {
    this.Connector.destroy();
    const that = this;
    for (const key in that) {
      if (Object.prototype.hasOwnProperty.call(that, key)) {
        that[key] = null;
        delete that[key];
      }

    }
  }
  // TODO: review.
  // TODO: Create normalize..
  // question: if text was selected, should we unwrap the selectiion only ?
  unLink() {
    if (!this.isValid()) {
      return;
    }
    const selection = window.getSelection();

    if (selection && !selection.toString()) {
      let elementToUnwrap;
      const baseNode = selection.baseNode;
      if (baseNode && baseNode.nodeType === 3 && baseNode.parentElement) {
        elementToUnwrap = baseNode.parentElement.__closest('a');
      }
      if (baseNode && baseNode.nodeType === 1) {
        elementToUnwrap = elementToUnwrap.__closest('a');
      }
      if (elementToUnwrap) {
        elementToUnwrap.unwrap();
      }
      return null;
    }
    const wrappedEls = wrapRangeWithElement();
    Array.from(wrappedEls).forEach(r => {
      const closestATag = r.__closest('a');
      if (closestATag) {
        let a = spliterHtml(r, closestATag, {
          tag: 'a'
        });
        if (a) {
          a.center.unwrap();
          if (a.left && a.left.textContent.trim() === '') {
            a.left.unwrap();
          }
          if (a.right && a.right.textContent.trim() === '') {
            a.right.unwrap();
          }
        }
      }
      Array.from(r.querySelectorAll('a')).forEach(a => {
        a.unwrap();
      });
      r.unwrap();
    });
    if (wrappedEls.length) {
      const { firstFlag, lastFlag } = setSelectionFlags(wrappedEls[0], wrappedEls[wrappedEls.length - 1]);
      setSelectionBetweenTwoNodes(firstFlag, lastFlag);
    }

  }
  setTagWith(tagName, options = {}) {
    const { attrs = {} } = options;
    if (!tagName) {
      return console.warn('tagName not valid');
    }
    if (!inline_elements[tagName.toUpperCase()]) {
      return console.warn(`valid tags for toggleWith mehtod: ${inline_elemets_arr.join(',')}`);
    }
    const selectedElements = querySelectorUnderSelection(tagName);

    // ==============review===============//
    const elements = wrapRangeWithElement(tagName);
    // This is how i make the text selection, i dont know if this is good way, but it works..
    // ======================================================================//
    // removeZeroSpace(getTextNodes(this.connectedElement));
    const { firstFlag, lastFlag } = setSelectionFlags(elements[0], elements[elements.length - 1]); // Set Flag at last
    [...elements, ...selectedElements].forEach(el => {
      if (!el) {return;}
      if (el && !el.parentElement) {return;}
      for (const key in attrs) {
        if (Object.hasOwnProperty.call(attrs, key)) {
          const value = attrs[key];
          el.setAttribute(key, value);
        }
      }

    });

    this.normalizeContentEditable();
    if (firstFlag && lastFlag) {
      setSelectionBetweenTwoNodes(firstFlag, lastFlag);
    }
  }
  toggleWith(tagName) {
    if (!tagName) {
      return console.warn('tagName not valid');
    }
    if (!inline_elements[tagName.toUpperCase()]) {
      return console.warn(`valid tags for toggleWith mehtod: ${inline_elemets_arr.join(',')}`);
    }
    const selectedElements = querySelectorUnderSelection(tagName);
    let isToggleOn = false;
    if (selectedElements.length > 0) {
      isToggleOn = true;
    }
    // ==============review===============//
    const elements = wrapRangeWithElement(tagName);
    // This is how i make the text selection, i dont know if this is good way, but it works..
    // ======================================================================//
    // removeZeroSpace(getTextNodes(this.connectedElement));
    const { firstFlag, lastFlag } = setSelectionFlags(elements[0], elements[elements.length - 1]); // Set Flag at last
    if (isToggleOn) {

      [...elements, ...selectedElements].forEach(el => {
        if (!el) {return;}
        if (el && !el.parentElement) {return;}
        const closestTag = el.parentElement.__closest(tagName);
        if (!closestTag) {
          el.unwrap();
        } else {
          const fromSplit = spliterHtml(el, closestTag, { tag: el.nodeName });
          if (fromSplit && fromSplit.center) {
            Array.from(fromSplit.center.querySelectorAll(tagName)).forEach(child => child.unwrap());
            fromSplit.center.unwrap();
          }
        }

      });
    }
    this.normalizeContentEditable();
    if (firstFlag && lastFlag) {
      setSelectionBetweenTwoNodes(firstFlag, lastFlag);
    }
  }
  // TODO: review
  // TODO: merge a tags..
  // TODO: remove a childs
  // TODO: move function to Link.service.js
  link(options = {}) {
    if (!options || options && !options.href || !this.isValid()) {
      return;
    }

    const setProtocol = (_protocol, newURL) => {
      _protocol = _protocol.replace(/:/g, '');
      _protocol = _protocol.replace(/\/\//g, '');
      _protocol += ':';
      if (_protocol.includes('http')) {
        _protocol += '//';
      }
      newURL.push(_protocol);
      return _protocol;
    };

    const { href = '', protocol = '', target = '' } = options;

    let newURL = [];
    const Atag = createTempLinkElement(href);
    let _href = resetURL(href.trim());

    let _protocol = protocol.trim() || Atag.protocol;

    let _target = null;
    const testTarget = TARGETS[target.trim().toLowerCase()];
    if (testTarget) {
      _target = testTarget;
    }
    if (_protocol.trim()) {
      _protocol = setProtocol(_protocol, newURL);
    }
    if (_href) {
      while (_href.charAt(0) === '/') {
        _href = _href.substring(1);
      }
      newURL.push(_href);
    }
    const renderedLink = newURL.join('');

    if (window.getSelection && !window.getSelection().toString()) {
      const selectedElement = getSelectedElement();
      let aTag;
      if (selectedElement) {
        aTag = selectedElement.closest('a');
        if (aTag) {
          aTag.href = renderedLink;
          return;
        }
      }
    }
    this.setTagWith('a', {
      attrs: {
        href: renderedLink,
        target: _target || '_blank'
      }
    });
  }
  formatBlock(tagName) {
    if (!block_elments[tagName.toUpperCase()]) {
      throw Error(`valid tags: ${block_elments_queryString}`);
    }
    const elements = querySelectorUnderSelection(block_elments_queryString);
    if (elements.length > 0) {
      const ranges = wrapRangeWithElement();
      let flags;
      if (ranges.length) {
        flags = setSelectionFlags(ranges[0], ranges[ranges.length - 1]); // Set Flag at last
      }

      elements.forEach(block => {
        const tag = document.createElement(tagName);
        Array.from(block.attributes).forEach(attr => {
          tag.setAttribute(attr.name, attr.value);
        });
        block.wrap(tag);
        block.unwrap();
      });
      Array.from(ranges).forEach(range => range.unwrap());
      if (flags && flags.firstFlag && flags.lastFlag) {
        setSelectionBetweenTwoNodes(flags.firstFlag, flags.lastFlag);
      }
    }

  }
  // TODO: review
  // question : we want to handle and toggle any attribute ?
  toggleClass(className, options) {
    // here
    if (!this.isValid()) {
      return;
    }
    if (typeof className !== 'string') {
      console.warn('className must be a string..');
      return null;
    }
    const elements = wrapRangeWithElement();
    if (elements.length === 0) {
      return;
    }
    if (!options) {options = {};}
    const elementUnderSelection = querySelectorUnderSelection(`[class='${className}']`);
    const isToggleOn = typeof options.isON === 'boolean' ? options.isON : elementUnderSelection.length > 0;
    if (!isToggleOn) {
      elements.forEach(el => el.classList.add(className));
    } else {
      elements.forEach(el => {
        if (el.parentElement) {
          const closestClass = el.parentElement.__closest(`[class='${className}']`);
          if (closestClass) {
            const split = spliterHtml(el, closestClass);
            if (split) {
              split.center.removeClassName(className);
            }
          } else {
            el.removeClassName(className);
          }
        }
      });
    }
    const { firstFlag, lastFlag } = setSelectionFlags(elements[0], elements[elements.length - 1]); // Set Flag at last
    this.normalizeContentEditable();

    if (firstFlag && lastFlag) {
      setSelectionBetweenTwoNodes(firstFlag, lastFlag);
    } else {
      const sel = window.getSelection();
      if (sel.removeAllRanges) {
        sel.removeAllRanges();
      }
    }
  }
  /**
    * @param {String} key  key of css
    *  @param {String} value - value of css
    *  @param {(Object)} mode - mode from Modes => Extend or Toggle
    *  @param {string} mode.Extend - override style
    *  @param {string} mode.toggle - toggle style
    *  @param {Object} [options] - options
    * @returns {number} The sum of the two numbers.
    */
  execCmd(key, value, mode, options) {
    if (!this.isValid() || !this.isVAlidKeyValue(key, value)) {
      return;
    }
    this.ELEMENTS = [];
    mode = mode ? mode : Modes.Extend;
    if (!options) {options = {};}

    // ==============review===============//
    this.ELEMENTS = wrapRangeWithElement();
    // This is how i make the text selection, i dont know if this is good way, but it works..
    const flags = setSelectionFlags(this.ELEMENTS[0], this.ELEMENTS[this.ELEMENTS.length - 1]);// Set Flag at last
    // ======================================================================//
    // removeZeroSpace(getTextNodes(this.connectedElement));

    let ToggleMode;// Declare toggle mode, The first element determines whether it is on or off

    this.ELEMENTS.forEach(element => {
      options.onOff = ToggleMode;
      const result = this.modeHandlers[mode](element, key, value, options);
      if (mode === Modes.Toggle && typeof ToggleMode === 'undefined') {ToggleMode = result;}
    });
    this.ELEMENTS.length > 1 && this.normalizeContentEditable();
    // use the first and last flags to make the text selection and unwrap them..
    if (flags && flags.firstFlag && flags.lastFlag) {
      setSelectionBetweenTwoNodes(flags.firstFlag, flags.lastFlag);
    } else {
      const sel = window.getSelection();
      if (sel.removeAllRanges) {
        sel.removeAllRanges();
      }
    }
    const collectedStyles = collectStyleFromSelectedElement(this.connectedElement);
    if (typeof EVENTS.inspect === 'function') {
      EVENTS.inspect(collectedStyles);
    }
    this.dispatchEvent('styleChanged', collectedStyles);
  }
  normalizeContentEditable() {
    const selectedEl = getSelectedElement();
    if (selectedEl) {
      let contenteditableEl = selectedEl.closest('[contenteditable]');
      if (!contenteditableEl) {contenteditableEl = this.connectedElement;}
      normalizeElement(contenteditableEl);
      contenteditableEl.normalize();
    }
  }

  createCaretPlacement(atNode) {
    if (!atNode) {return null;}
    const caretHolder = document.createElement('text-selection');
    caretHolder.setAttribute('zero-space', 'true');
    atNode.appendChild(caretHolder);
    return caretHolder;
  }

  dispatchEvent(event, payload) {
    if (this.events[event]) {this.events[event](payload);}
  }
  onToggle(element, key, value, options = {}) {
    if (options.target === 'block') {
      this.createBlockStyle(options, element, key, value);
    } else {
      // detect if there is any parent with style to split.
      // TODO: use the catch from options to detect more than one style or tag element.
      let elementToSplit = element.__closest(`[style*='${value}']`);
      // TODO: tests
      if (elementToSplit && block_elments[elementToSplit.nodeName]) {
        let innerSpan = createInnerWrapperElement(elementToSplit);
        elementToSplit.style[key] = null;
        innerSpan.style[key] = value;
        options.onOff = false;
        return setStyle(element, key, value);
      }
      if (elementToSplit && elementToSplit !== element) {
        if (typeof options.onOff === 'undefined') {options.onOff = false;}
        // unbold
        const splitElements = spliterHtml(element, elementToSplit);
        // if there is no split elements, its error!
        if (splitElements) {
          toggleStyle(splitElements.center, key, value, options.onOff);
        } else {
          console.error('spliterHtml return null');
        }
      } else {
        if (typeof options.onOff === 'undefined' && elementToSplit) {
          options.onOff = false;
        } else if (typeof options.onOff === 'undefined') {
          options.onOff = true;
        }
        toggleStyle(element, key, value, options.onOff);
      }

      return options.onOff;
    }

  }
  onExtend(element, key, value, options = {}) {
    if (options.target === 'block') {
      this.createBlockStyle(options, element, key, value);
    } else {
      const elementToSplit = element.__closest(`[style*='${key}']`);
      if (elementToSplit) {
        const splitBlocks = spliterHtml(element, elementToSplit);
        if (splitBlocks) {
          setStyle(splitBlocks.center, key, value);
        } else if (options.target === 'block') {
          elementToSplit.style[key] = value;
        } else {
          let innerSpan = createInnerWrapperElement(elementToSplit, { el: 'span' });
          setStyle(innerSpan, key, value);
          elementToSplit.style[key] = null;
          return setStyle(element, key, value);
        }

      } else if (window.getComputedStyle(element).display !== 'block' && options.target === 'block') {
        const blockElement = getClosestBlockElement(element);
        if (blockElement && blockElement.ischildOf(this.connectedElement)) {
          setStyle(blockElement, key, value);
        } else {
          const wrapper = document.createElement('div');
          blockElement.wrap(wrapper);
          setStyle(wrapper, key, value);
        }
      } else {
        setStyle(element, key, value);
      }
    }
  }
  createBlockStyle(options, element, key, value) {

    if (options.as === 'inline') {
      let blockElement = getClosestBlockElement(element);
      if (blockElement) {
        const wrapTextNodeWithAppendStyle = node => {
          const span = document.createElement('span');
          span.style[key] = value;
          node.wrap(span);
        };
        const createInlineStyle = parentNode => {
          // TODO: tests
          parentNode.style[key] = null;
          Array.from(parentNode.childNodes).forEach(node => {
            if (node.nodeType === 3) {
              wrapTextNodeWithAppendStyle(node);
            } else if (node.nodeType === 1 && !void_elements[node.nodeName]) {
              createInlineStyle(node);
            } else {
              node.style[key] = value;
            }
          });
        };
        createInlineStyle(blockElement);
        // Array.from(blockElement.querySelectorAll("span")).forEach(el=>el.style[key] = value);
      }

    } else {
      let isSuccess = findBlockAndStyleIt(element, key, value);
      if (!isSuccess) {
        const contentEditable = element.closest('[contenteditable]');
        if (contentEditable && contentEditable.isContentEditable) {
          wrapNakedTextNodes(contentEditable);
          isSuccess = findBlockAndStyleIt(element, key, value);
          if (!isSuccess) {
            console.log('text nodes and inline elements must be inside block element like p,h1,h2,h3,h4,h5,h6');
          }
        }
      }
    }
  }

  isVAlidKeyValue(key, value) {
    return !!(typeof key === 'string' && typeof value === 'string');
  }
  isValid() {
    if (!this.connectedElement) {
      console.error('please create new instance..');
      return false;
    }
    const selectedElement = getSelectedElement();
    if (selectedElement && ((selectedElement.ischildOf(this.connectedElement) || selectedElement === this.connectedElement) && selectedElement.isContentEditable)) {
      return true;
    }

  }
}
