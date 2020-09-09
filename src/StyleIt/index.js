import {
    wrapRangeWithElement,
    setSelectionFlags,
    setSelectionBetweenTwoNodes,
    getTextNodes,
    createInnerWrapperElement,
    wrapRangeWithBlockElement,
    setCaretAt,
    GetClosestBlockElement
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
            [Modes.Toggle]: (v, key, value, options) => this.onToggle(v, key, value, options),
            [Modes.Extend]: (v, key, value, options) => this.onExtend(v, key, value, options),
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
    ToggleClass(className, options) {
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
        const isToggleOn = (typeof (options.isON) === "boolean") ? options.isON : elements[0].closest(`[class='${className}']`);
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
        this.ELEMENTS = [];
        mode = mode ? mode : Modes.Extend;
        if (!options) options = {};
        if (typeof (options.selection) !== "boolean") options.selection = true;
        if (!this.isValid(key, value)) {
            return;
        }

        //==============review===============//
        if (options.target === "block") {
            const dataResult = wrapRangeWithBlockElement(this.connectedElement);
            this.ELEMENTS = dataResult.blocks;
            if (!options.selection) {
                const lastNode = dataResult.nodes[dataResult.nodes.length - 1];
                if (lastNode)
                    this.caretHolder = this.createCaretPlacement(lastNode);
            }
        } else {
            this.ELEMENTS = wrapRangeWithElement();
            if (!options.selection) {
                const lastNode = this.ELEMENTS[this.ELEMENTS.length - 1];
                if (lastNode)
                    this.caretHolder = this.createCaretPlacement(lastNode);
            }
        }

        //This is how i make the text selection, i dont know if this is good way, but it works..
        const { firstFlag, lastFlag } = options.selection ? setSelectionFlags(this.ELEMENTS[0], this.ELEMENTS[this.ELEMENTS.length - 1]) : { firstFlag: null, lastFlag: null }; //Set Flag at last
        //======================================================================//
        removeZeroSpace(getTextNodes(this.connectedElement));

        let ToggleMode;//Declare toggle mode, The first element determines whether it is on or off

        this.ELEMENTS.forEach((element, i) => {
            options.onOff = ToggleMode;
            const result = this.modeHandlers[mode](element, key, value, options);
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
            if (this.caretHolder) {
                setCaretAt(this.caretHolder, this.caretHolder.textContent.length);
                this.caretHolder.unwrap();
                this.caretHolder = null;
            }
        }
        this.dispatchEvent('styleChanged', collectStyleFromSelectedElement(this.connectedElement));
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
    onToggle(element, key, value, options) {
        if(options.target === "block"){
            console.error("Target:block will works on extend mode only");
            return null;
        }
        // detect if there is any parent with style to split.
        //TODO: use the catch from options to detect more than one style or tag element.
        let elementToSplit = element.closest(`[style*='${value}']`);
        if (elementToSplit && window.getComputedStyle(elementToSplit).display === "block") {
            let innerSpan = createInnerWrapperElement(elementToSplit);
            elementToSplit.style[key] = null;
            innerSpan.style[key] = value;
            return this.onToggle(element, key, value, false);
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
    onExtend(element, key, value, options) {
        debugger
        const elementToSplit = element.closest(`[style*='${key}']`);
        if (elementToSplit) {
            if (window.getComputedStyle(elementToSplit).display === "block" && options.target === "block") {

            }
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
            
        }else if (window.getComputedStyle(element).display !== "block" && options.target === "block") {
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