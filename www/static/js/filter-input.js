import Autocomplete from "@trevoreyre/autocomplete-js";
import Tonic from '@operatortc/tonic';
import { fetchData } from './datasource.js';
import { DependableComponent, Query } from "./dom.js";
import { DateTime } from "luxon";
async function findTasks(tasks) {
    var ids = tasks.split(' ');
    var id_str = ids.map(id => "'" + id + "'").join(",");
    var query = `/metrics/Task.json??sql=select+name%2C+status%2C+phid%2C+dateCreated%2C+dateModified%2C+description%2C+authorPHID%2C+ownerPHID%2C+priority%2C+points%2C+subtype%2C+closerPHID%2C+dateClosed%2C+[custom.points.final]%2C+[custom.deadline.start]%2C+id%2C+type%2C+attachments+from+Task+WHERE+id+in+(${id_str})+order+by+dateModified&_shape=objects&_size=max`;
    const response = await fetch(query);
    const fetched = await response.json();
    return fetched;
}
function dispatchChangeEvent(target, value) {
    const event = new CustomEvent('change', {
        bubbles: true,
        detail: { text: () => value }
    });
    target.dispatchEvent(event);
}
class FilterBase extends DependableComponent {
    constructor() {
        super();
        this.query = Query.init();
    }
    modifyState(query) {
        query.set(this.id, this.value);
    }
    setState(query) {
        this.query = query;
    }
    connected() {
        super.connected();
        this.classList.add('filter');
    }
    set value(val) {
        this.query.set(this.id, val);
        this.changed = true;
    }
    get value() {
        return this.query[this.id];
    }
    get changed() {
        return this.state.changed;
    }
    set changed(val) {
        this.state.changed = val;
    }
    blur() {
        const e = arguments[0];
        if (this.changed) {
            this.changed = false;
            dispatchChangeEvent(this, this.value);
        }
    }
}
class AutocompleteFilter extends FilterBase {
    static stylesheet() {
        return `
    .autocomplete-input {
      position: relative;
      border: 1px solid #ccc;
      border-radius: 8px;
      width: 100%;
      padding: 7px 7px 7px 48px;
      box-sizing: border-box;
      position: relative;
      font-size: 16px;
      line-height: 1.5;
      flex: 1;
      background-color: #eee;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iOCIvPjxwYXRoIGQ9Ik0yMSAyMWwtNC00Ii8+PC9zdmc+');
      background-repeat: no-repeat;
      background-position: 12px center;
    }

    .autocomplete-input:focus,
    .autocomplete-input[aria-expanded="true"] {
      border-color: rgba(0, 0, 0, 0.12);
      background-color: #fff;
      outline: none;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.16);
    }
    .autocomplete-input .x  {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
    }
    [data-position="below"] .autocomplete-input[aria-expanded="true"] {
      border-bottom-color: transparent;
      border-radius: 8px 8px 0 0;
    }

    [data-position="above"] .autocomplete-input[aria-expanded="true"] {
      border-top-color: transparent;
      border-radius: 0 0 8px 8px;
      z-index: 2;
    }

    /* Loading spinner */
    .autocomplete[data-loading="true"]::after {
      content: "";
      border: 3px solid rgba(0, 0, 0, 0.12);
      border-right: 3px solid rgba(0, 0, 0, 0.48);
      border-radius: 100%;
      width: 20px;
      height: 20px;
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      animation: rotate 1s infinite linear;
    }

    .autocomplete-result-list {
      margin: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      padding: 0;
      box-sizing: border-box;
      max-height: 296px;
      overflow-y: auto;
      background: #fff;
      list-style: none;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.16);
    }

    [data-position="below"] .autocomplete-result-list {
      margin-top: -1px;
      border-top-color: transparent;
      border-radius: 0 0 8px 8px;
      padding-bottom: 8px;
    }

    [data-position="above"] .autocomplete-result-list {
      margin-bottom: -1px;
      border-bottom-color: transparent;
      border-radius: 8px 8px 0 0;
      padding-top: 8px;
    }

    /* Single result item */
    .autocomplete-result {
      cursor: default;
      padding: 12px 12px 12px 48px;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iOCIvPjxwYXRoIGQ9Ik0yMSAyMWwtNC00Ii8+PC9zdmc+');
      background-repeat: no-repeat;
      background-position: 12px center;
    }

    .autocomplete-result:hover,
    .autocomplete-result[aria-selected="true"] {
      background-color: rgba(0, 0, 0, 0.06);
    }

    @keyframes rotate {
      from {
        transform: translateY(-50%) rotate(0deg);
      }
      to {
        transform: translateY(-50%) rotate(359deg);
      }
    }
    `;
    }
    render() {
        return this.html `
        <div class="autocomplete filter-group" data-expanded="false" data-loading="false" data-position="below">
          <input class="autocomplete-input" controller="${this.id}" name="${this.id}_text" id="${this.id}_text" placeholder="Enter project name or #hashtag">
          <tonic-icon class='x' symbol-id="icon-x-square" src="${this.base_url}static/icons.svg" fill="black" size="24px"></tonic-icon>
          <ul class="autocomplete-result-list"></ul>
          <input type="hidden" name="${this.id}" controller="${this.id}" class='filter-input' id="${this.id}">
        </div>
      `;
    }
    click() {
        const e = arguments[0];
        try {
            const icon = e.target.closest('tonic-icon');
            if (icon && icon.classList.contains('x')) {
                e.stopPropagation();
                icon.style.visibility = 'hidden';
                this.value = '';
                this.input.focus();
            }
        }
        catch (err) {
            this.error(err);
        }
    }
    modifyState(query) {
        if (this.value && this.value['phid']) {
            query.set(this.id, this.value['phid']);
        }
    }
    async setState(query) {
        this.query = query;
        if (query[this.id]) {
            var hiddeninput = this.querySelector('input[type=hidden]');
            var val = query[this.id];
            if (val['phid']) {
                hiddeninput.value = val['phid'];
                val['value'] = val['phid'];
                this.value = val;
            }
            else if (!this.state.projects) {
                const projects = await fetchData('project_tree', true, false);
                this.state.projects = projects;
                this.value = projects.lookup('phid', val);
            }
        }
    }
    set value(val) {
        if (val === this.query[this.id]) {
            return;
        }
        if (val && val['phid']) {
            val.toString = function () { return this['phid']; };
        }
        this.query[this.id] = val;
        this.completer.setValue(val);
        this.changed = true;
        try {
            if (val != '') {
                const x = this.ele('.x');
                x.style.visibility = 'visible';
            }
        }
        catch (err) {
            this.error(err);
        }
        //dispatchChangeEvent(this, val);
    }
    get value() {
        if (!this.query[this.id]) {
            var hiddeninput = this.inp('input[type=hidden]');
            return hiddeninput.value;
        }
        return this.query[this.id];
    }
    connected() {
        this.input = this.inp('.autocomplete-input');
        const self = this;
        const state = this.state;
        fetchData('project_tree').then(function (data) {
            state.projects = data;
        });
        this.classList.add('filter');
        this.completer = new Autocomplete(this.querySelector('.autocomplete'), {
            search: function (input) {
                if (input.length < 1) {
                    return [];
                }
                let text = input.toLowerCase();
                let words = text.split(/\W+/);
                function score(project) {
                    var strings = [project.name.toLowerCase()];
                    if (project.slug) {
                        strings.push(project.slug.toLowerCase());
                    }
                    if (project.path && project.path != project.name) {
                        strings.push(project.path.toLowerCase());
                    }
                    if (project.name.indexOf('-')) {
                        const parts = project.name.toLowerCase().split('-');
                        for (const part of parts) {
                            strings.push(part);
                        }
                    }
                    var score = 0;
                    for (let w of words) {
                        var cnt = 0;
                        var len = 3;
                        for (let s of strings) {
                            if (!s) {
                                continue;
                            }
                            if (s == text) {
                                cnt += (4 * len);
                            }
                            if (s.startsWith(text)) {
                                cnt += (2 * len);
                            }
                            if (s.startsWith(w)) {
                                cnt += (len);
                            }
                            if (s.includes(w)) {
                                cnt += (len);
                            }
                            if (s == 'team' || s == 'kanban' || s == 'roadmap') {
                                cnt += 1;
                            }
                            if (len > 1) {
                                len--;
                            }
                        }
                        if (cnt < 1) {
                            score = 0;
                            break;
                        }
                        else {
                            score += cnt;
                        }
                    }
                    return score;
                }
                const projects = state.projects || [];
                var result = projects.filter(score);
                if (result.length > 1) {
                    result = result.sort(function (a, b) {
                        return score(b) - score(a);
                    });
                }
                return result;
            },
            onUpdate: (results, selectedIndex) => {
                if (selectedIndex > -1) {
                    const val = results[selectedIndex];
                    self.value = val;
                }
            },
            onSubmit: result => {
                if (result && result.phid) {
                    self.value = result;
                }
            },
            getResultValue: result => result.name || result,
            renderResult: function (result, props) {
                const slug = result.slug ? `- <span class='slug'>#${result.slug}</span>` : '';
                return `
        <li ${props}>
          <div>
            ${result.path}${slug}
          </div>
        </li>
      `;
            },
            debounceTime: 500,
            autoSelect: false
        });
    }
}
class InputFilter extends FilterBase {
    connected() {
        this.classList.add('filter');
        this.state.inputs = this.querySelectorAll('input');
    }
    input(e) {
        this.query.set(this.id, e.target.value);
        this.changed = true;
    }
    get value() {
        return this.query[this.id];
    }
    set value(val) {
        this.inp('#filter_' + this.id).value = val;
    }
    render() {
        const id = this.id;
        var name = this.props.name || id;
        var label = this.props.label || name;
        return this.html `
      <div id="filter-group-${id}" class="filter-group input-group dashboard-filter filter-type-text">
      <span class="input-group-text"><label for="filter_${id}">${label}</label></span>
      <input id="filter_${id}" controller="${id}" name="${name}" class="form-control filter-input" type="text">
      </div>`;
    }
}
class DaterangeFilter extends InputFilter {
    static stylesheet() {
        return `
    input[type=search]::-webkit-search-cancel-button {
      -webkit-appearance: searchfield-cancel-button;
    }
    `;
    }
    input(e) {
        const id = this.id;
        const ele = e.target;
        if (ele.classList.contains('range-start')) {
            this.start = ele.value;
        }
        else if (ele.classList.contains('range-end')) {
            this.end = ele.value;
        }
        dispatchChangeEvent(this, ele.value);
    }
    modifyState(query) {
        query.set(this.id + '_start', this.start);
        query.set(this.id + '_end', this.end);
    }
    setState(query) {
        this.end = query[this.id + '_end'];
        this.start = query[this.id + '_start'];
    }
    get value() {
        return this.start + ':' + this.end;
    }
    set value(val) {
    }
    get start() {
        return this.get(this.id + '_start');
    }
    get end() {
        return this.get(this.id + '_end');
    }
    get(id) {
        try {
            return this.inp('#' + id).value;
        }
        catch (err) {
            return this.query[id];
        }
    }
    set start(val) {
        const id = this.id + '_start';
        this.inp('#' + id).value = val;
    }
    set end(val) {
        const id = this.id + '_end';
        this.inp('#' + id).value = val;
    }
    disconnected() {
    }
    click() {
        const e = arguments[0];
        const href = e.target.getAttribute('href');
        if (!href) {
            return;
        }
        const prefix = '#' + this.id + '_start=';
        if (href.startsWith(prefix)) {
            e.preventDefault();
            var value = href.substring(prefix.length);
            if (value.indexOf('&') > 0) {
                const values = value.split('&');
                value = values[0];
                const idx = values[1].indexOf('=');
                this.end = values[1].substring(idx + 1);
            }
            this.start = value;
            const app = this.closest('dashboard-app');
            setTimeout(function () {
                app.submit();
            }, 100);
        }
    }
    render() {
        const id = this.id;
        const dt = DateTime.now();
        const yr = dt.startOf('year');
        const qt = dt.startOf('quarter');
        const pq = qt.minus({ months: 3 });
        const mn = dt.startOf('month');
        return this.html `
    <div id="${id}" class="p-0 d-inline-flex input-group filter-type-daterange align-self-center">

    <div class='btn-group'>
      <button type="button" class="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">From</button>
      <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="#date_start=${mn.toISODate()}&date_end=${mn.endOf('month').toISODate()}">This Month ${mn.toISODate()}</a></li>
        <li><a class="dropdown-item" href="#date_start=${qt.toISODate()}&date_end=${qt.endOf('quarter').toISODate()}">This Quarter ${qt.toISODate()}</a></li>
        <li><a class="dropdown-item" href="#date_start=${pq.toISODate()}&date_end=${pq.endOf('quarter').toISODate()}">Last Quarter ${pq.toISODate()}</a></li>
        <li><a class="dropdown-item" href="#date_start=${yr.toISODate()}&date_end=${dt.endOf('year').toISODate()}">This Year ${yr.toISODate()}</a></li>
      </ul>
      </div>
    <!--<span class="input-group-text">From:</span>-->
    <input id="${id}_start" controller="${id}" value='${this.start}' class="form-control range-start" type="date"  aria-label="Start Date">

    <span class="input-group-text">To:</span>
    <input id="${id}_end" controller="${id}" value='${this.end}' class="form-control range-end" type="date"  aria-label="End Date">
    </div>
    `;
    }
}
class NavTabs extends InputFilter {
    constructor() {
        super();
        this.tabs = this.elements;
    }
    set value(val) {
        this.query[this.id] = val;
    }
    get value() {
        return this.query[this.id];
    }
    set selected(tab) {
        if (this.state.selected == tab) {
            return;
        }
        if (this.state.selected) {
            this.state.selected.value = 0;
        }
        tab.value = 1;
        this.state.selected = tab;
        this.value = tab.id;
    }
    connected() {
        for (const tab of this.tabs) {
            if (tab.classList.contains('active')) {
                this.state.selected = tab;
                tab.selected = true;
            }
            else {
                tab.selected = false;
            }
        }
        if (!this.querySelector('.nav-tabs')) {
            this.reRender();
        }
    }
    click(e) {
        if (!e.target.matches('.nav-link'))
            return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.target.parentElement;
        const panel_id = target.getAttribute('panel');
        const panel = document.getElementById(panel_id);
        this.tabs.forEach(tab => tab.selected = false);
        panel.selected = true;
        this.selected = panel;
        const nav = this.querySelector('.nav-tabs');
        nav.innerHTML = this.renderTabs().join('\n');
    }
    renderTabs() {
        const tabs = this.tabs.map(tab => {
            const selected = tab.selected ? 'active' : '';
            const label = tab.getAttribute('label');
            const aria = tab.selected ? 'aria-current="page"' : '';
            return this.html `
      <li class='nav-item' ${aria} panel='${tab.id}'>
        <a class='nav-link ${selected}' href='#${tab.id}'>${label}</a>
      </li>`;
        });
        return tabs;
    }
    render() {
        console.log('this.tabs', this.tabs);
        return this.html `
    <ul class="nav nav-tabs">
      ${this.renderTabs()}

    </ul>
    <div class='tab-panels'>
    ${this.elements}
    </div>
    `;
    }
}
class TabItem extends DependableComponent {
    isTrue(val) {
        return val == 1 || val == '1' || val == true || val == 'true';
    }
    get value() {
        return this.props.value;
    }
    set value(val) {
        //this.debug.log('value', val, this.props.value, this.selected)
        this.props.value = val;
        this.setAttribute('value', this.props.value);
        if (this.isTrue(val)) {
            this.parentElement.selected = this;
            this.classList.remove('hidden');
            this.classList.add('active');
            for (const ele of this.querySelectorAll('vega-chart')) {
                if (ele['state'] && ele['state']['view']) {
                    ele['state']['view'].resize().run();
                }
            }
            window.dispatchEvent(new Event('resize'));
        }
        else {
            this.classList.add('hidden');
            this.classList.remove('active');
        }
    }
    connected() {
        this.value = this.props.value || this.props.selected;
    }
    set selected(val) {
        this.value = val;
    }
    get selected() {
        return this.isTrue(this.props.value);
    }
    render() {
        return this.html `
      ${this.nodes}
    `;
    }
}
Tonic.add(TabItem);
Tonic.add(NavTabs);
export { InputFilter, AutocompleteFilter, findTasks, DaterangeFilter, NavTabs, TabItem };
//# sourceMappingURL=filter-input.js.map