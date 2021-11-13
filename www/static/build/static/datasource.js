import Tonic from '../_snowpack/pkg/@optoolco/tonic.js'


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
      queries.push(this.html`<data-set url='${this.url}' ...${attrs}>${query.sql}</data-set>`)
    }
    return this.html`
      ${queries}
      ${this.children}
    `;
  }
}
Tonic.add(DataSource);


class DataSet extends Tonic {
  static stylesheet () {
    return `
      data-set {
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
    const data = await res.json();
    return data;
  }
  render (p1, p2, p3) {
    return this.html`${this.props.sql}${this.childNodes}`;
  }
}

Tonic.add(DataSet);

export {DataSource, DataSet}