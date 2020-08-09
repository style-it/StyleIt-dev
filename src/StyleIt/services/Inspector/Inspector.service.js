
import { Ranger } from '../range.service';
import {  getInheirtCss } from '../style.service';


//TODO: review
//question: how can we expose the collectedStyle ? 
//question: should we use this ? https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
export default class Inpsector {
    constructor(target,onInspect) {

        if (!target) {
            console.error('[-] Inpsector => target is null');
            return null;
        }
        //TODO: use the validator
        this.onInspect = onInspect;
        this.target = target;
        this.ranger = new Ranger();
        this.collectStyleFromSelectedElement = () =>{
            const selectedElement = this.ranger.getSelectedElement();                
            return getInheirtCss(selectedElement,this.target);
        }
        this.onKeyDown = () => {
            const collectedStyle =  this.collectStyleFromSelectedElement();
            if(typeof(this.onInspect) === "function")
            this.onInspect(collectedStyle);
            console.log('inspect Style', collectedStyle);
        }
        this.onClick = () => {
           const collectedStyle =  this.collectStyleFromSelectedElement();
           console.log('inspect Style', collectedStyle);
           this.onInspect(collectedStyle);
        }

        this.target.addEventListener('click', this.onClick);
        this.target.addEventListener('keydown', this.onKeyDown);

        this.destroy = () => {
            this.target.removeEventListener('click', this.onClick);
            this.target.removeEventListener('keydown', this.onKeyDown);
        }
    }
}