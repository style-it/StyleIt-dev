import { Ranger, wrapRangeWithElement,
     setSelectionFlags, 
     setSelectionBetweenTwoNodes,
      setCaretAt, 
      getTextNodes,
      getCaretCharacterOffsetWithin } from "./services/range.service";
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
        }else{
            const sel = window.getSelection ();
            if(sel.removeAllRanges){
                sel.removeAllRanges ();
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
        let indexCaret;
        mode = mode ? mode : Modes.Extend;
        if (!options) options = {};
        if (typeof (options.selection) !== "boolean") options.selection = true;
        if (!this.isValid(key, value)) {
            return;
        }
        if (options.target === "block") {
            const selectedElement = getSelectedElement();
            if (selectedElement) {
                const block = selectedElement.closest('p') || selectedElement.closest('div');
                 indexCaret = getCaretCharacterOffsetWithin(block);
                this.ELEMENTS = [block];    
                // const txtNodes = getTextNodes(block);
                // this.ELEMENTS  = txtNodes.map(t=>t.wrap(document.createElement('span')));             
            }
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
        debugger
        if (firstFlag && lastFlag) {
            setSelectionBetweenTwoNodes(firstFlag, lastFlag);
        }else{
            const sel = window.getSelection ();
            if(sel.removeAllRanges){
                sel.removeAllRanges ();
            }
            const target = this.ELEMENTS[0];
            setCaretAt(target,indexCaret);
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
        const elementToSplit = element.closest(`[style*='${value}']`);
        if (elementToSplit) {
            if (typeof (OnOff) === 'undefined')
                OnOff = false;
            //unbold
            const splitElements = splitHTML(element, elementToSplit);
            // if there is no split elements, its error!
            if (splitElements) {
                toggleStyle(splitElements.center, key, value, OnOff);
                if (this.ELEMENTS.length === 1 && !this.ELEMENTS[0].textContent.trim()) {
                    splitElements.center.innerHTML += "&#8203;"
                    const s = document.createElement("span");
                    s.innerHTML = "&#8203;"
                    splitElements.center.appendChild(s);
                    setCaretAt(s);
                }

            } else {
                console.error('splitHTML return null');
            }
        }
        else {
            if (typeof (OnOff) === 'undefined')
                OnOff = true;
            //bold
            toggleStyle(element, key, value, OnOff);
            normalizeElement(element);
        }

        return OnOff;
    }
    onExtend(element, key, value) {
        const elementToSplit = element.closest(`[style*='${key}']`);;
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