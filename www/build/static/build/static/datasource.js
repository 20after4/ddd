import Tonic from '../_snowpack/pkg/@optoolco/tonic.js';
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function param_replacer(query_params) {
    /* match patterns like  [[ PREFIX :param SUFFIX ]] */ const param_pattern = /(\[\[(.+))?:([\w_]+)((.+)\]\])?/gi;
    const replace_func = function(match, p1, p2, param, s1, s2) {
        if (param in query_params) {
            if (p2 && param && s2) {
                // the optional parameter is present in the request.
                // remove the square brackets but keep everything else intact.
                return p2 + ':' + param + s2;
            } else {
                // regular non-optional parameter. return the bare placeholder.
                return ':' + param;
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
    };
}
class DataSource extends Tonic {
    static stylesheet() {
        return `
      data-source {
        display: none;
      }
    `;
    }
    set query(query_params1) {
        this.props.query = query_params1;
        this.replacer = param_replacer(query_params1);
    }
    get url() {
        return new URL(this.props.baseurl, document.baseURI);
    }
    fetch(opts = {
    }) {
        return _asyncToGenerator((function*() {
            const res = yield window.fetch(this.url.toString(), opts);
            this.props.data = yield res.json();
            this.reRender();
            return this.props.data;
        }).bind(this))();
    }
    get queries() {
        if ('data' in this.props && 'queries' in this.props.data) {
            return this.props.data.queries;
        }
        return [];
    }
    disconnected() {
    }
    connected() {
        return _asyncToGenerator(function*() {
        })();
    }
    render() {
        const queries = [];
        for (const query /* :Object */  of this.queries){
            var attrs = {
                name: query.name,
                title: query.title
            };
            if (query.params && query.params.length) {
                attrs['params'] = query.params.join(",") || '';
            }
            queries.push(this.html`<data-set url='${this.url}' ...${attrs}>${query.sql}</data-set>`);
        }
        return this.html`
      ${queries}
      ${this.children}
    `;
    }
    constructor(){
        super();
        this.query = {
        };
    }
}
Tonic.add(DataSource);
class DataSet extends Tonic {
    static stylesheet() {
        return `
      data-set {
        display: block;
        white-space: pre;
        padding: 10px;
        border: 1px solid black;
        margin: 5px auto;
      }
    `;
    }
    fetch() {
        return _asyncToGenerator((function*() {
            if (this.state.data) {
                return this.state.data;
            }
            this.props.url = this.props.url || this.parentElement.url;
            var sql = this.innerText;
            sql = this.parentElement.replacer(sql.toString());
            const url = new URL(this.props.url);
            url.searchParams.set('sql', sql.toString());
            const query_params = this.parentElement.props.query;
            for(const prop in query_params){
                url.searchParams.set(prop, query_params[prop]);
            }
            const res = yield window.fetch(url.toString());
            const data = yield res.json();
            return data;
        }).bind(this))();
    }
    render(p1, p2, p3) {
        return this.html`${this.props.sql}${this.childNodes}`;
    }
}
Tonic.add(DataSet);
export { DataSource, DataSet };
