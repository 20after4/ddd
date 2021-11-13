import Tonic from '@optoolco/tonic';
import { DependableComponent } from "./dom.js";
function param_replacer(query_params) {
    /* match patterns like  [[ PREFIX :param SUFFIX ]] */
    const param_pattern = /(\[\[([^:]+))?:([\w_]+)(([^\]\[]+)?\]\])?/gi;
    const replace_func = function (match, p1, p2, param, s1, s2) {
        if (param in query_params) {
            if (p2 && param && s2) {
                // the optional parameter is present in the request.
                // remove the square brackets but keep everything else intact.
                return p2 + ':' + param + s2;
            }
            else if (p2 && param && s1 == ']]') {
                return p2 + ':' + param;
            }
            else {
                // regular non-optional parameter. return the bare placeholder.
                return ':' + param;
            }
        }
        else {
            if (p2 && s2) {
                // square brackets makes this parameter optional.
                // Remove the placeholder and the brackets when the parameter is not provided.
                return '';
            }
            else {
                // no square brackets, just leave the placeholder.
                return match;
            }
        }
    };
    return function (text) {
        var lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            lines[i] = lines[i].replaceAll(param_pattern, replace_func);
        }
        return lines.join('\n');
    };
}
class DataSource extends DependableComponent {
    constructor() {
        super();
        this.query = {};
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
        const app = this.closest('dashboard-app');
        if (app && app.state) {
            this.state.query = app.state.values;
        }
    }
    stateChanged(key, values) {
        console.log('stateChanged on', this, key, values);
        this.state.query = values;
        this.state.replacer = param_replacer(values);
        this.reRender();
        const consumers = document.querySelectorAll(`[data-source="${this.id}"]`);
        for (var ele of consumers) {
            ele.datasetChanged(this);
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
        const query_params = this.state.query;
        for (const prop in query_params) {
            var val = query_params[prop];
            if (val && val['value']) {
                val = val['value'];
            }
            url.searchParams.set(prop, val);
        }
        console.log('query_params', query_params, url.href, sql);
        return url.href;
    }
    async fetch() {
        const url = this.url;
        const res = await window.fetch(url);
        const fetched = await res.json();
        this.state.data = new DatasetCursor(this, fetched);
        return this.state.data;
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
        this.state.data = new DatasetCursor(this, fetched);
        return this.state.data;
    }
    render(p1, p2, p3) {
        return this.html `${this.props.sql}${this.nodes}`;
    }
}
class DatasetCursor {
    constructor(dataset, data) {
        this.data = { rows: [], columns: [] };
        this.indexes = {};
        this.dataset = dataset;
        this.data = data;
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
export { DataSource, BaseDataSet, DataSet, StaticDataSet, initDataSets, fetchData };
//# sourceMappingURL=datasource.js.map