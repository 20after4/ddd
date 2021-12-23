import Tonic from '@operatortc/tonic';

function waitForID(id, context=null) {
  return new Promise(resolve => {
    var ele = document.getElementById(id);
    if (ele) {
        return resolve(ele);
    }

    const observer = new MutationObserver(mutations => {
      const ele = document.getElementById(id);
      if (ele) {
        resolve(ele);
        observer.disconnect();
      }
    });

    observer.observe(context||window.document, {
      childList: true,
      subtree: true
    });
  });
}
interface WaitingForId {
  [index: string]: {
    promise: Promise<DependableComponent>,
    resolver: Function };
}
interface ComponentState{
  [index:string]: any
}
type PHID = string;

interface QueryState {
  project?:PHID;
  date_start?: string;
  date_end?: string;
  [key: string]: any;
}
type StringAnyMap = {
  [key: string]: any
}


class Query {
  valid_search_params = ['project', 'date_start', 'date_end'];
  _url:URL;
  static singleton_instance;
  _state:QueryState;
  _changed:StringAnyMap;
  static init(state?:QueryState) {
    if (!Query.singleton_instance) {
      Query.singleton_instance = new Query();
    }
    const instance = Query.singleton_instance;
    if (state){
      instance.assign(state);
    }
    return instance;
  }

  constructor(){
    this._changed = {change_count: 0};
    const now = new Date();
    this._state = {
      project:"default",
      date_start: this.default_start,
      date_end: now.toISOString()
    }
    this.url = new URL(window.location.href);
    if (history.state) {
      this.state = history.state;
    }
  }

  set state(newState) {
    const state = this._state;
    for (const key in newState) {
      const val = newState[key];
      //console.log('state['+key+']='+val);
      if (state[key] && state[key] !== val || !state[key]) {
        this.set(key, val);
      }
    }
  }
  set(key, val) {
    if (this._state[key] === val){
      return;
    }
    this._state[key] = val;
    this._changed[key] = val;
    if (this.valid_search_params.indexOf(key) >= 0){
      this.url.searchParams.set(key, val);
    }
    this._changed['change_count']++;
    return this;
  }
  set url(url:URL) {
    this._url = url;
    this.state = Object.fromEntries(url.searchParams);
  }
  get url() {
    const url = this._url;
    for (const i in this.valid_search_params){
      const k = this.valid_search_params[i];
      url.searchParams.set(k, this._state[k]);
    }
    return url;
  }
  get state_changes() {
    return this._changed;
  }
  get change_count() {
    return this._changed['change_count'];
  }

  reset_changes() {
    const changed = this._changed;
    this._changed = {change_count: 0};
    return changed;
  }
  get state() {
    return this._state;
  }

  get project() {
    return this._state.project;
  }
  set project(val){
    this._state.project = val;
  }
  get date_start() {
    return this._state.date_start;
  }
  set date_start(val){
    this._state.date_start = val;
  }
  get date_end() {
    return this._state.date_end;
  }
  set date_end(val){
    this._state.date_end = val;
  }
  get values() {
    return this._state;
  }
  get default_start() {
    var dt = new Date();
    const start_of_quarter = 3*Math.floor(dt.getMonth() / 3);
    dt.setMonth(start_of_quarter);
    return dt.toISOString();
  }
}

class DependableComponent extends Tonic {
  static _base_url = '/';
  ele(selector) {
    return this.querySelector(selector);
  }

  inp(selector) {
    return this.querySelector(selector);
  }

  hasResolved = false;
  static _waitingFor:WaitingForId = { };
  static debug_logging = false;
  static logging = true;
  debug(...args) {
    if (DependableComponent.debug_logging){
      console.info(...args)
    }
  }
  error(...args) {
    console.error(...args);
  }
  log(...args) {
    if (DependableComponent.logging){
      console.log(...args);
    }
  }
  constructor(data=null) {
    super();
    if (data) {
      this.state.data = data;
    }
  }
  get base_url() {
    return window['BASE_URL'] || DependableComponent._base_url;
  }
  async waitfor(id) {
    const myid = this.id;
    var promise;
    var waiter
    if (id in DependableComponent._waitingFor) {
      waiter = DependableComponent._waitingFor[id];
      promise = waiter.promise;
    } else {
      waiter = { promise: promise, resolver: function(){} };
      promise = new Promise(function(resolve){
        waiter.resolver = resolve;
      });
      waiter.promise = promise;
      DependableComponent._waitingFor[id] = waiter;
    }
    const self = this;
    promise.then(function(component) {
      self.resolved();
      return component;
    });
    return promise;
  }
  connected() {
    this.resolved()
  }

  resolved() {
    this.hasResolved = true;
  }
}

export {DependableComponent, Query, waitForID }