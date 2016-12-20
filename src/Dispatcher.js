const listeners = {};
const reducers = {};
const reducerCallbacks = {};

const getListeners = function(event) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  return listeners[event];
};

const getReducers = function(event) {
  if (!reducers[event]) {
    reducers[event] = [];
  }
  return reducers[event];
};
const getReducerCallbacks = function(event) {
  if (!reducerCallbacks[event]) {
    reducerCallbacks[event] = [];
  }
  return reducerCallbacks[event];
};

const Dispatcher = {
  stateComponent: null,
  on: function(event, callback) {
    getListeners(event).push(callback);
    return this;
  },
  reduce: function(event, reducer, callback) {
    getReducers(event).push(reducer);
    if (callback) {
      getReducerCallbacks(event).push(callback);
    }
    return this;
  },
  off: function(event, callback) {
    listeners[event] = getListeners(event).filter((c) => c != callback);
    return this;
  },
  clear: function(event) {
    delete listeners[event];
    return this;
  },
  emit: function(event, data) {
    getListeners(event).forEach((c) => c(data));
    this.calculateState(event, data);
    return this;
  },
  calculateState: function(event, data) {
    this.stateComponent.setState(
      (state) => getReducers(event).reduce(
        (prevState, reducer) => reducer(prevState, data),
        state
      ),
      () => getReducerCallbacks(event).forEach((callback) => callback(data))
    );
    return this;
  },
  setRootStateComponent: function(component) {
    this.stateComponent = component;
    return this;
  }
};

const defer = function(callback) {
  setTimeout(callback, 0);
};
const error = function(message) {
  defer(() => Dispatcher.emit('error', {message}));
};
