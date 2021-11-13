import Tonic from './_snowpack/pkg/@optoolco/tonic.js';
import { InputFilter } from './filter-input.js';
class DashboardApp extends Tonic {
    connected() {
        this.setState();
        this.addEventListener('change', this.change);
        const self = this;
        const form = this.querySelector('form');
        this.submitListener = function(e) {
            self.submit(e, this);
        };
        this.popstateListener = function(e) {
            window.setTimeout(function() {
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
        for(const i in e.target.state.values){
            this.state.values[i] = e.target.state.values[i];
        }
        console.log('change:', e, this.state.values);
    }
    popstate(e1) {
        this.setState(history.state);
    }
    setState(state = null) {
        if (state) {
            this.state = state;
        }
        const form = this.querySelector('form');
        if (!form) {
            return;
        }
        for (const ele of form.elements){
            var eleid = ele.getAttribute('controller');
            var filter_ele = document.getElementById(eleid);
            if (filter_ele) {
                filter_ele.setState(this.state);
            } else {
                eleid = ele.id;
            }
            if (this.state.values.hasOwnProperty(eleid)) {
                const val = this.state.values[eleid] || '';
                document.getElementById(eleid).value = val;
            }
        }
    }
    submit(e2, originalTarget) {
        e2.preventDefault();
        e2.stopPropagation();
        for (var child of this.querySelectorAll('.filter')){
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
        const url = new URL(window.location.href);
        for(const k in this.state.values){
            var val = this.state.values[k];
            if (val && val['value']) {
                val = val['value'];
            } else if (!val) {
                val = '';
            }
            url.searchParams.set(k, val);
        }
        console.log('submit', this.state.values);
        history.pushState(this.state, '', url);
        const res = fetch(url.toString()).then(function(response) {
            if (response.status === 200) {
                const tmpl = document.createElement('template');
                response.text().then(function(text) {
                    tmpl.innerHTML = text;
                    const newBody = tmpl.content.querySelector('.metrics-report');
                    const oldBody = document.querySelector('.metrics-report');
                    oldBody.replaceWith(newBody);
                });
            }
        });
        return false;
    }
    render() {
        return this.html`
    <form id='form_${this.id}'>
    <data-source id='datasource'></data-source>
    <div class="container-fluid p-0 dashboard-filters">

          <autocomplete-filter id='project'></autocomplete-filter>

          <input-filter id='task_id' label='Task' style='display:none'></input-filter>
          <input-filter id='column' label='Column' style='display:none'></input-filter>

          <daterange-filter id='date'>
          </daterange-filter>

          <div id="filter-group-buttons" class="col-sm-1 align-self-center align-items-center col-auto">
            <input type="submit" value="Update" class="button">
          </div>


    </div>


    </form>
    ${this.childNodes}

`;
    }
    constructor(){
        super();
        if (history.state) {
            this.setState(history.state);
        } else {
            this.state.values = {
            };
        }
    }
}
Tonic.add(DashboardApp);
export { DashboardApp, InputFilter };
export default DashboardApp;
