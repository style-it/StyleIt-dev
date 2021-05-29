import {
    wrapRangeWithElement,
    setSelectionFlags,
    setSelectionBetweenTwoNodes,
    createInnerWrapperElement,
    setCaretAt,
    GetClosestBlockElement,
    querySelectorUnderSelection,
    pasteHtmlAtCaret,
} from "./services/range.service";
import Modes from './constants/Modes.json';
import { splitHTML } from "./utilis/splitHTML";
import { setStyle, toggleStyle, collectStyleFromSelectedElement, findBlockAndStyleIt } from "./services/style.service";
import { normalizeElement } from "./services/textEditor.service";
import Connector from './connector';
import './components/custom/textSelected';
import { elementToJson, JsonToElement, getSelectedElement, wrapNakedTextNodes } from "./services/elements.service";
import { EVENTS } from './services/events/events';
import { createTempLinkElement, resetURL, TARGETS } from "./services/link.service";
import { void_elements } from "./constants/void_elms";
import { block_elments, block_elments_queryString } from "./constants/block_elms";
import { inline_elements, inline_elemets_arr } from "./constants/inline_elems";

export default class Core {

    // *target => can be Id of Element that should contain Editor instance or the element itself..
    // *config =>  configuration passed t   o Tool constructor
    //TODO: add target validations..;
    constructor(target, config) {
        this.__config = {
            onInspect: undefined,
        };

        this.on = (key, callback) => {
            if (typeof (key) !== "string") {
                console.error("key must be a string..");
            }
            if (typeof (callback) !== "function") {
                console.error("callback must be a function..");
            }
            EVENTS[key] = callback;
        };
        this.Connector = new Connector();
        this.modeHandlers = {
            [Modes.Toggle]: (v, key, value, options) => this.onToggle(v, key, value, options),
            [Modes.Extend]: (v, key, value, options) => this.onExtend(v, key, value, options),
        }
        this.config = config ? Object.assign(this.__config, config) : this.__config;
        this.events = {
            styleChanged: this.config.onInspect,
        }
        this.connectedElement = this.Connector.Connect(target, this.config);
    }
    save(element) {
        return elementToJson(element || this.connectedElement);
    }
    load(json) {
        return JsonToElement(json, this.connectedElement);
    }
    destroy() {
        this.Connector.Destroy();
        const self = this;
        for (const key in self) {
            this[key] = null;
            delete this[key];
        }
    }
    //TODO: review.
    //TODO: Create normalize..
    //question: if text was selected, should we unwrap the selectiion only ? 
    unLink() {
        if (!this.isValid()) {
            return;
        }
        const selection = window.getSelection();

        if (selection && !selection.toString()) {
            let elementToUnwrap;
            const baseNode = selection.baseNode;
            if (baseNode && baseNode.nodeType === 3 && baseNode.parentElement) {
                elementToUnwrap = baseNode.parentElement.__closest("a");
            }
            if (baseNode && baseNode.nodeType === 1) {
                elementToUnwrap = elementToUnwrap.__closest("a");
            }
            if (elementToUnwrap) {
                elementToUnwrap.unwrap();
            }
            return null;
        }
        const linkElements = wrapRangeWithElement();
        Array.from(linkElements).forEach(r => {
            const closestATag = r.__closest("a");
            if (closestATag) {
                var a = splitHTML(r, closestATag, {
                    tag: "a"
                })
                if (a) {
                    a.center.unwrap();
                    if (a.left && a.left.textContent.trim() === "") {
                        a.left.unwrap();
                    }
                    if (a.right && a.right.textContent.trim() === "") {
                        a.right.unwrap();
                    }
                }
            }
            Array.from(r.querySelectorAll("a")).forEach(a => {
                a.unwrap();
            });
            r.unwrap();
        });
        if (linkElements.length) {
            const { firstFlag, lastFlag } = setSelectionFlags(linkElements[0], linkElements[linkElements.length - 1]); //Set Flag at last
            setSelectionBetweenTwoNodes(firstFlag, lastFlag);
        }

    }
    wrapWith(tagName, options) {
        if(!tagName){
            return console.warn("tagName not valid");
        }
        if(!inline_elements[tagName.toUpperCase()]){
            return console.warn("valid tags for wrapWith mehtod: "+inline_elemets_arr.join(","))
        }
        const selectedElements = querySelectorUnderSelection(tagName);
        let isToggleOn = false;
        if (selectedElements.length > 0) {
            isToggleOn = true;
        }
        //==============review===============//
        const elements = wrapRangeWithElement(tagName);
        //This is how i make the text selection, i dont know if this is good way, but it works..
        //======================================================================//
        // removeZeroSpace(getTextNodes(this.connectedElement));
        const { firstFlag, lastFlag } = setSelectionFlags(elements[0], elements[elements.length - 1]); //Set Flag at last
        if(isToggleOn){
            elements.forEach(el=>{
                const closestTag = el.parentElement.__closest(tagName);
                if(!closestTag){
                    el.unwrap();
                }else{
                    const fromSplit = splitHTML(el,closestTag,{tag:el.nodeName});
                    if(fromSplit && fromSplit.center){
                        Array.from(fromSplit.center.querySelectorAll(tagName)).forEach(child=>child.unwrap());
                        fromSplit.center.unwrap();
                    }
                }

            })
        }
        normalizeElement(this.connectedElement);
        if (firstFlag && lastFlag) {
            setSelectionBetweenTwoNodes(firstFlag, lastFlag);
        }
        this.connectedElement.normalize();
    }
    //TODO: review
    //TODO: merge a tags..
    //TODO: remove a childs
    //TODO: move function to Link.service.js
    link(options = {}) {
        if (!options || (options && !options.href) || !this.isValid()) {
            return;
        }
        const setTargetToTag = (linkElements, renderedLink, _target) => {
            linkElements.forEach(aTag => {
                aTag.href = renderedLink;
                if (_target) {
                    aTag.setAttribute("target", _target);
                }
            });
        }
        const setProtocol = (_protocol, newURL) => {
            _protocol = _protocol.replace(/:/g, "");
            _protocol = _protocol.replace(/\/\//g, "");
            _protocol += ":";
            if (_protocol.includes("http")) {
                _protocol += "//";
            } else {
            }
            newURL.push(_protocol);
            return _protocol;
        }


        const { href = "", protocol = "", target = "" } = options;

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
            while (_href.charAt(0) === "/") {
                _href = _href.substring(1)
            }
            newURL.push(_href);
        }
        const renderedLink = newURL.join("");

        if (window.getSelection && !window.getSelection().toString()) {
            const selectedElement = getSelectedElement();
            let aTag;
            if (selectedElement) {
                aTag = selectedElement.closest("a");
                if (aTag) {
                    aTag.href = renderedLink;
                    return;
                }
            }
        }
        document.execCommand("createLink", false, renderedLink);
        // setTargetToTag(linkElements, renderedLink, _target);
    }
    formatBlock(tagName, options) {
        if (!block_elments[tagName.toUpperCase()]) {
            throw Error(`valid tags: ${block_elments_queryString}`);
        }
        const elements = querySelectorUnderSelection(block_elments_queryString);
        if (elements.length > 0) {
            const ranges = wrapRangeWithElement();
            let flags;
            if (ranges.length) {
                flags = setSelectionFlags(ranges[0], ranges[ranges.length - 1]); //Set Flag at last
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
    //TODO: review
    //question : we want to handle and toggle any attribute ? 
    toggleClass(className, options) {
        //here
        if (!this.isValid()) {
            return;
        }
        if (typeof (className) !== "string") {
            console.warn("className must be a string..");
            return null;
        }
        const elements = wrapRangeWithElement();
        if (elements.length === 0) {
            return;
        }
        if (!options) options = {};
        const elementUnderSelection = querySelectorUnderSelection(`[class='${className}']`);
        const isToggleOn = (typeof (options.isON) === "boolean") ? options.isON : elementUnderSelection.length>0;
        if (!isToggleOn) {
            elements.forEach(el => el.classList.add(className));
        } else {
            elements.forEach(el => {
                if (el.parentElement) {
                    const closestClass = el.parentElement.__closest(`[class='${className}']`);
                    if (closestClass) {
                        const split = splitHTML(el, closestClass);
                        if (split) {
                            split.center.removeClassName(className);
                        }
                    }else {
                        el.removeClassName(className);
                    }
                } 
            })
        }
        const { firstFlag, lastFlag } = setSelectionFlags(elements[0], elements[elements.length - 1]); //Set Flag at last
        normalizeElement(this.connectedElement);

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
    * @param {String} key - key of css 
    *  @param {String} value - value of css
    *  @param {(Object | String)} Modes - mode from Modes => Extend or Toggle
    *  @param {string} Modes.Extend - override style
    *  @param {string} Modes.toggle - toggle style
    *  @param {Object} [options] - options 
    */
    execCmd(key, value, mode, options) {
        if (!this.isValid() || !this.isVAlidKeyValue(key, value)) {
            return;
        }
        this.ELEMENTS = [];
        mode = mode ? mode : Modes.Extend;
        if (!options) options = {};


        //==============review===============//
        this.ELEMENTS = wrapRangeWithElement();

        //This is how i make the text selection, i dont know if this is good way, but it works..
        const flags = setSelectionFlags(this.ELEMENTS[0], this.ELEMENTS[this.ELEMENTS.length - 1]);//Set Flag at last
        //======================================================================//
        // removeZeroSpace(getTextNodes(this.connectedElement));

        let ToggleMode;//Declare toggle mode, The first element determines whether it is on or off

        this.ELEMENTS.forEach((element, i) => {
            options.onOff = ToggleMode;
            const result = this.modeHandlers[mode](element, key, value, options);
            if (mode === Modes.Toggle && typeof (ToggleMode) === 'undefined')
                ToggleMode = result;
        });
        const normalizedParents = [];
        this.ELEMENTS.forEach(el => {
            if (el.parentElement && normalizedParents.findIndex(n => n === el.parentElement) < 0) {
                normalizeElement(el.parentElement);// merge siblings and parents with child as possible.. 
                normalizedParents.push(el.parentElement);
            }
        })
        //use the first and last flags to make the text selection and unwrap them..
        if (flags && flags.firstFlag && flags.lastFlag) {
            setSelectionBetweenTwoNodes(flags.firstFlag, flags.lastFlag);
        } else {
            const sel = window.getSelection();
            if (sel.removeAllRanges) {
                sel.removeAllRanges();
            }
            if (this.caretHolder) {
                setCaretAt(this.caretHolder, this.caretHolder.textContent.length);
                this.caretHolder.unwrap();
                this.caretHolder = null;
            }
        }
        const collectedStyles = collectStyleFromSelectedElement(this.connectedElement);
        if (typeof (EVENTS["inspect"]) === "function") {
            EVENTS["inspect"](collectedStyles);
        }
        this.dispatchEvent('styleChanged', collectedStyles);
        this.connectedElement.normalize();
    }
    createCaretPlacement(atNode) {
        if (!atNode) return null;
        const caretHolder = document.createElement('text-selection');
        caretHolder.setAttribute('zero-space', 'true');
        atNode.appendChild(caretHolder);
        return caretHolder;
    }

    dispatchEvent(event, payload) {
        if (this.events[event])
            this.events[event](payload);
    }
    onToggle(element, key, value, options = {}) {
        if (options.target === "block") {
            this.createBlockStyle(options, element, key, value);
        } else {
            // detect if there is any parent with style to split.
            //TODO: use the catch from options to detect more than one style or tag element.
            let elementToSplit = element.__closest(`[style*='${value}']`);
            //TODO: tests
            if (elementToSplit && block_elments[elementToSplit.nodeName]) {
                let innerSpan = createInnerWrapperElement(elementToSplit);
                elementToSplit.style[key] = null;
                innerSpan.style[key] = value;
                options.onOff = false;
                return this.onToggle(element, key, value, options);
            }
            if (elementToSplit && elementToSplit !== element) {
                if (typeof (options.onOff) === 'undefined')
                    options.onOff = false;
                //unbold
                const splitElements = splitHTML(element, elementToSplit);
                // if there is no split elements, its error!
                if (splitElements) {
                    toggleStyle(splitElements.center, key, value, options.onOff);
                } else {
                    console.error('splitHTML return null');
                }
            }
            else {
                if (typeof (options.onOff) === 'undefined' && elementToSplit) {
                    options.onOff = false;
                } else if (typeof (options.onOff) === 'undefined') {
                    options.onOff = true;
                }
                toggleStyle(element, key, value, options.onOff);
                normalizeElement(element);
            }

            return options.onOff;
        }

    }
    onExtend(element, key, value, options = {}) {
        if (options.target === "block") {
            this.createBlockStyle(options, element, key, value);
        } else {
            const elementToSplit = element.__closest(`[style*='${key}']`);
            if (elementToSplit) {
                const splitBlocks = splitHTML(element, elementToSplit);
                if (splitBlocks) {
                    setStyle(splitBlocks.center, key, value);
                }
                else if (options.target === "block") {
                    elementToSplit.style[key] = value;
                }
                else if (options.target !== "block") {
                    let innerSpan = createInnerWrapperElement(elementToSplit, { el: 'span' });
                    setStyle(innerSpan, key, value);
                    elementToSplit.style[key] = null;
                    return this.onExtend(element, key, value);

                }
                else if (elementToSplit !== element) {
                    const splitElements = splitHTML(element, elementToSplit);
                    if (splitElements) {
                        setStyle(splitElements.center, key, value);
                    } else {
                        console.error('splitHTML return null');
                    }
                }

            } else if (window.getComputedStyle(element).display !== "block" && options.target === "block") {
                const blockElement = GetClosestBlockElement(element);
                if (blockElement && blockElement.ischildOf(this.connectedElement)) {
                    setStyle(parentElement, key, value);
                } else {
                    const wrapper = document.createElement("div");
                    parentElement.wrap(wrapper);
                    setStyle(wrapper, key, value);
                }
            } else {
                setStyle(element, key, value);
            }
        }
    }
    createBlockStyle(options, element, key, value) {

        if (options.as === "inline") {
            let blockElement = GetClosestBlockElement(element);
            if (blockElement) {
                const wrapTextNodeWithAppendStyle = (node) => {
                    const span = document.createElement("span");
                    span.style[key] = value;
                    node.wrap(span);
                };
                const createInlineStyle = (parentNode) => {
                    //TODO: tests
                    parentNode.style[key] = null;
                    Array.from(parentNode.childNodes).forEach(node => {
                        if (node.nodeType === 3) {
                            wrapTextNodeWithAppendStyle(node);
                        } else if (node.nodeType === 1 && !void_elements[node.nodeName]) {
                            createInlineStyle(node);
                        }
                        else {
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
                const contentEditable = element.closest("[contenteditable]");
                if (contentEditable && contentEditable.isContentEditable) {
                    wrapNakedTextNodes(contentEditable);
                    isSuccess = findBlockAndStyleIt(element, key, value);
                    if (!isSuccess) {
                        console.log("text nodes and inline elements must be inside block element like p,h1,h2,h3,h4,h5,h6");
                    }
                }
            }
        }
    }

    isVAlidKeyValue(key, value) {
        return !!(typeof key === "string" && typeof value === "string");
    }
    isValid() {
        if (!this.connectedElement) {
            console.error('please create new instance..')
            return false;
        };
        const selectedElement = getSelectedElement();
        if (selectedElement && ((selectedElement.ischildOf(this.connectedElement) || selectedElement === this.connectedElement) && selectedElement.isContentEditable)) {
            return true;
        }
        ;
    }
}