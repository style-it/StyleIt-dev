

export default class KeyPress {
    constructor(target, keys) {

        if (!target) {
            console.error('[-] keyPress => target is null');
            return null;
        }
        if (!Array.isArray(keys)) {
            console.error("[-] keyPress => keys must be an array");
            return null;
        }
        this.keys = keys;
        this.target = target;


        this.keypress = (e) => {
            if (e.ctrlKey) {
                this.keys.forEach(key => {
                    if (Array.isArray(key) && key.length === 2 && key[0] === e.keyCode && typeof(key[1]) === "function") {
                        e.preventDefault();
                        key[1]();
                    }
                })
            }

        }


        this.target.addEventListener('keydown', this.keypress);

        this.Destroy = () => {
            this.target.removeEventListener('keydown', this.keypress);
            this.target = null;
        }
    }
}