import Tonic from '@operatortc/tonic';
import { DependableComponent, Query } from "./dom.js";
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
        this.debug('stateChanged on', this, key, values);
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
                this.error(err, ele);
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
        const param_attr = this.props.params;
        const params = param_attr.split(',');
        var sql = this.innerText;
        const replacer = this.state.replacer || this.parentElement.replacer;
        sql = replacer(sql.toString());
        var baseurl = window.location.protocol + '//' + window.location.host;
        const url = new URL(this.props.url, baseurl);
        url.searchParams.set('sql', sql.toString());
        const query_params = this.query.state;
        this.debug('query_params', query_params, sql);
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
        for (const param of params) {
            if (!query_params[param]) {
                // param required but missing a value
                throw new Error('Missing query param: ' + param);
            }
        }
        return url.href;
    }
    async fetch(cache = true) {
        const url = this.url;
        if (cache == true &&
            this.state['data'] &&
            this.state['data']['rows'] &&
            this.state['data']['url'] == url) {
            return new DatasetCursor(this, this.state.data, url);
        }
        const res = await window.fetch(url);
        const fetched = await res.json();
        const data = new DatasetCursor(this, fetched, url);
        if (!data.rows || data.rows.length < 1) {
            //this.error('empty dataset', fetched, url);
            throw new Error('dataset empty: ' + url);
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
    async fetch(ids) {
        const url = new URL(this.props.url, window.location.protocol + '//' + window.location.host);
        if (this.props.sql) {
            var sql = this.props.sql;
            if (ids) {
                var placeholders = [];
                var i = 0;
                for (var i = 1; i <= ids.length; i++) {
                    placeholders.push(":id" + i);
                    url.searchParams.set('id' + i, ids[i - 1]);
                }
                sql = sql.replace('?*', placeholders.join(','));
            }
            url.searchParams.set('sql', sql);
        }
        const response = await fetch(url.href);
        const fetched = await response.json();
        this.state.data = new DatasetCursor(this, fetched, url.href);
        return this.state.data;
    }
    render(p1, p2, p3) {
        return this.html `${this.props.sql}${this.nodes}`;
    }
}
function makeTimeoutPromise(data = {}, time_ms = 1) {
    return new Promise(async (resolve, reject) => {
        setTimeout(() => {
            resolve(data);
        }, time_ms);
    });
}
/**
 * AsyncComponentFetcher -
 * handles loading a bunch of objects from the back end
 * database by batching individual calls to load() and bundling them together into
 * one call to the backend where the rows are loaded in a single query of the form:
 * SELECT * FROM Table WHERE pk IN (id1, id2, ..., idn)
 *
 * The async load(id) function blocks up to 10ms to allow a bunch of async calls to collect
 * the ids that are needed and then load will batch the calls into one fetch, finally the
 * results of the fetch are unbundled and returned by the individual promises.
 */
class AsyncComponentFetcher {
    constructor(ds, cls, pk) {
        this.requestedIds = [];
        this.ds = ds;
        this.cls = cls;
        this.data = {};
        this.pk = pk;
    }
    async load(id) {
        if (this.data[id]) {
            return this.data[id];
        }
        if (this.requestedIds.indexOf(id) == -1) {
            this.requestedIds.push(id);
        }
        if (!this.batching) {
            this.batching = makeTimeoutPromise({}, 10);
            await this.batching;
            const ids = this.requestedIds;
            if (ids.length) {
                this.requestedIds = [];
                const pending = new Promise(async (resolve, reject) => {
                    const data = await this.ds.fetch(ids);
                    for (const obj of data.rows) {
                        this.data[obj[this.pk]] = new this.cls(obj);
                    }
                    resolve(data);
                    this.pending = null;
                });
                this.pending = pending;
                await pending;
            }
            this.batching = null;
        }
        else {
            await this.batching;
        }
        if (this.pending) {
            await this.pending;
        }
        return this.data[id];
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
const fetchDataCache = {};
async function fetchData(dataset_id, cache = true, wait = true) {
    initDataSets();
    if (!dataset_id.startsWith('ds-')) {
        dataset_id = 'ds-' + dataset_id;
    }
    const ds = document.getElementById(dataset_id);
    if (!ds) {
        throw new Error(`dataset not found: ${dataset_id}`);
    }
    const promise = ds.fetch();
    if (wait) {
        return await promise;
    }
    else {
        return promise;
    }
}
export { DataSource, BaseDataSet, DataSet, StaticDataSet, initDataSets, fetchData, AsyncComponentFetcher };
//# sourceMappingURL=datasource.js.map