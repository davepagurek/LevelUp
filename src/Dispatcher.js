let listeners = {};
let reducers = {};

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

const Dispatcher = {
  stateComponent: null,
  on: function(event, callback) {
    getListeners(event).push(callback);
    return this;
  },
  reduce: function(event, callback) {
    getReducers(event).push(callback);
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
      (state) =>
        getReducers(event).reduce(
          (prevState, reducer) => reducer(prevState, data),
          state
        )
    );
    return this;
  },
  setRootStateComponent: function(component) {
    this.stateComponent = component;
    return this;
  }
};
