import {
    Ranger, wrapRangeWithElement,
    setSelectionFlags,
    setSelectionBetweenTwoNodes,
    setCaretAt,
    getTextNodes,
    getCaretCharacterOffsetWithin
} from "./services/range.service";
import Modes from './constants/Modes.json';
import { splitHTML } from "./utilis/splitHTML";
import { setStyle, toggleStyle, collectStyleFromSelectedElement } from "./services/style.service";
import { normalizeElement, removeZeroSpace } from "./services/textEditor.service";
import Connector from './connector';
import './components/custom/textSelected';
import { elementToJson, JsonToElement, getSelectedElement } from "./services/elements.service";
export default class Core {

    // *target => can be Id of Element that should contain Editor instance or the element itself..
    // *config =>  configuration passed t   o Tool constructor
    //TODO: add target validations..;
    constructor(target, config) {
        this.__config = {
            onInspect: undefined,
        };

        this.Connector = new Connector();
        this.modeHandlers = {
            [Modes.Toggle]: (v, key, value, OnOff) => this.onToggle(v, key, value, OnOff),
            [Modes.Extend]: (v, key, value) => this.onExtend(v, key, value),
        }
        this.config = config ? Object.assign(this.__config, config) : this.__config;
        this.events = {
            styleChanged: this.config.onInspect,
        }
        this.connectedElement = this.Connector.Connect(target, this.config);
    }
    Save() {
        return elementToJson(this.connectedElement);
    }
    Load(json) {
        return JsonToElement(json, this.connectedElement);
    }
    Destroy() {
        this.Connector.Destroy();
        const self = this;
        for (const key in self) {
            const instance = this[key];
            instance = null;
        }
        this.connectedElement = null;
    }
    //TODO: review
    //question : we want to handle and toggle any attribute ? 
    ToggleClass(className, isON, options) {
        //here
        if (typeof (className) !== "string") {
            console.warn("className must be a string..");
            return null;
        }

        const elements = wrapRangeWithElement();
        if (elements.length === 0) {
            return;
        }
        if (!options) options = {}
        if (typeof (options.selection) !== "boolean") options.selection = true;
        const isToggleOn = (typeof (isON) === "boolean") ? isON : elements[0].closest(`[class='${className}']`);
        if (!isToggleOn) {
            elements.forEach(el => el.classList.add(className));
        } else {
            elements.forEach(el => {
                if (el.parentElement) {
                    const closestClass = el.parentElement.closest(`[class='${className}']`);
                    if (closestClass) {
                        const split = splitHTML(el, closestClass);
                        if (split) {
                            split.center.removeClassName(className);
                        }
                    }
                } else {
                    el.removeClassName(className);
                }
            })
        }
        const { firstFlag, lastFlag } = options.selection ? setSelectionFlags(elements[0], elements[elements.length - 1]) : { firstFlag: null, lastFlag: null }; //Set Flag at last
        normalizeElement(this.connectedElement);// merge siblings and parents with child as possible..
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

        this.connectedElement.normalize();
        let caretElement;
        this.ELEMENTS = [];
        mode = mode ? mode : Modes.Extend;
        if (!options) options = {};
        if (typeof (options.selection) !== "boolean") options.selection = true;
        if (!this.isValid(key, value)) {
            return;
        }
        if (!options.selection) {
            const selectedElement = getSelectedElement();
            if (selectedElement) {
                caretElement = {};
                caretElement.el = selectedElement;
                caretElement.index = getCaretCharacterOffsetWithin(selectedElement);
            }
        }

        if (options.target === "block") {
            let nodes = wrapRangeWithElement();
            nodes.map(el => {
                const block = el.closest('p');
                if ((block && block === this.connectedElement) || !block) {
                    const newBlock = this.createWrapperElement(this.connectedElement, { el: "p" });
                    this.ELEMENTS.push(newBlock);
                } else {
                    this.ELEMENTS.push(block);
                }
            });
        } else {
            this.ELEMENTS = wrapRangeWithElement();
        }





        //This is how i make the text selection, i dont know if this is good way, but it works..
        const { firstFlag, lastFlag } = options.selection ? setSelectionFlags(this.ELEMENTS[0], this.ELEMENTS[this.ELEMENTS.length - 1]) : { firstFlag: null, lastFlag: null }; //Set Flag at last
        //======================================================================//
        removeZeroSpace(getTextNodes(this.connectedElement));

        let ToggleMode;//Declare toggle mode, The first element determines whether it is on or off

        this.ELEMENTS.forEach((element, i) => {
            const result = this.modeHandlers[mode](element, key, value, ToggleMode);
            if (mode === Modes.Toggle && typeof (ToggleMode) === 'undefined')
                ToggleMode = result;
        });
        normalizeElement(this.connectedElement);// merge siblings and parents with child as possible.. 
        //use the first and last flags to make the text selection and unwrap them..
        if (firstFlag && lastFlag) {
            setSelectionBetweenTwoNodes(firstFlag, lastFlag);
        } else {
            const sel = window.getSelection();
            if (sel.removeAllRanges) {
                sel.removeAllRanges();
            }
            if (caretElement.el && caretElement.index) {
                setCaretAt(caretElement.el, caretElement.index);
            }
        }
        this.dispatchEvent('styleChanged', collectStyleFromSelectedElement(this.connectedElement));
    }
    dispatchEvent(event, payload) {
        if (this.events[event])
            this.events[event](payload);
    }
    onToggle(element, key, value, OnOff) {
        // detect if there is any parent with style to split.
        //TODO: use the catch from options to detect more than one style or tag element.
        let elementToSplit = element.closest(`[style*='${value}']`);
        if (elementToSplit && window.getComputedStyle(elementToSplit).display === "block") {
            let innerSpan = this.createWrapperElement(elementToSplit);
            elementToSplit.style[key] = null;
            innerSpan.style[key] = value;
            return this.onToggle(element, key, value, false);
        }
        if (elementToSplit && elementToSplit !== element) {
            if (typeof (OnOff) === 'undefined')
                OnOff = false;
            //unbold
            const splitElements = splitHTML(element, elementToSplit);
            // if there is no split elements, its error!
            if (splitElements) {
                toggleStyle(splitElements.center, key, value, OnOff);
                if (this.ELEMENTS.length === 1 && !this.ELEMENTS[0].textContent.trim()) {
                    splitElements.center.innerHTML += "&#8203;"
                    const zeroSpace = document.createElement("span");
                    zeroSpace.innerHTML = "&#8203;"
                    splitElements.center.appendChild(zeroSpace);
                    setCaretAt(zeroSpace);
                }

            } else {
                console.error('splitHTML return null');
            }
        }
        else {
            if (typeof (OnOff) === 'undefined' && elementToSplit) {
                OnOff = false;
            } else if (typeof (OnOff) === 'undefined') {
                OnOff = true;
            }
            //bold
            toggleStyle(element, key, value, OnOff);
            normalizeElement(element);
        }

        return OnOff;
    }
    onExtend(element, key, value) {
        const elementToSplit = element.closest(`[style*='${key}']`);
        if (elementToSplit && window.getComputedStyle(elementToSplit).display === "block") {
            let innerSpan = this.createWrapperElement(elementToSplit);
            innerSpan.style[key] = elementToSplit.style[key];
            elementToSplit.style[key] = null;
            return this.onExtend(element, key, value);
        }
        if (elementToSplit && elementToSplit !== element) {
            const splitElements = splitHTML(element, elementToSplit);
            if (splitElements) {
                setStyle(splitElements.center, key, value);
            } else {
                console.error('splitHTML return null');
            }
        }
        else {
            setStyle(element, key, value);
        }
    }




    createWrapperElement(element, options) {
        if (typeof (options) !== "object") options = {};
        let innerSpan = document.createElement(options.el || "span");
        Array.from(element.childNodes).forEach(child => innerSpan.appendChild(child));
        element.appendChild(innerSpan);
        return innerSpan;
    }

    isValid(key, value) {
        if (!this.connectedElement) {
            console.error('please use connectWith method')
            return false;
        };
        if (this.connectedElement.contentEditable !== "true") {
            return false;
        }
        if (typeof key !== "string" && typeof value !== "string") {
            return false;
        }
        var selectedElement = getSelectedElement();
        if (selectedElement && (selectedElement.ischildOf(this.connectedElement) || selectedElement === this.connectedElement)) {
            return true;
        }
        ;
    }
}