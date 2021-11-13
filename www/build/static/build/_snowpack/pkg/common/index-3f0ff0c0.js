import { c as createCommonjsModule, a as commonjsRequire } from './_commonjsHelpers-db517561.js';
function AsyncGenerator(gen) {
    var front, back;
    function send(key, arg) {
        return new Promise(function(resolve, reject) {
            var request = {
                key: key,
                arg: arg,
                resolve: resolve,
                reject: reject,
                next: null
            };
            if (back) {
                back = back.next = request;
            } else {
                front = back = request;
                resume(key, arg);
            }
        });
    }
    function resume(key, arg) {
        try {
            var result = gen[key](arg);
            var value = result.value;
            var wrappedAwait = value instanceof _AwaitValue;
            Promise.resolve(wrappedAwait ? value.wrapped : value).then(function(arg) {
                if (wrappedAwait) {
                    resume("next", arg);
                    return;
                }
                settle(result.done ? "return" : "normal", arg);
            }, function(err) {
                resume("throw", err);
            });
        } catch (err) {
            settle("throw", err);
        }
    }
    function settle(type, value) {
        switch(type){
            case "return":
                front.resolve({
                    value: value,
                    done: true
                });
                break;
            case "throw":
                front.reject(value);
                break;
            default:
                front.resolve({
                    value: value,
                    done: false
                });
                break;
        }
        front = front.next;
        if (front) {
            resume(front.key, front.arg);
        } else {
            back = null;
        }
    }
    this._invoke = send;
    if (typeof gen.return !== "function") {
        this.return = undefined;
    }
}
if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function() {
        return this;
    };
}
AsyncGenerator.prototype.next = function(arg) {
    return this._invoke("next", arg);
};
AsyncGenerator.prototype.throw = function(arg) {
    return this._invoke("throw", arg);
};
AsyncGenerator.prototype.return = function(arg) {
    return this._invoke("return", arg);
};
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
function _AwaitValue(value) {
    this.wrapped = value;
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {
        };
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function _wrapAsyncGenerator(fn) {
    return function() {
        return new AsyncGenerator(fn.apply(this, arguments));
    };
}
const _from = "@optoolco/tonic@^13.3.6";
const _id1 = "@optoolco/tonic@13.3.6";
const _inBundle = false;
const _integrity = "sha512-//Mp9bxRbKSTBWZRrhTcdWiDlbltxFkx0DgqaIZrsv0TKLV9t3zBFaH0ve6y6w+bf3aH4OK0T5loXt+0jDQpmg==";
const _location = "/@optoolco/tonic";
const _phantomChildren = {
};
const _requested = {
    type: "range",
    registry: true,
    raw: "@optoolco/tonic@^13.3.6",
    name: "@optoolco/tonic",
    escapedName: "@optoolco%2ftonic",
    scope: "@optoolco",
    rawSpec: "^13.3.6",
    saveSpec: null,
    fetchSpec: "^13.3.6"
};
const _requiredBy = [
    "#USER",
    "/"
];
const _resolved = "https://registry.npmjs.org/@optoolco/tonic/-/tonic-13.3.6.tgz";
const _shasum = "93e520e8f4c004b8f3927c1f8acec9c76926038d";
const _spec = "@optoolco/tonic@^13.3.6";
const _where = "/src/ddd";
const author = {
    name: "optoolco"
};
const bugs = {
    url: "https://github.com/optoolco/tonic/issues"
};
const bundleDependencies = false;
const dependencies = {
};
const deprecated = false;
const description = "A component framework.";
const devDependencies = {
    benchmark: "^2.1.4",
    esbuild: "^0.8.36",
    standard: "14.3.1",
    "tape-run": "^8.0.0",
    tapzero: "0.2.2",
    uuid: "3.3.3"
};
const directories = {
    test: "test"
};
const homepage = "https://tonic.technology";
const license = "MIT";
const main = "index.js";
const name = "@optoolco/tonic";
const repository = {
    type: "git",
    url: "git+https://github.com/optoolco/tonic.git"
};
const scripts = {
    build: "./scripts/build.js && npm run minify:esm && npm run minify:cjs",
    "ci:test:tape-run": "esbuild --bundle test/index.js | tape-run",
    lint: "standard -v",
    "minify:cjs": "esbuild index.js --keep-names --minify --outfile=dist/tonic.min.js",
    "minify:esm": "esbuild index.esm.js --keep-names --minify --outfile=dist/tonic.min.esm.js",
    prepare: "./scripts/build.js",
    test: "npm run build && standard && esbuild --bundle test/index.js | tape-run",
    "test:open": "npm run build && esbuild --bundle test/index.js | tape-run --browser chrome --keep-open"
};
const standard = {
    ignore: [
        "dist/*",
        "test/fixtures/*"
    ]
};
const version = "13.3.6";
var require$$0 = {
    _from: _from,
    _id: _id1,
    _inBundle: _inBundle,
    _integrity: _integrity,
    _location: _location,
    _phantomChildren: _phantomChildren,
    _requested: _requested,
    _requiredBy: _requiredBy,
    _resolved: _resolved,
    _shasum: _shasum,
    _spec: _spec,
    _where: _where,
    author: author,
    bugs: bugs,
    bundleDependencies: bundleDependencies,
    dependencies: dependencies,
    deprecated: deprecated,
    description: description,
    devDependencies: devDependencies,
    directories: directories,
    homepage: homepage,
    license: license,
    main: main,
    name: name,
    repository: repository,
    scripts: scripts,
    standard: standard,
    version: version
};
var tonic = createCommonjsModule(function(module) {
    class TonicTemplate {
        valueOf() {
            return this.rawText;
        }
        toString() {
            return this.rawText;
        }
        constructor(rawText, templateStrings, unsafe){
            this.isTonicTemplate = true;
            this.unsafe = unsafe;
            this.rawText = rawText;
            this.templateStrings = templateStrings;
        }
    }
    class Tonic extends window.HTMLElement {
        static _createId() {
            return `tonic${Tonic._index++}`;
        }
        static _splitName(s4) {
            return s4.match(/[A-Z][a-z0-9]*/g).join('-');
        }
        static _normalizeAttrs(o1, x1 = {
        }) {
            [
                ...o1
            ].forEach((o)=>x1[o.name] = o.value
            );
            return x1;
        }
        _checkId() {
            const _id = super.id;
            if (!_id) {
                const html = this.outerHTML.replace(this.innerHTML, '...');
                throw new Error(`Component: ${html} has no id`);
            }
            return _id;
        }
        get state() {
            return this._checkId(), this._state;
        }
        set state(newState) {
            this._state = (this._checkId(), newState);
        }
        get id() {
            return this._checkId();
        }
        set id(newId) {
            super.id = newId;
        }
        _events() {
            const hp = Object.getOwnPropertyNames(window.HTMLElement.prototype);
            for (const p of this._props){
                if (hp.indexOf('on' + p) === -1) continue;
                this.addEventListener(p, this);
            }
        }
        _prop(o2) {
            const id = this._id;
            const p = `__${id}__${Tonic._createId()}__`;
            Tonic._data[id] = Tonic._data[id] || {
            };
            Tonic._data[id][p] = o2;
            return p;
        }
        _placehold(r) {
            const id = this._id;
            const ref = `placehold:${id}:${Tonic._createId()}__`;
            Tonic._children[id] = Tonic._children[id] || {
            };
            Tonic._children[id][ref] = r;
            return ref;
        }
        static match(el, s1) {
            if (!el.matches) el = el.parentElement;
            return el.matches(s1) ? el : el.closest(s1);
        }
        static getPropertyNames(proto) {
            const props = [];
            while(proto && proto !== Tonic.prototype){
                props.push(...Object.getOwnPropertyNames(proto));
                proto = Object.getPrototypeOf(proto);
            }
            return props;
        }
        static add(c, htmlName) {
            const hasValidName = htmlName || c.name && c.name.length > 1;
            if (!hasValidName) {
                throw Error('Mangling. https://bit.ly/2TkJ6zP');
            }
            if (!htmlName) htmlName = Tonic._splitName(c.name).toLowerCase();
            if (!Tonic.ssr && window.customElements.get(htmlName)) {
                throw new Error(`Cannot Tonic.add(${c.name}, '${htmlName}') twice`);
            }
            if (!c.prototype || !c.prototype.isTonicComponent) {
                const tmp = {
                    [c.name]: class extends Tonic {
                    }
                }[c.name];
                tmp.prototype.render = c;
                c = tmp;
            }
            c.prototype._props = Tonic.getPropertyNames(c.prototype);
            Tonic._reg[htmlName] = c;
            Tonic._tags = Object.keys(Tonic._reg).join();
            window.customElements.define(htmlName, c);
            if (typeof c.stylesheet === 'function') {
                Tonic.registerStyles(c.stylesheet);
            }
            return c;
        }
        static registerStyles(stylesheetFn) {
            if (Tonic._stylesheetRegistry.includes(stylesheetFn)) return;
            Tonic._stylesheetRegistry.push(stylesheetFn);
            const styleNode = document.createElement('style');
            if (Tonic.nonce) styleNode.setAttribute('nonce', Tonic.nonce);
            styleNode.appendChild(document.createTextNode(stylesheetFn()));
            if (document.head) document.head.appendChild(styleNode);
        }
        static escape(s2) {
            return s2.replace(Tonic.ESC, (c)=>Tonic.MAP[c]
            );
        }
        static unsafeRawString(s3, templateStrings1) {
            return new TonicTemplate(s3, templateStrings1, true);
        }
        dispatch(eventName, detail = null) {
            const opts = {
                bubbles: true,
                detail
            };
            this.dispatchEvent(new window.CustomEvent(eventName, opts));
        }
        html(strings, ...values) {
            const refs = (o)=>{
                if (o && o.__children__) return this._placehold(o);
                if (o && o.isTonicTemplate) return o.rawText;
                switch(Object.prototype.toString.call(o)){
                    case '[object HTMLCollection]':
                    case '[object NodeList]':
                        return this._placehold([
                            ...o
                        ]);
                    case '[object Array]':
                        if (o.every((x)=>x.isTonicTemplate && !x.unsafe
                        )) {
                            return new TonicTemplate(o.join('\n'), null, false);
                        }
                        return this._prop(o);
                    case '[object Object]':
                    case '[object Function]':
                        return this._prop(o);
                    case '[object NamedNodeMap]':
                        return this._prop(Tonic._normalizeAttrs(o));
                    case '[object Number]':
                        return `${o}__float`;
                    case '[object String]':
                        return Tonic.escape(o);
                    case '[object Boolean]':
                        return `${o}__boolean`;
                    case '[object Null]':
                        return `${o}__null`;
                    case '[object HTMLElement]':
                        return this._placehold([
                            o
                        ]);
                }
                if (typeof o === 'object' && o && o.nodeType === 1 && typeof o.cloneNode === 'function') {
                    return this._placehold([
                        o
                    ]);
                }
                return o;
            };
            const out = [];
            for(let i = 0; i < strings.length - 1; i++){
                out.push(strings[i], refs(values[i]));
            }
            out.push(strings[strings.length - 1]);
            const htmlStr = out.join('').replace(Tonic.SPREAD, (_, p)=>{
                const o = Tonic._data[p.split('__')[1]][p];
                return Object.entries(o).map(([key, value])=>{
                    const k = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                    if (value === true) return k;
                    else if (value) return `${k}="${Tonic.escape(String(value))}"`;
                    else return '';
                }).filter(Boolean).join(' ');
            });
            return new TonicTemplate(htmlStr, strings, false);
        }
        scheduleReRender(oldProps) {
            if (this.pendingReRender) return this.pendingReRender;
            this.pendingReRender = new Promise((resolve)=>setTimeout(()=>{
                    if (!this.isInDocument(this.shadowRoot || this)) return;
                    const p = this._set(this.shadowRoot || this, this.render);
                    this.pendingReRender = null;
                    if (p && p.then) {
                        return p.then(()=>{
                            this.updated && this.updated(oldProps);
                            resolve();
                        });
                    }
                    this.updated && this.updated(oldProps);
                    resolve();
                }, 0)
            );
            return this.pendingReRender;
        }
        reRender(o = this.props) {
            const oldProps = _objectSpread({
            }, this.props);
            this.props = typeof o === 'function' ? o(oldProps) : o;
            return this.scheduleReRender(oldProps);
        }
        handleEvent(e) {
            this[e.type](e);
        }
        _drainIterator(target, iterator) {
            return iterator.next().then((result)=>{
                this._set(target, null, result.value);
                if (result.done) return;
                return this._drainIterator(target, iterator);
            });
        }
        _set(target1, render, content1 = '') {
            for (const node of target1.querySelectorAll(Tonic._tags)){
                if (!node.isTonicComponent) continue;
                const id = node.getAttribute('id');
                if (!id || !Tonic._refIds.includes(id)) continue;
                Tonic._states[id] = node.state;
            }
            if (render instanceof Tonic.AsyncFunction) {
                return render.call(this, this.html, this.props).then((content)=>this._apply(target1, content)
                );
            } else if (render instanceof Tonic.AsyncFunctionGenerator) {
                return this._drainIterator(target1, render.call(this));
            } else if (render === null) {
                this._apply(target1, content1);
            } else if (render instanceof Function) {
                this._apply(target1, render.call(this, this.html, this.props) || '');
            }
        }
        _apply(target2, content) {
            if (content && content.isTonicTemplate) {
                content = content.rawText;
            } else if (typeof content === 'string') {
                content = Tonic.escape(content);
            }
            if (typeof content === 'string') {
                if (this.stylesheet) {
                    content = `<style nonce=${Tonic.nonce || ''}>${this.stylesheet()}</style>${content}`;
                }
                target2.innerHTML = content;
                if (this.styles) {
                    const styles = this.styles();
                    for (const node of target2.querySelectorAll('[styles]')){
                        for (const s of node.getAttribute('styles').split(/\s+/)){
                            Object.assign(node.style, styles[s.trim()]);
                        }
                    }
                }
                const children1 = Tonic._children[this._id] || {
                };
                const walk = (node, fn)=>{
                    if (node.nodeType === 3) {
                        const id = node.textContent.trim();
                        if (children1[id]) fn(node, children1[id], id);
                    }
                    const childNodes = node.childNodes;
                    if (!childNodes) return;
                    for(let i = 0; i < childNodes.length; i++){
                        walk(childNodes[i], fn);
                    }
                };
                walk(target2, (node, children, id)=>{
                    for (const child of children){
                        node.parentNode.insertBefore(child, node);
                    }
                    delete Tonic._children[this._id][id];
                    node.parentNode.removeChild(node);
                });
            } else {
                target2.innerHTML = '';
                target2.appendChild(content.cloneNode(true));
            }
        }
        connectedCallback() {
            this.root = this.shadowRoot || this; // here for back compat
            if (super.id && !Tonic._refIds.includes(super.id)) {
                Tonic._refIds.push(super.id);
            }
            const cc = (s)=>s.replace(/-(.)/g, (_, m)=>m.toUpperCase()
                )
            ;
            for (const { name: _name , value  } of this.attributes){
                const name = cc(_name);
                const p = this.props[name] = value;
                if (/__\w+__\w+__/.test(p)) {
                    const { 1: root  } = p.split('__');
                    this.props[name] = Tonic._data[root][p];
                } else if (/\d+__float/.test(p)) {
                    this.props[name] = parseFloat(p, 10);
                } else if (p === 'null__null') {
                    this.props[name] = null;
                } else if (/\w+__boolean/.test(p)) {
                    this.props[name] = p.includes('true');
                } else if (/placehold:\w+:\w+__/.test(p)) {
                    const { 1: root  } = p.split(':');
                    this.props[name] = Tonic._children[root][p][0];
                }
            }
            this.props = Object.assign(this.defaults ? this.defaults() : {
            }, this.props);
            this._id = this._id || Tonic._createId();
            this.willConnect && this.willConnect();
            if (!this.isInDocument(this.root)) return;
            if (!this.preventRenderOnReconnect) {
                if (!this._source) {
                    this._source = this.innerHTML;
                } else {
                    this.innerHTML = this._source;
                }
                const p = this._set(this.root, this.render);
                if (p && p.then) return p.then(()=>this.connected && this.connected()
                );
            }
            this.connected && this.connected();
        }
        isInDocument(target3) {
            const root = target3.getRootNode();
            return root === document || root.toString() === '[object ShadowRoot]';
        }
        disconnectedCallback() {
            this.disconnected && this.disconnected();
            delete Tonic._data[this._id];
            delete Tonic._children[this._id];
        }
        constructor(){
            super();
            const state = Tonic._states[super.id];
            delete Tonic._states[super.id];
            this._state = state || {
            };
            this.preventRenderOnReconnect = false;
            this.props = {
            };
            this.elements = [
                ...this.children
            ];
            this.elements.__children__ = true;
            this.nodes = [
                ...this.childNodes
            ];
            this.nodes.__children__ = true;
            this._events();
        }
    }
    Tonic.prototype.isTonicComponent = true;
    Object.assign(Tonic, {
        _tags: '',
        _refIds: [],
        _data: {
        },
        _states: {
        },
        _children: {
        },
        _reg: {
        },
        _stylesheetRegistry: [],
        _index: 0,
        version: typeof commonjsRequire !== 'undefined' ? require$$0.version : null,
        SPREAD: /\.\.\.\s?(__\w+__\w+__)/g,
        ESC: /["&'<>`/]/g,
        AsyncFunctionGenerator: function() {
            var _ref = _wrapAsyncGenerator(function*() {
            });
            return function() {
                return _ref.apply(this, arguments);
            };
        }().constructor,
        AsyncFunction: function() {
            var _ref = _asyncToGenerator(function*() {
            });
            return function() {
                return _ref.apply(this, arguments);
            };
        }().constructor,
        MAP: {
            '"': '&quot;',
            '&': '&amp;',
            '\'': '&#x27;',
            '<': '&lt;',
            '>': '&gt;',
            '`': '&#x60;',
            '/': '&#x2F;'
        }
    });
    module.exports = Tonic;
});
export { tonic as t };
