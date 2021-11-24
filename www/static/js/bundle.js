import Tonic from '@operatortc/tonic';
import TonicLoader from '@operatortc/components/loader/';
import Autocomplete from '@trevoreyre/autocomplete-js';
import { DateTime } from 'luxon';
export { DateTime } from 'luxon';
import vegaEmbed, { vega } from 'vega-embed';

class TonicIcon extends Tonic {
  defaults () {
    return {
      size: '25px',
      fill: 'var(--tonic-primary, #333)'
    }
  }

  static stylesheet () {
    return `
      tonic-icon {
        vertical-align: middle;
      }

      tonic-icon svg path {
        fill: inherit;
      }
    `
  }

  styles () {
    const {
      size
    } = this.props;

    return {
      icon: {
        width: size,
        height: size
      }
    }
  }

  render () {
    const {
      symbolId,
      size,
      fill,
      theme,
      src,
      tabindex
    } = this.props;

    if (tabindex) this.removeAttribute('tabindex');
    if (theme) this.classList.add(`tonic--theme--${theme}`);

    return this.html`
      <svg ... ${{
        styles: 'icon',
        tabindex
      }}
      role="img">
        <use ... ${{
          href: `${src || ''}#${symbolId}`,
          'xlink:href': `${src || ''}#${symbolId}`,
          width: size,
          fill,
          color: fill,
          height: size
        }}>
      </svg>
    `
  }
}

class Query {
    constructor() {
        this.valid_search_params = ['project', 'date_start', 'date_end'];
        this._changed = { change_count: 0 };
        const now = new Date();
        this._state = {
            project: "default",
            date_start: this.default_start,
            date_end: now.toISOString()
        };
        this.url = new URL(window.location.href);
        if (history.state) {
            this.state = history.state;
        }
    }
    static init(state) {
        if (!Query.singleton_instance) {
            Query.singleton_instance = new Query();
        }
        const instance = Query.singleton_instance;
        if (state) {
            instance.assign(state);
        }
        return instance;
    }
    set state(newState) {
        const state = this._state;
        for (const key in newState) {
            const val = newState[key];
            console.log('state[' + key + ']=' + val);
            if (state[key] && state[key] !== val || !state[key]) {
                this.set(key, val);
            }
        }
    }
    set(key, val) {
        if (this._state[key] === val) {
            return;
        }
        this._state[key] = val;
        this._changed[key] = val;
        if (this.valid_search_params.indexOf(key) >= 0) {
            this.url.searchParams.set(key, val);
        }
        this._changed['change_count']++;
        return this;
    }
    set url(url) {
        this._url = url;
        this.state = Object.fromEntries(url.searchParams);
    }
    get url() {
        const url = this._url;
        for (const i in this.valid_search_params) {
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
        this._changed = { change_count: 0 };
        return changed;
    }
    get state() {
        return this._state;
    }
    get project() {
        return this._state.project;
    }
    set project(val) {
        this._state.project = val;
    }
    get date_start() {
        return this._state.date_start;
    }
    set date_start(val) {
        this._state.date_start = val;
    }
    get date_end() {
        return this._state.date_end;
    }
    set date_end(val) {
        this._state.date_end = val;
    }
    get values() {
        return this._state;
    }
    get default_start() {
        var dt = new Date();
        const start_of_quarter = 3 * Math.floor(dt.getMonth() / 3);
        dt.setMonth(start_of_quarter);
        return dt.toISOString();
    }
}
class DependableComponent extends Tonic {
    constructor() {
        super();
        this.hasResolved = false;
    }
    ele(selector) {
        return this.querySelector(selector);
    }
    inp(selector) {
        return this.querySelector(selector);
    }
    debug(...args) {
        if (DependableComponent.debug_logging) {
            console.info(...args);
        }
    }
    error(...args) {
        console.error(...args);
    }
    log(...args) {
        if (DependableComponent.logging) {
            console.log(...args);
        }
    }
    get base_url() {
        return window['BASE_URL'] || DependableComponent._base_url;
    }
    async waitfor(id) {
        this.id;
        var promise;
        var waiter;
        if (id in DependableComponent._waitingFor) {
            waiter = DependableComponent._waitingFor[id];
            promise = waiter.promise;
        }
        else {
            waiter = { promise: promise, resolver: function () { } };
            promise = new Promise(function (resolve) {
                waiter.resolver = resolve;
            });
            waiter.promise = promise;
            DependableComponent._waitingFor[id] = waiter;
        }
        const self = this;
        promise.then(function (component) {
            self.resolved();
            return component;
        });
        return promise;
    }
    connected() {
        this.resolved();
    }
    resolved() {
        this.hasResolved = true;
    }
}
DependableComponent._base_url = '/';
DependableComponent._waitingFor = {};
DependableComponent.debug_logging = true;
DependableComponent.logging = true;

function param_replacer(query_params) {
    /* match patterns like  [[ PREFIX :param SUFFIX ]] */
    //const param_pattern = /(\[\[([^:]+))?:([\w_]+)(([^\]\[]+)?\]\])?/gi;
    const param_pattern = /:([\w_]+)/gi;
    return function (text) {
        var lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const matches = lines[i].matchAll(param_pattern);
            for (const match of matches) {
                const param = match[1];
                if (!query_params[param]) {
                    console.debug('Removing optional part of SQL query, param missing: ', param, query_params, lines);
                    lines[i] = '';
                }
            }
        }
        return lines.join('\n');
    };
}
class DataSource extends DependableComponent {
    constructor() {
        super();
        this.query = Query.init();
    }
    static stylesheet() {
        return `
      data-source {
        display: none;
      }
    `;
    }
    set query(query_params) {
        this.props.query = query_params;
        this.replacer = param_replacer(query_params);
    }
    get url() {
        return new URL(this.props.baseurl, document.baseURI);
    }
    async fetch(opts = {}) {
        const res = await window.fetch(this.url.toString(), opts);
        this.props.data = await res.json();
        this.reRender();
        return this.props.data;
    }
    get queries() {
        if ('data' in this.props && 'queries' in this.props.data) {
            return this.props.data.queries;
        }
        return [];
    }
    disconnected() {
    }
    async connected() {
    }
    reRender() {
        for (const consumer of document.querySelectorAll(`[data-source="${this.id}"]`)) {
            consumer.reRender();
        }
    }
    render() {
        const queries = [];
        for (const query /* :Object */ of this.queries) {
            var attrs = {
                name: query.name,
                title: query.title
            };
            if (query.params && query.params.length) {
                attrs['params'] = query.params.join(",") || '';
            }
            queries.push(this.html `<data-set id='ds-${attrs.name}' url='${this.url}' ...${attrs}>${query.sql}</data-set>`);
        }
        return this.html `
      ${queries}
      ${this.elements}
    `;
    }
}
class BaseDataSet extends DependableComponent {
    constructor() {
        super();
        this.setAttribute('data-state', '*');
        this.query = Query.init();
    }
    stateChanged(key, values) {
        console.log('stateChanged on', this, key, values);
        this.state.replacer = param_replacer(this.query);
        this.reRender();
        const consumers = document.querySelectorAll(`[data-source="${this.id}"]`);
        for (var ele of consumers) {
            try {
                if ('datasetChanged' in ele) {
                    ele.datasetChanged(this);
                }
            }
            catch (err) {
                console.error(err, ele);
            }
        }
    }
    get url() {
        this.props.url = this.props.url || this.parentElement.url;
        return this.props.url;
    }
}
class DataSet extends BaseDataSet {
    static stylesheet() {
        return `
      data-set, static-data-set {
        display: block;
        white-space: pre;
        padding: 10px;
        border: 1px solid black;
        margin: 5px auto;
      }
    `;
    }
    get url() {
        this.props.url = this.props.url || this.parentElement.url;
        var sql = this.innerText;
        const replacer = this.state.replacer || this.parentElement.replacer;
        sql = replacer(sql.toString());
        var baseurl = window.location.protocol + '//' + window.location.host;
        const url = new URL(this.props.url, baseurl);
        url.searchParams.set('sql', sql.toString());
        const query_params = this.query.state;
        console.log('query_params', query_params, sql);
        for (const prop in query_params) {
            var val = query_params[prop];
            if (!val) {
                continue;
            }
            if (val && val['value']) {
                val = val['value'];
            }
            else if (typeof (val) != 'string' && val.hasOwnProperty("toString")) {
                val = val.toString();
            }
            url.searchParams.set(prop, val);
        }
        return url.href;
    }
    async fetch() {
        const url = this.url;
        // if (this.state['data'] && this.state['data']['rows'] && this.state['data']['url'] == url) {
        //   return new DatasetCursor(this, this.state.data, url);
        // }
        const res = await window.fetch(url);
        const fetched = await res.json();
        const data = new DatasetCursor(this, fetched, url);
        if (!data.rows || data.rows.length < 1) {
            //this.error('empty dataset', fetched, url);
            throw new Error('dataset empty');
        }
        else if (data['error']) {
            this.error('dataset.fetch: error', data);
            throw new Error('dataset fetch returned error: ' + data['error']);
        }
        else {
            this.state.data = fetched;
            this.state.data.url = url;
        }
        return data;
    }
    render(p1, p2, p3) {
        return this.html `${this.props.sql}${this.nodes}`;
    }
}
class StaticDataSet extends DataSet {
    async fetch() {
        const url = this.props.url;
        const response = await fetch(url);
        const fetched = await response.json();
        this.state.data = new DatasetCursor(this, fetched, url);
        return this.state.data;
    }
    render(p1, p2, p3) {
        return this.html `${this.props.sql}${this.nodes}`;
    }
}
class DatasetCursor {
    constructor(dataset, data, url) {
        this.data = { rows: [], columns: [] };
        this.indexes = {};
        this.dataset = dataset;
        this.data = data;
        this.url = url;
    }
    get length() {
        return this.data.rows.length;
    }
    get rows() {
        return this.data.rows;
    }
    get columns() {
        return this.data.columns;
    }
    get rawdata() {
        return this.data;
    }
    filter(cb, thisarg) {
        return this.data.rows.filter(cb, thisarg);
    }
    /**
     * creates an index over one column of the data
     */
    index(key) {
        if (!this.indexes[key]) {
            const idx = {};
            for (const row of this.data.rows) {
                idx[row[key]] = row;
            }
            this.indexes[key] = idx;
        }
        return this.indexes[key];
    }
    /** lookup searches the dataset for a row matching 'val' in the 'key' column
     * this will create an index over the column for faster lookups after the first use.
     */
    lookup(key, val) {
        const idx = this.index(key);
        return idx[val];
    }
}
var data_initdone = false;
function initDataSets() {
    if (data_initdone) {
        return true;
    }
    Tonic.add(DataSource);
    Tonic.add(StaticDataSet);
    Tonic.add(DataSet);
    data_initdone = true;
    return false;
}
async function fetchData(dataset_id) {
    initDataSets();
    if (!dataset_id.startsWith('ds-')) {
        dataset_id = 'ds-' + dataset_id;
    }
    const ds = document.getElementById(dataset_id);
    return await ds.fetch();
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
            else {
                const projects = await fetchData('project_tree');
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
        this.id;
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

class VegaChart extends DependableComponent {
    constructor() {
        super();
        this.props.spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            height: 'container',
            padding: 50,
            autosize: {
                type: "fit",
                contains: "padding"
            },
            view: { stroke: null },
            config: {
                background: '#00000000',
                arc: {
                    innerRadius: 50
                },
                line: {
                    point: true
                }
            }
        };
    }
    static stylesheet() {
        return `
      vega-chart .chart-title {
        font-weight: bold;
      }
      tab-item .panel {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      vega-chart {
        background-color:white;
        display: block;
        margin: 0.5rem 0.5rem;
        padding: 0.5rem;
        border: 1px solid #ddd;
        overflow:hidden;
      }
      vega-chart {
        flex: 1 1 45%;
        position:relative;
        height: auto !important;
        width: auto;
        min-height: 450px;
        max-height: 800px;
        min-width: 600px;
        max-width: 50%;
      }
      vega-chart.view-stack, vega-chart.view-table {
        height: auto;
        width:100%;
        flex: 0 0 100%;
        max-width: 100%;
        max-height: 100%;
        min-height: 550px
      }
      vega-chart.max {
        position: absolute;
        right: 0px;
        left: 0px;
        margin: 0px !important;
        z-index: 1000;
        width: auto;
        height: auto !important;
        bottom: 0px;
        top: 76px;
      }
      vega-chart .vega-embed {
        position:unset;
        display:block;
        width: 100%;
        height: 100%;
        padding-right: 0;
      }
      .vega-embed svg {
        width: 100%;
        height: 100%;
      }
      .view-switcher {
        position: absolute;
        top:2px;
        right:2px;
      }
      .view-switcher label.btn-sm {
        padding: .15rem .3rem;
        outline-width: 1px;
      }

      vega-chart.view-table .vega-embed,
      vega-chart.view-source .vega-embed
       {
        display:none;
      }
      vega-chart .table-view{
        display:none;
      }
      vega-chart.view-table {
        position: relative;
      }
      vega-chart.view-table .table-view {
        display: block;
        width: 100%;
        overflow:scroll;
        height: 100%;
      }
      vega-chart .source-view{
        display:none;
      }
      vega-chart .source-view pre{
        font-family: "Source Code Pro", "DejaVu sans mono", monospace;
      }
      vega-chart.view-source {
        position: relative;
      }
      vega-chart.view-source .source-view {
        display: block;
        width: 100%;
        overflow:scroll;
        height: 100%;
      }
    `;
    }
    render(props) {
        return this.html `
    <div class='chart-title'>${this.props.title}</div>
    ${this.html `<button-group class='view-switcher' id='${this.id}-view-switcher'></button-group>`}
    ${this.elements}
    <div class='vega-embed'>
    <tonic-loader></tonic-loader>
    </div>
    <div class='table-view'>
    </div>
    <div class='source-view'>
    </div>
    `;
    }
    click(e) {
        try {
            const label = e.target.closest('label');
            if (!label)
                return;
            const classes = label.classList;
            if (classes.contains('view-stack')) {
                this.className = 'view-stack';
            }
            else if (classes.contains('view-grid')) {
                this.className = 'view-grid';
            }
            else if (classes.contains('view-table')) {
                this.renderTable();
                this.className = 'view-table';
            }
            else if (classes.contains('view-source')) {
                this.renderSource();
                this.className = 'view-source';
            }
            else {
                this.className = 'view-normal';
            }
        }
        catch (err) {
            this.debug(err, e);
        }
    }
    renderTable() {
        if (this.state.data) {
            console.log(this.state.data);
            const out = [];
            out.push('<table class="table table-striped table-hover table-sm table-bordered"><thead><tr>');
            out.push(`<caption>Tabular source data for the chart titled "${this.props.title}"</caption>`);
            for (const col of this.state.data.columns) {
                out.push("<th>" + col + "</th>");
            }
            out.push("</tr></thead><tbody>");
            for (const row of this.state.data.rows) {
                out.push('<tr>');
                for (const col in row) {
                    out.push("<td>" + row[col] + "</td>");
                }
                out.push('</tr>');
            }
            out.push("</tbody></table>");
            const container = this.querySelector('.table-view');
            container.innerHTML = out.join("");
        }
    }
    renderSource() {
        if (this.state.display) {
            const out = `<div class="jsoneditor"><div>`;
            const container = this.querySelector('.source-view');
            container.innerHTML = out;
            // create the editor
            container.querySelector(".jsoneditor");
            //const jsoneditor = new JSONEditor(jsoncontainer, options)
            //jsoneditor.set(this.state.display)
            // get json
            //const updatedJson = jsoneditor.get()
        }
    }
    datasetChanged(ds) {
        if (this.state.view) {
            this.state.view;
            ds.url;
            this.disconnected();
            this.hasResolved = false;
            this.reRender();
            // fetch(url).then(function(response){
            //   view.data('data', response.json());
            //   view.signal('url', url).run();
            //   view.signal('width', 400).run();
            //   console.log('vega view', view);
            //   console.log('vega state', view.getState());
            // });
        }
        this.loadcharts();
    }
    disconnected() {
    }
    connected() {
        //this.loadcharts();
    }
    updated(props) {
        this.loadcharts();
    }
    loadcharts() {
        if (this.state && this.state.vega) {
            this.state.vega.finalize();
            this.state.vega = null;
            this.state.view = null;
            const vega = this.querySelector('.vega-embed');
            console.log('reload vega', this.state, vega);
            if (vega)
                vega.remove();
        }
        const data_id = this.getAttribute('data-source');
        this.state.data_id = data_id;
        var datasource = this.props.datasource || document.getElementById(data_id);
        this.props.datasource = datasource;
        if (!this.state.display) {
            const script = this.querySelector('script');
            const json = script.innerText;
            this.state.display = JSON.parse(json);
        }
        fetchData(data_id).then((data) => {
            this.state.data = data;
            var spec = {
                ...this.props.spec,
                data: {
                    name: "data",
                    values: data.rows
                    //format: {'type': 'json', 'property': 'rows'}
                },
                ...this.state.display
            };
            vegaEmbed(this.ele('.vega-embed'), spec, { renderer: "svg", actions: false, ...this.props.options }).then((result) => {
                this.state.vega = result;
                this.state.view = result.view;
                if (result.view) {
                    if (DependableComponent.debug_logging) ;
                    else {
                        result.view.logLevel(vega.Error);
                    }
                    result.view.run();
                    this.debug('vega running', result);
                    this.classList.remove('hidden');
                }
                else {
                    this.debug('no vega view');
                }
            }).catch((result) => {
                try {
                    this.classList.add('hidden');
                    if (this.state.vega) {
                        this.state.vega.finalize();
                    }
                    this.debug(result);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }).catch((reason) => {
            this.debug(reason);
            this.classList.add('hidden');
        });
    }
}
class ButtonGroup extends DependableComponent {
    constructor() {
        super(...arguments);
        this.btns = [
            {
                id: 'view-grid',
                icon: 'icon-grid-3x2',
                title: 'Display the chart narrow.',
                checked: true,
            },
            {
                id: 'view-stack',
                icon: 'icon-view-stacked',
                title: 'Display the chart wider.',
                checked: false,
            },
            {
                id: 'view-table',
                icon: 'icon-table',
                title: 'Tabular view of this data.',
                checked: false,
            },
            {
                id: 'view-source',
                icon: 'icon-code-slash',
                title: 'Chart source.',
                checked: false,
            },
        ];
    }
    renderButtons() {
        var btns = [];
        for (const btn of this.btns) {
            const checked = btn.checked ? 'checked' : '';
            btns.push(this.html `
        <input type="radio"
          class="btn-check"
          id="${this.id}-${btn.id}"
          name="${this.id}"
          autocomplete="off"
          value='${btn.id}'
          ${checked}>
        <label class="btn btn-outline-secondary btn-sm ${btn.id}" for="${this.id}-${btn.id}"><span class="visually-hidden">${btn.title}</span>
          <tonic-icon title="${btn.title}" symbol-id="${btn.icon}"
          alt="${btn['alt']}"
          src="${this.base_url}static/icons.svg"
          fill="${btn['color'] ?? 'black'}"
          size="15px"></tonic-icon>
        </label>
      `);
        }
        return btns;
    }
    render() {
        return this.html `
    <form id='form-${this.id}'><div class="btn-group" role="group" aria-label="Basic radio toggle button group">
      ${this.renderButtons()}
    </div></form>`;
    }
}
Tonic.add(ButtonGroup);

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
    document.getElementsByTagName('dashboard-app')[0];
    console.log('---------------- init ----------------');
}
class DashboardApp extends DependableComponent {
    constructor() {
        super();
        this.query = Query.init();
        this.addEventListener('change', this.change);
        const form = this.querySelector('form');
        this.submitListener = (e) => {
            this.submit(e);
        };
        this.popstateListener = (e) => {
            window.setTimeout(() => {
                this.popstate(e);
            }, 0);
        };
        form.addEventListener('submit', this.submitListener);
        window.addEventListener('popstate', this.popstateListener);
        this.setState(this.query);
        setTimeout(() => {
            for (const chart of document.querySelectorAll('vega-chart')) {
                chart.loadcharts();
            }
            this.loadContent(this.query.url);
        }, 3000);
    }
    update_state_listeners() {
        if (this.query.change_count) {
            for (const ele of this.querySelectorAll(`[data-state="*"]`)) {
                ele.stateChanged('project', this.query.state_changes);
            }
        }
        this.query.reset_changes();
    }
    change(e) {
        if (!e.target.state) {
            return;
        }
        this.query.set(e.target.id, e.target.value);
        console.log('changed', e.target.id, e.target.value);
        this.update_state_listeners();
    }
    popstate(e) {
        this.debug('popstate', e);
        if (e.state) {
            const url = new URL(location.href);
            this.query.url = url;
            this.query.state = e.state;
            this.setState(e.state);
            this.loadContent(url);
        }
    }
    setState(state = null) {
        console.log('setState');
        //this.update_state_listeners();
        for (const ele of this.querySelectorAll('.filter')) {
            console.log('setState', ele, this.query);
            ele.setState(this.query);
        }
    }
    submit(e) {
        //const e = arguments[0];
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        for (var child of this.querySelectorAll('.filter')) {
            if (child['modifyState']) {
                child.modifyState(this.query);
            }
        }
        const state_changes = this.query.reset_changes();
        const invalidated = new Set();
        for (const k in state_changes) {
            for (const ele of this.querySelectorAll(`[data-state~="${k}"], [data-state="*"]`)) {
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
    async loadContent(url) {
        console.log('loadContent', url);
        // for (const ele of  document.querySelectorAll('data-set')) {
        //   const ds = ele as unknown as DataSet;
        //   ds.reRender();
        // }
        var reportUrl = new URL(url);
        reportUrl.pathname = url.pathname.replace('dashboard/project-metric', 'cycletime/');
        console.log('reportUrl', reportUrl.href);
        const response = await fetch(reportUrl.href);
        if (response.status === 200) {
            const tmpl = document.createElement('template');
            const text = await response.text();
            tmpl.innerHTML = text;
            const newBody = tmpl.content.querySelector('.metrics-report');
            const oldBody = document.querySelector('#cycle');
            oldBody.replaceChildren(newBody);
        }
    }
    render() {
        return this.html `
    ${this.elements}
    `;
    }
}
initApp();

export { DashboardApp, InputFilter, TonicIcon, VegaChart, DashboardApp as default };
