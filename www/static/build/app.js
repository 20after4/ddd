var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("filter-input", ["require", "exports", "@trevoreyre/autocomplete-js", "@optoolco/tonic", "./datasource.js"], function (require, exports, autocomplete_js_1, tonic_1, datasource_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NavTabs = exports.DaterangeFilter = exports.findTasks = exports.AutocompleteFilter = exports.InputFilter = void 0;
    autocomplete_js_1 = __importDefault(autocomplete_js_1);
    tonic_1 = __importDefault(tonic_1);
    function findTasks(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            var ids = tasks.split(' ');
            var id_str = ids.map(id => "'" + id + "'").join(",");
            var query = `/metrics/Task.json??sql=select+name%2C+status%2C+phid%2C+dateCreated%2C+dateModified%2C+description%2C+authorPHID%2C+ownerPHID%2C+priority%2C+points%2C+subtype%2C+closerPHID%2C+dateClosed%2C+[custom.points.final]%2C+[custom.deadline.start]%2C+id%2C+type%2C+attachments+from+Task+WHERE+id+in+(${id_str})+order+by+dateModified&_shape=objects&_size=max`;
            const response = yield fetch(query);
            const fetched = yield response.json();
            return fetched;
        });
    }
    exports.findTasks = findTasks;
    function dispatchChangeEvent(target, value) {
        const event = new CustomEvent('change', {
            bubbles: true,
            detail: { text: () => value }
        });
        target.dispatchEvent(event);
    }
    class FilterBase extends tonic_1.default {
        constructor() {
            super();
            this.state.values = this.state.values || {};
        }
        modifyState(parentState) {
            if (parentState.values) {
                parentState.values[this.id] = this.value;
            }
        }
        setState(parentState) {
            if (parentState.values[this.id]) {
                this.value = parentState.values[this.id];
            }
        }
        connected() {
            this.classList.add('filter');
        }
        set value(val) {
            this.state.values[this.id] = val;
        }
        get value() {
            return this.state.values[this.id];
        }
    }
    class AutocompleteFilter extends FilterBase {
        static stylesheet() {
            return `
    .autocomplete-input {
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
          <input class="autocomplete-input" controller="${this.id}" value="Release-Engineering-Team" name="${this.id}_text" id="${this.id}_text" placeholder="Enter project name or #hashtag" type="search">
          <ul class="autocomplete-result-list"></ul>
          <input type="hidden" name="${this.id}" controller="${this.id}" class='filter-input' id="${this.id}">
        </div>
      `;
        }
        fetchProjectsJSON() {
            return __awaiter(this, void 0, void 0, function* () {
                return (0, datasource_js_1.fetchData)('project_tree');
            });
        }
        modifyState(parentState) {
            if (parentState.values) {
                parentState.values[this.id] = this.value['phid'];
            }
        }
        setState(parentState) {
            if (parentState.values[this.id]) {
                var hiddeninput = this.querySelector('input[type=hidden]');
                var val = parentState.values[this.id];
                if (val['phid']) {
                    hiddeninput.value = val['phid'];
                    val['value'] = val['phid'];
                    this.value = val;
                }
                else {
                    const self = this;
                    const cb = function () {
                        setTimeout(function () {
                            self.value = self.state.projects.lookup('phid', val);
                        }, 30);
                    };
                    if (this.state.projects['then']) {
                        this.state.projects.then(cb);
                    }
                    else {
                        cb();
                    }
                }
            }
        }
        set value(val) {
            if (val == this.state.values[this.id]) {
                return;
            }
            this.state.values[this.id] = val;
            this.completer.setValue(val);
            dispatchChangeEvent(this, val);
        }
        get value() {
            if (!this.state.values[this.id]) {
                var hiddeninput = this.querySelector('input[type=hidden]');
                return hiddeninput.value;
            }
            return this.state.values[this.id];
        }
        connected() {
            return __awaiter(this, void 0, void 0, function* () {
                const self = this;
                this.state.projects = this.fetchProjectsJSON().then(fetched => {
                    self.state.projects = fetched;
                });
                this.classList.add('filter');
                const state = this.state;
                var hiddeninput = this.querySelector('input[type=hidden]');
                this.completer = new autocomplete_js_1.default(this.querySelector('.autocomplete'), {
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
                            var score = 0;
                            for (let w of words) {
                                var cnt = 0;
                                var len = strings.length;
                                for (let s of strings) {
                                    if (!s) {
                                        continue;
                                    }
                                    if (s == text) {
                                        cnt += (3 * len);
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
                                    len--;
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
                        var result = state.projects.filter(score);
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
            });
        }
    }
    exports.AutocompleteFilter = AutocompleteFilter;
    tonic_1.default.add(AutocompleteFilter);
    class InputFilter extends FilterBase {
        connected() {
            this.classList.add('filter');
            this.state.inputs = this.querySelectorAll('input');
            const self = this;
            this.inputListener = function (e) {
                self.input(e);
            };
            var i;
            for (i of this.state.inputs) {
                if (this.state[i.id]) {
                    i.value = this.state[i.id];
                }
                else {
                    this.state[i.id] = i.value;
                }
            }
        }
        input(e) {
            this.state.values[e.target.id] = e.target.value;
            dispatchChangeEvent(this, this.value);
        }
        get value() {
            return this.state["filter_" + this.id];
        }
        set value(val) {
            this.querySelector('#filter_' + this.id).value = val;
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
    exports.InputFilter = InputFilter;
    tonic_1.default.add(InputFilter);
    class DaterangeFilter extends InputFilter {
        static stylesheet() {
            return `
    input[type=search]::-webkit-search-cancel-button {
      -webkit-appearance: searchfield-cancel-button;
    }
    `;
        }
        constructor() {
            super();
            if (!this.state.values)
                this.state.values = {};
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
            dispatchChangeEvent(this, this.value);
        }
        modifyState(parentState) {
            if (parentState.values) {
                parentState.values[this.id + '_start'] = this.start;
                parentState.values[this.id + '_end'] = this.end;
                delete parentState.values[this.id];
            }
        }
        setState(parentState) {
            const start = this.id + '_start';
            const end = this.id + '_end';
            this.value = parentState.values[this.id];
            this.start = parentState.values[start];
            this.end = parentState.values[end];
        }
        get value() {
            return this.start + ':' + this.end;
        }
        set value(val) {
            if (val == undefined) {
                return;
            }
            if (val.indexOf(':') > 0) {
                const vals = val.split(':');
                this.start = vals[0];
                this.end = vals[1];
            }
            else if (val !== ':') {
                this.start = '';
                this.end = val;
            }
            else {
                this.start = '';
                this.end = '';
            }
        }
        get start() {
            return this.state.values[this.id + '_start'];
        }
        set start(val) {
            this.state.values[this.id + '_start'] = val;
            this.querySelector('#' + this.id + '_start').value = val;
        }
        get end() {
            return this.state.values[this.id + '_end'];
        }
        set end(val) {
            this.state.values[this.id + '_end'] = val;
            this.querySelector('#' + this.id + '_end').value = val;
        }
        disconnected() {
        }
        render() {
            const id = this.id;
            return this.html `
    <div id="${id}" class="p-0 d-inline-flex input-group filter-type-daterange align-self-center">
    <span class="input-group-text">From:</span>
    <input id="${id}_start" controller="${id}" name="${id}_start" class="form-control range-start" type="date"  aria-label="Start Date">
    <span class="input-group-text">To:</span>
    <input id="${id}_end" controller="${id}" name="${id}_end" class="form-control range-end" type="date"  aria-label="End Date">
    </div>
    `;
        }
    }
    exports.DaterangeFilter = DaterangeFilter;
    tonic_1.default.add(DaterangeFilter);
    class NavTabs extends InputFilter {
        set value(val) {
            this.state.values[this.id] = val;
        }
        get value() {
            return this.state.values[this.id];
        }
        set selected(tab) {
            if (this.state.selected == tab) {
                return;
            }
            if (this.state.selected) {
                this.state.selected.value = false;
            }
            if (!tab.value) {
                tab.value = true;
            }
            this.state.selected = tab;
            this.value = tab.id;
        }
        click(e) {
            if (!e.target.matches('.nav-link'))
                return;
            e.preventDefault();
            e.stopPropagation();
            const panel = e.target.parentElement.getAttribute('panel');
            this.selected = document.getElementById(panel).parentElement;
        }
        render() {
            const val = this.value;
            const tabs = this.children;
            const tabitems = [];
            for (const tab of tabs) {
                if (tab.id == val) {
                    tab.selected = true;
                    this.selected = tab;
                }
                else {
                    tab.selected = false;
                }
                tabitems.push(tab);
            }
            return this.html `
    <ul class="nav nav-tabs">

    </ul>
    ${this.children}
    `;
        }
    }
    exports.NavTabs = NavTabs;
    tonic_1.default.add(NavTabs);
    class TabItem extends tonic_1.default {
        set selected(val) {
            this.value = val;
        }
        get value() {
            return this.state.value;
        }
        set value(val) {
            this.state.value = val;
            if (val) {
                this.state.panel.classList.remove('hidden');
                this.state.tab.classList.add('active');
            }
            else {
                this.state.panel.classList.add('hidden');
                this.state.tab.classList.remove('active');
            }
        }
        connected() {
            const parentTabs = this.parentElement.querySelector('.nav-tabs');
            if (parentTabs) {
                const tab = this.querySelector('.nav-link');
                parentTabs.appendChild(tab.parentElement);
                this.state.tab = tab;
                this.state.panel = document.getElementById('panel-' + this.id);
            }
        }
        get selected() {
            return this.value;
        }
        render() {
            const selected = this.selected ? 'active' : '';
            const hidden = this.selected ? '' : 'hidden';
            const label = this.props.label;
            return this.html `
    <li class='nav-item' panel='panel-${this.id}'>
      <a class='nav-link ${selected}' href='#panel-${this.id}'>${this.props.label}</a>
    </li>
    <div class='panel ${hidden}' id='panel-${this.id}'>
      ${this.childNodes}
    </div>
    `;
        }
    }
    tonic_1.default.add(TabItem);
});
define("DashboardApp", ["require", "exports", "@optoolco/tonic", "filter-input"], function (require, exports, tonic_2, filter_input_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputFilter = exports.DashboardApp = void 0;
    tonic_2 = __importDefault(tonic_2);
    Object.defineProperty(exports, "InputFilter", { enumerable: true, get: function () { return filter_input_js_1.InputFilter; } });
    class DashboardApp extends tonic_2.default {
        constructor() {
            super();
            if (history.state) {
                this.setState(history.state);
            }
            else {
                this.state.values = {};
            }
        }
        connected() {
            this.setState();
            this.addEventListener('change', this.change);
            const self = this;
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
        }
        popstate(e) {
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
        }
        submit(e, originalTarget) {
            e.preventDefault();
            e.stopPropagation();
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
                for (const ele of this.querySelectorAll(`[data-state="${k}"]`)) {
                    ele.stateChanged(k, this.state.values);
                    invalidated.add(ele);
                }
            }
            for (const ele of invalidated) {
                ele.reRender();
            }
            if (stateChanged) {
                console.log('submit', this.state.values);
                history.pushState(this.state, window.document.title, url);
                for (const c of this.querySelectorAll('.stateful-component')) {
                    c.setState(this.state);
                }
                const res = fetch(url.toString()).then(function (response) {
                    if (response.status === 200) {
                        const tmpl = document.createElement('template');
                        response.text().then(function (text) {
                            tmpl.innerHTML = text;
                            const newBody = tmpl.content.querySelector('.metrics-report');
                            const oldBody = document.querySelector('.metrics-report');
                            oldBody.replaceWith(newBody);
                        });
                    }
                });
            }
            return false;
        }
        render() {
            return this.html `
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
    }
    exports.DashboardApp = DashboardApp;
    tonic_2.default.add(DashboardApp);
    exports.default = DashboardApp;
});
define("autocomplete", ["require", "exports", "@trevoreyre/autocomplete-js/dist/autocomplete.esm.js"], function (require, exports, autocomplete_esm_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findTasks = exports.projectSearcher = void 0;
    autocomplete_esm_js_1 = __importDefault(autocomplete_esm_js_1);
    function findTasks(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            var ids = tasks.split(' ');
            var id_str = ids.map(id => "'" + id + "'").join(",");
            var query = `/metrics/Task.json??sql=select+name%2C+status%2C+phid%2C+dateCreated%2C+dateModified%2C+description%2C+authorPHID%2C+ownerPHID%2C+priority%2C+points%2C+subtype%2C+closerPHID%2C+dateClosed%2C+[custom.points.final]%2C+[custom.deadline.start]%2C+id%2C+type%2C+attachments+from+Task+WHERE+id+in+(${id_str})+order+by+dateModified&_shape=objects&_size=max`;
            const response = yield fetch(query);
            const fetched = yield response.json();
            return fetched;
        });
    }
    exports.findTasks = findTasks;
    function projectSearcher() {
        var projects = [];
        function fetchProjectsJSON() {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch("/metrics/project_tree.json?_shape=objects&_size=max&_ttl=86400");
                const fetched = yield response.json();
                return fetched;
            });
        }
        const elements = document.querySelectorAll('.autocomplete');
        if (elements && elements.length) {
            fetchProjectsJSON().then(fetched => {
                projects = fetched.rows;
            });
        }
        elements.forEach(el => {
            var hiddeninput = el.parentElement.querySelector('input[type=hidden]');
            var completer = new autocomplete_esm_js_1.default(el, { search: input => {
                    if (input.length < 1) {
                        return [];
                    }
                    let text = input.toLowerCase();
                    let words = text.split(/\W+/);
                    function score(project) {
                        var strings = [project.name.toLowerCase()];
                        if (project.slug) {
                            strings.push(project.slug);
                        }
                        var score = 0;
                        for (let w of words) {
                            var cnt = 0;
                            for (let s of strings) {
                                if (!s) {
                                    continue;
                                }
                                if (s.startsWith(text)) {
                                    cnt += 2;
                                }
                                if (s.startsWith(w)) {
                                    cnt++;
                                }
                                if (s.includes(w)) {
                                    cnt++;
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
                    var result = projects.filter(score);
                    if (result.length > 1) {
                        result = result.sort(function (a, b) {
                            return score(b) - score(a);
                        });
                    }
                    return result;
                },
                autoSelect: true,
                onUpdate: (results, selectedIndex) => {
                    if (selectedIndex > -1) {
                        hiddeninput.value = results[selectedIndex].phid;
                    }
                    else {
                        hiddeninput.value = '';
                    }
                },
                onSubmit: result => {
                    if (result && result.phid) {
                        result = result.phid;
                    }
                    else {
                        result = '';
                    }
                    hiddeninput.value = result;
                },
                getResultValue: result => result.name,
                renderResult: (result, props) => `
          <li ${props}>
            <div>
              ${result.name}
            </div>
          </li>
        `,
                debounceTime: 500,
            });
        });
    }
    exports.projectSearcher = projectSearcher;
});
define("index", ["require", "exports", "@optoolco/tonic", "@trevoreyre/autocomplete-js", "DashboardApp", "./datasource.js", "./tonic-chart.js", "filter-input"], function (require, exports, tonic_3, autocomplete_js_2, DashboardApp_js_1, datasource_js_2, tonic_chart_js_1, filter_input_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DaterangeFilter = exports.AutocompleteFilter = exports.InputFilter = exports.Autocomplete = exports.Tonic = exports.TonicChart = exports.DataSource = exports.DashboardApp = void 0;
    tonic_3 = __importDefault(tonic_3);
    autocomplete_js_2 = __importDefault(autocomplete_js_2);
    DashboardApp_js_1 = __importDefault(DashboardApp_js_1);
    exports.Tonic = tonic_3.default;
    exports.Autocomplete = autocomplete_js_2.default;
    exports.DashboardApp = DashboardApp_js_1.default;
    Object.defineProperty(exports, "DataSource", { enumerable: true, get: function () { return datasource_js_2.DataSource; } });
    Object.defineProperty(exports, "TonicChart", { enumerable: true, get: function () { return tonic_chart_js_1.TonicChart; } });
    Object.defineProperty(exports, "AutocompleteFilter", { enumerable: true, get: function () { return filter_input_js_2.AutocompleteFilter; } });
    Object.defineProperty(exports, "InputFilter", { enumerable: true, get: function () { return filter_input_js_2.InputFilter; } });
    Object.defineProperty(exports, "DaterangeFilter", { enumerable: true, get: function () { return filter_input_js_2.DaterangeFilter; } });
});
//# sourceMappingURL=app.js.map