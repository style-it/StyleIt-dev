
export default class UndoRedo {

    constructor(firstStep) {
        if (!firstStep) {
            console.log('[UndoRedo] => first step is required..');
            return null;
        }
        this.state = {
            past: [],
            present: null,
            future: [],
        }

        this.set = {
            Past: (snap) => {
                this.state.past.push(snap);
            },
            Future: (snap) => {
                this.state.future.unshift(snap);
            },
            Present(snap) {
                if (this.state.present) {
                    this.Past(this.state.present);
                }
                this.state.present = snap;
            },
            state: this.state,
        };
        this.get = {
            SpliceLastStepFromPast: () => {
                return this.state.past.splice(this.state.past.length - 1, 1);
            }
        }
        this.on = {
            Load: (firstStep) => {
                this.set.Present(firstStep);
            }
        }
        this.on.Load(firstStep);
    }

    destroy() {
        // destroy the events..
    }
    Snapshot(snap) {
        this.set.Past(this.state.present);
        this.set.Present(snap)
        this.state.future = [];
    }
    undo() {
        return new Promise((resolve) => {
            let item = this.get.SpliceLastStepFromPast();
            if (item && item.length > 0) {
                if (this.state.present) {
                    this.set.Future(this.state.present);
                }
                this.state.present = item[0];
                resolve(this.state.present);
            }
            resolve(null);
        });

    }
    redo() {
        return new Promise((resolve) => {
            if (!this.state.present || this.state.future.length === 0) return null;
            let item = this.state.future.length > 0 ? this.state.future.splice(0, 1) : null;
            if (item) {
                this.set.Past(this.state.present);
                this.set.Present(item[0]);
                resolve(this.state.present);
            }
            resolve(null);
        });
    }
}