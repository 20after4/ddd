import Tonic from '@operatortc/tonic';
import {TonicIcon} from './TonicIcon.js'
import TonicLoader from '@operatortc/components/loader/'
import { DataSource, DataSet, BaseDataSet, initDataSets} from './datasource.js';
import { InputFilter, DaterangeFilter, NavTabs, TabItem, AutocompleteFilter } from './filter-input.js';
import { VegaChart } from './vega-tonic.js'
import {DependableComponent, Query} from "./dom.js"
import { DateTime } from "luxon";
import { ModalDialog} from "./ui.js"

function initApp() {
  if (window['BASE_URL'])
    DependableComponent._base_url = window['BASE_URL'];
  initDataSets();
  Tonic.add(TonicIcon);
  Tonic.add(TonicLoader.TonicLoader, 'tonic-loader');
  Tonic.add(AutocompleteFilter);
  Tonic.add(InputFilter);
  Tonic.add(DaterangeFilter);
  Tonic.add(VegaChart);

  Tonic.add(DashboardApp);
  initDataSets();
  const app = <DashboardApp> <unknown>document.getElementsByTagName('dashboard-app')[0];


  console.log('---------------- init ----------------')
}


class DashboardApp extends DependableComponent {
  query:Query;
  submitListener:any;
  popstateListener:any;

  constructor() {
    super();
    this.query = Query.init();


    this.addEventListener('change', this.change);

    const form = this.querySelector('form');
    this.submitListener = (e) => {
      this.submit(e);
    }
    this.popstateListener = (e) => {
      window.setTimeout(() => {
        this.popstate(e);
      }, 0);
    }
    form.addEventListener('submit', this.submitListener);
    window.addEventListener('popstate', this.popstateListener);
    this.setState(this.query);

    const loaded = (event?) => {
        console.log("Content loaded");
        for (const chart of document.querySelectorAll('vega-chart')) {
          (chart as unknown as VegaChart).loadcharts();
        }
        this.loadContent(this.query.url);
    };
    if (document.readyState === 'loading') {  // Loading hasn't finished yet
      document.addEventListener('DOMContentLoaded', loaded);
    } else {  // `DOMContentLoaded` has already fired
      loaded();
    }
  }

  update_state_listeners() {
    if (this.query.change_count) {
      for (const ele of this.querySelectorAll(`[data-state="*"]`) as any as DataSet[]) {
        ele.stateChanged('project', this.query.state_changes);
      }
    }
    this.query.reset_changes();
  }

  change(e) {
    if (!e.target.state){
      return;
    }

    this.query.set(e.target.id, e.target.value)
    console.log('changed', e.target.id, e.target.value);
    this.update_state_listeners();
  }

  popstate(e){
    this.debug('popstate', e);
    if (e.state) {
      const url = new URL(location.href)
      this.query.url = url;
      this.query.state = e.state;
      this.setState(e.state);
      this.loadContent(url);
    }
  }

  setState(state=null) {
    console.log('setState');
    //this.update_state_listeners();
    for (const ele of this.querySelectorAll('.filter') as any as InputFilter[]) {
      console.log('setState',ele,this.query);
      ele.setState(this.query);
    }
  }

  submit(e?){
    //const e = arguments[0];
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    for (var child of this.querySelectorAll('.filter') as any as InputFilter[]) {
      if (child['modifyState']) {
        child.modifyState(this.query);
      }
    }

    const state_changes = this.query.reset_changes();

    const invalidated:Set<BaseDataSet> = new Set();
    for (const k in state_changes) {
      for (const ele of this.querySelectorAll(`[data-state~="${k}"], [data-state="*"]`) as any as DataSet[]) {
        ele.stateChanged(k, state_changes);
        invalidated.add(ele);
      }
    }

    this.debug('submit', this.query);
    history.pushState(this.query.state, window.document.title, this.query.url);

    for (const ele of invalidated) {
      this.debug('rerender', ele);
      ele.reRender();
    }

    this.loadContent(this.query.url);
    return false;
  }

  async loadContent(url:URL) {
    console.log('loadContent', url);

    // for (const ele of  document.querySelectorAll('data-set')) {
    //   const ds = ele as unknown as DataSet;
    //   ds.reRender();
    // }

    var reportUrl = new URL(url);
    reportUrl.pathname = url.pathname.replace('dashboard/project-metric', 'cycletime/')
    console.log('reportUrl', reportUrl.href);
    const response = await fetch(reportUrl.href);
    if (response.status === 200) {
      const tmpl = document.createElement('template');
      const text = await response.text();
      tmpl.innerHTML=text;
      const newBody = tmpl.content.querySelector('.metrics-report');
      const oldBody = document.querySelector('#cycle');
      oldBody.replaceChildren(newBody);
    }
  }

  render() {
    return this.html`
    ${this.elements}
    `;
  }
}



initApp();


export {DashboardApp, InputFilter, VegaChart, DateTime, TonicIcon};
export default DashboardApp;