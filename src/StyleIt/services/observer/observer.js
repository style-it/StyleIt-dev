import { wrapNakedTextNodes } from "../elements.service";

export default class Observer {

    constructor(target,options) {
       
        this.target = target;
        this.callback = this.callback.bind(this);
        this.observer = new MutationObserver(this.callback);
        this.start();
    }
    callback(mutationsList, observer){
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                wrapNakedTextNodes(this.target);
            }
    }
}
    start(){
        const config = { childList: true};
        this.observer.observe(this.target, config);

    }
    destroy(){
        this.observer.disconnect(); 
    }
}