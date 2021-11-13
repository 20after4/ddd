import Tonic from './_snowpack/pkg/@optoolco/tonic.js'


function param_replacer(query_params) {
  /* match patterns like  [[ PREFIX :param SUFFIX ]] */
  const param_pattern = /(\[\[(.+))?:([\w_]+)((.+)\]\])?/gi;
  const replace_func = function(match, p1, p2, param, s1, s2) {

    if (param in query_params) {
      if (p2 && param && s2) {
        // the optional parameter is present in the request.
        // remove the square brackets but keep everything else intact.
        return p2+':'+param+s2;
      } else {
        // regular non-optional parameter. return the bare placeholder.
        return ':'+param;
      }
    } else {
      if (p2 && s2) {
        // square brackets makes this parameter optional.
        // Remove the placeholder and the brackets when the parameter is not provided.
        return '';
      } else {
        // no square brackets, just leave the placeholder.
        return match;
      }

    }
  };
  return function(text) {
    return text.replaceAll(param_pattern, replace_func);
  }
}

class DataSource extends Tonic {

  constructor() {
    super();
    this.query = {}
  }
  static stylesheet () {
    return `
      data-source {
        display: none;
      }
    `
  }

  set query(query_params) {
    this.props.query = query_params;
    this.replacer = param_replacer(query_params);
  }


  get url() {
    return new URL(this.props.baseurl, document.baseURI);
  }

  async fetch (opts = {}) {
    const res = await window.fetch(this.url.toString(), opts);
    this.props.data = await res.json();
    this.reRender();
    return this.props.data;
  }

  get queries() {
    if ('data' in this.props && 'queries' in this.props.data){
      return this.props.data.queries;
    }
    return [];
  }


  disconnected() {

  }

  async connected () {

  }

  renderStaticDatasets() {
    return this.html`
    <static-data-set id='ds-project_tree'
     url="/metrics/project_tree.json?_shape=objects&_size=max&_ttl=86400">
    </static-data-set>
    `;
  }

  render () {
    const queries = []
    for (const query /* :Object */ of this.queries) {
      var attrs = {
          name:query.name,
          title:query.title
      }
      if (query.params && query.params.length) {
        attrs['params'] = query.params.join(",") || '';
      }
      queries.push(this.html`<data-set id='ds-${attrs.name}' url='${this.url}' ...${attrs}>${query.sql}</data-set>`)
    }
    const staticsets = this.renderStaticDatasets();
    return this.html`
      ${queries}
      ${staticsets}
      ${this.children}
    `;
  }
}
Tonic.add(DataSource);

class BaseDataSet extends Tonic {
  connected() {
    this.setAttribute('data-state', 'project');
  }
  stateChanged(key, values) {
    console.log('stateChanged on', this, key, values);
  }
}

class DataSet extends BaseDataSet {
  static stylesheet () {
    return `
      data-set, static-data-set {
        display: block;
        white-space: pre;
        padding: 10px;
        border: 1px solid black;
        margin: 5px auto;
      }
    `
  }

  async fetch(){
    if (this.state.data) {
      return this.state.data;
    }
    this.props.url = this.props.url || this.parentElement.url;
    var sql = this.innerText;
    sql = this.parentElement.replacer(sql.toString());

    const url = new URL(this.props.url);
    url.searchParams.set('sql', sql.toString());
    const query_params = this.parentElement.props.query;
    for (const prop in query_params) {
      url.searchParams.set(prop,query_params[prop])
    }
    const res = await window.fetch(url.toString());
    const fetched = await res.json();
    this.state.data = new DatasetCursor(this, fetched);
    return this.state.data;
  }
  render (p1, p2, p3) {
    return this.html`${this.props.sql}${this.childNodes}`;
  }
}


class StaticDataSet extends BaseDataSet {
  async fetch() {
    if (this.state.data) {
      return this.state.data;
    }
    const url = this.props.url;
    const response = await fetch(url);
    const fetched = await response.json();
    this.state.data = new DatasetCursor(this, fetched);
    return this.state.data;
  }
}
Tonic.add(StaticDataSet);
Tonic.add(DataSet);

class DatasetCursor {
  data = {};
  indexes = {}
  constructor(datasource, data) {
    this.datasource = datasource;
    this.data = data;
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
    return this.data.rows.filter(cb, thisarg)
  }

  index(key) {
    if (!this.indexes[key]){
      const idx = {}
      for (const row of this.data.rows) {
        idx[row[key]] = row;
      }
      this.indexes[key] = idx;
    }
    return this.indexes[key]
  }

  lookup(key, val) {
    const idx = this.index(key)
    return idx[val];
  }


}

function fetchData(dataset_id) {
  // @ts-ignore
  return document.getElementById('ds-'+dataset_id).fetch();
}

export {DataSource, BaseDataSet, DataSet, StaticDataSet, fetchData}