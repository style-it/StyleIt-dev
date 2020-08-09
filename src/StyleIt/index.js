import { Ranger } from "./services/range.service";
import { Modes } from './constants/Modes';
import { splitHTML } from "./utilis/splitHTML";
import { setStyle, toggleStyle } from "./services/style.service";
import { normalizeElement } from "./services/textEditor.service";
import Connector from './connector';
import './components/custom/textSelected';
import { elementToJson, JsonToElement } from "./services/elements.service";
export default class Core {

    // *target => can be Id of Element that should contain Editor instance or the element itself..
    // *config =>  configuration passed to Tool constructor
    //TODO: add target validations..;
    constructor(target, config) {
        this.__config = {
            onInspect:undefined
        };
        this.ranger = new Ranger();
        this.Connector = new Connector();
        this.modeHandlers = {
            [Modes.Toggle]: (v, key, value, OnOff) => this.onToggle(v, key, value, OnOff),
            [Modes.Extend]: (v, key, value) => this.onExtend(v, key, value),
        }
        this.config = config ? Object.assign( this.__config, config) : this.__config;
        this.connectedElement = this.Connector.Connect(target, this.config);
    }

    /**
     * @param {String} key - key of css 
     *  @param {String} value - value of css
     *  @param {(Object | String)} Modes - mode from Modes => Extend or Toggle
     *  @param {string} Modes.Extend - override style
     *  @param {string} Modes.toggle - toggle style
     *  @param {Object} [options] - options 
     */
    Save() {
        const json = elementToJson(this.connectedElement);
    }
    Load(json) {
        const html = JsonToElement(json,this.connectedElement);
    }
    Destroy(){

    }
    //TODO: review
    //question : we want to handle and toggle any attribute ? 
    addClass(className) {
        if(typeof(className) !== "string") {
            console.warn("className must be a string..");
            return null;
        }
        const elements  = this.ranger.insertRangeAtDom();
        if (elements.length === 0) {
            return;
        }
        const isToggleOn = elements[0].closest(`[class='${className}']`);
        if(!isToggleOn){
            elements.forEach(el=>el.classList.add(className));
        }else{
            elements.forEach(el=>{
                if(el.parentElement){
                    const closestClass = el.parentElement.closest(`[class='${className}']`);
                    if(closestClass){
                        const split = splitHTML(el,closestClass);
                        if(split){
                            split.center.removeClassName(className);
                        }
                    }
                }else{
                    el.removeClassName(className);
                }
            })
        }
     
        //This is how i make the text selection, i dont know if this is good way, but it works..
        const { firstFlag, lastFlag } = this.ranger.setSelectionFlags(elements[0],elements[elements.length - 1]); //Set Flag at last

        normalizeElement(this.connectedElement);// merge siblings and parents with child as possible.. 
        this.ranger.setSelectionBetweenTwoNodes(firstFlag,lastFlag);
    }
    execCmd(key, value, mode, options) {
        this.connectedElement.normalize();
        mode = mode ? mode : Modes.Extend;
        this.options = typeof options === 'object' ? options : {};
        if (!this.isValid(key, value)) {
            return;
        }
        this.ELEMENTS = this.ranger.insertRangeAtDom();
        if (this.ELEMENTS.length === 0) {
            return;
        }
        //This is how i make the text selection, i dont know if this is good way, but it works..
        const { firstFlag, lastFlag } = this.ranger.setSelectionFlags(this.ELEMENTS[0],this.ELEMENTS[this.ELEMENTS.length - 1]); //Set Flag at last
        //======================================================================//

        let ToggleMode;//Declare toggle mode, The first element determines whether it is on or off

        this.ELEMENTS.forEach((element, i) => {
            const result = this.modeHandlers[mode](element, key, value, ToggleMode);
            if (mode === Modes.Toggle && typeof (ToggleMode) === 'undefined')
                ToggleMode = result;
        });

        normalizeElement(this.connectedElement);// merge siblings and parents with child as possible.. 
        //use the first and last flags to make the text selection and unwrap them..
        this.ranger.setSelectionBetweenTwoNodes(firstFlag,lastFlag);
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
                const s = document.createElement("span");
                s.innerHTML = "&#200B"
                splitElements.center.appendChild(s);
                this.ranger.setCaretAt(s,s.textContent.length);

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
        if (elementToSplit) {
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
        var selectedElement = this.ranger.getSelectedElement();
        if (selectedElement && ( selectedElement.ischildOf(this.connectedElement) || selectedElement === this.connectedElement)) {
            return true;
        }
;
    }
}