
class TextSelection extends HTMLElement {
    constructor(props) {
      super();
    }
    connectedCallback(){
      this.innerHTML = "&#8203;";
    }
  }
  customElements.define('text-selection', TextSelection); 