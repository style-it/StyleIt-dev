'use strict';

const Apply = Function.prototype.apply;
const privateMap = new WeakMap();

// For making private properties.
function internal(obj) {
  if (!privateMap.has(obj)) {
    privateMap.set(obj, {});
  }

  return privateMap.get(obj);
}

export default class Emitter {

  constructor() {
    const self = internal(this);

    self._events = new Set();
    self._callbacks = {};

    return this;
  }
  _addCallback(eventName, callback, context, weight) {
    this._getCallbacks(eventName)
      .push({
        callback,
        context,
        weight
      });

    this._getCallbacks(eventName)
      .sort((a, b) => a.weight > b.weight);

    return this;
  }

  _getCallbacks(eventName) {
    return internal(this)._callbacks[eventName];
  }

  _getCallbackIndex(eventName, callback) {
    return this._has(eventName) ?
      this._getCallbacks(eventName)
        .findIndex((element) => element.callback === callback) : null;
  }
  _callbackIsExists(eventName, callback, context) {
    const callbackInd = this._getCallbackIndex(eventName, callback);
    const activeCallback = callbackInd !== -1 ?
      this._getCallbacks(eventName)[callbackInd] : void 0;

    return (callbackInd !== -1 && activeCallback &&
      activeCallback.context === context);
  }

  _has(eventName) {
    return internal(this)._events.has(eventName);
  }

  on(eventName, callback, context = null, weight = 1) {
    const self = internal(this);

    if (typeof callback !== 'function') {
      throw new TypeError(`${callback} is not a function`);
    }

    // If event wasn't added before - just add it
    // and define callbacks as an empty object.
    if (!this._has(eventName)) {
      self._events.add(eventName);
      self._callbacks[eventName] = [];
    } else {
        if (this._callbackIsExists(...arguments)) {
        console.warn(`Event "${eventName}"` +
          ` already has the callback ${callback}.`);
      }
    }

    this._addCallback(...arguments);

    return this;
  }


  off(eventName, callback = null) {
    const self = internal(this);
    let callbackInd;

    if (this._has(eventName)) {
      if (callback === null) {
        // Remove the event.
        self._events.delete(eventName);
        // Remove all listeners.
        self._callbacks[eventName] = null;
      } else {
        callbackInd = this._getCallbackIndex(eventName, callback);

        if (callbackInd !== -1) {
          self._callbacks[eventName].splice(callbackInd, 1);
          // Remove all equal callbacks.
          this.off(...arguments);
        }
      }
    }

    return this;
  }
  emit(eventName, ...args) {
    if (this._has(eventName)) {
      // All callbacks will be triggered sorter by "weight" parameter.
      this._getCallbacks(eventName)
        .forEach((element) =>
          Apply.call(element.callback, element.context, args)
        );
    }

    return this;
  }

  clear() {
    const self = internal(this);

    self._events.clear();
    self._callbacks = {};

    return this;
  }

 ז
  listenersNumber(eventName) {
    return this._has(eventName) ?
      this._getCallbacks(eventName).length : null;
  }
}
