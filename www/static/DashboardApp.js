import Tonic from '@optoolco/tonic';
import { initDataSets } from './datasource.js';
import { InputFilter, DaterangeFilter, NavTabs, TabItem, AutocompleteFilter } from './filter-input.js';
import { VegaChart } from './vega-tonic.js';
import { DependableComponent } from "./dom.js";
function initApp() {
    initDataSets();
    Tonic.add(AutocompleteFilter);
    Tonic.add(InputFilter);
    Tonic.add(DaterangeFilter);
    Tonic.add(NavTabs);
    Tonic.add(TabItem);
    Tonic.add(DashboardApp);
    Tonic.add(VegaChart);
    const app = document.getElementsByTagName('dashboard-app')[0];
    var state;
    if (history.state) {
        state = history.state;
    }
    else {
        const url = new URL(window.location.href);
        state = { "values": { 'project': url.searchParams.get('project'),
                'date_start': url.searchParams.get('date_start'),
                'date_end': url.searchParams.get('date_end')
            } };
    }
    app.setState(state);
    for (const chart of document.querySelectorAll('vega-chart')) {
        chart.loadcharts();
    }
    console.log('---------------- init ----------------');
}
class DashboardApp extends DependableComponent {
    constructor() {
        super();
        this.state.values = {} || this.state.values;
        const self = this;
        this.addEventListener('change', this.change);
        const form = this.querySelector('form');
        this.submitListener = function (e) {
            self.submit(e, this);
        };
        this.popstateListener = function (e) {
            window.setTimeout(function () {
                self.popstate(e);
            }, 0);
        };
        //form.addEventListener('submit', this.submitListener);
        window.addEventListener('popstate', this.popstateListener);
    }
    change(e) {
        if (!e.target.state) {
            return;
        }
        this.state.values[e.target.id] = e.target.value;
        for (const i in e.target.state.values) {
            this.state.values[i] = e.target.state.values[i];
        }
        console.log('change:', e, this.state.values);
        for (const ele of document.querySelectorAll('data-set')) {
            const ds = ele;
            ds.state.query = this.state.values;
            ds.reRender();
        }
    }
    popstate(e) {
        if (e.state) {
            this.setState(e.state);
        }
    }
    setState(state = null) {
        if (state) {
            this.state = state;
        }
        const form = this.querySelector('form');
        if (!form) {
            return;
        }
        for (const ele of form.elements) {
            var eleid = ele.getAttribute('controller');
            var filter_ele = document.getElementById(eleid);
            if (filter_ele) {
                filter_ele.setState(this.state);
            }
            else {
                eleid = ele.id;
            }
            if (this.state.values.hasOwnProperty(eleid)) {
                const val = this.state.values[eleid] || '';
                const ele = document.getElementById(eleid);
                ele.value = val;
            }
        }
        this.submit(null, null);
    }
    submit(e, originalTarget) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        for (var child of this.querySelectorAll('.filter')) {
            if (child['modifyState']) {
                child.modifyState(this.state);
            }
        }
        if (!this.state.values['project']) {
            var input = this.querySelector('.autocomplete input');
            input.focus();
            input.select();
            return false;
        }
        const stateChanges = {};
        const url = new URL(window.location.href);
        for (const k in this.state.values) {
            var val = this.state.values[k];
            if (val && val['value']) {
                val = val['value'];
            }
            if (val) {
                if (url.searchParams.get(k) !== val) {
                    url.searchParams.set(k, val);
                    stateChanges[k] = val;
                }
            }
            else if (url.searchParams.has(k)) {
                url.searchParams.delete(k);
                stateChanges[k] = null;
            }
        }
        var stateChanged = false;
        const invalidated = new Set();
        for (const k in stateChanges) {
            stateChanged = true;
            for (const ele of this.querySelectorAll(`[data-state~="${k}"], [data-state="*"]`)) {
                ele.stateChanged(k, this.state.values);
                invalidated.add(ele);
            }
        }
        if (stateChanged) {
            console.log('submit', this.state.values);
            history.pushState(this.state, window.document.title, url);
            for (const ele of invalidated) {
                console.log('rerender', ele);
                ele.reRender();
            }
            for (const c of this.querySelectorAll('.stateful-component')) {
                c.setState(this.state);
            }
            //   const res = fetch(url.toString()).then(function(response) {
            //     if (response.status === 200) {
            //       const tmpl = document.createElement('template');
            //       response.text().then(function(text){
            //         tmpl.innerHTML=text;
            //         const newBody = tmpl.content.querySelector('.metrics-report');
            //         const oldBody = document.querySelector('.metrics-report');
            //         oldBody.replaceWith(newBody);
            //       });
            //     }
            //   });
        }
        return false;
    }
    render() {
        return this.html `
    ${this.elements}
    `;
    }
}
initApp();
export { DashboardApp, InputFilter, VegaChart };
export default DashboardApp;
//# sourceMappingURL=DashboardApp.js.map