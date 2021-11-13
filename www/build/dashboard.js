function __swcpack_require__(mod) {
    var cache;
    if (cache) {
        return cache;
    }
    var module = {
        exports: {
        }
    };
    mod(module, module.exports);
    cache = module.exports;
    return cache;
}
var load = __swcpack_require__.bind(void 0, function(module, exports) {
    module.exports = {
        "_from": "@optoolco/tonic@^13.3.6",
        "_id": "@optoolco/tonic@13.3.6",
        "_inBundle": false,
        "_integrity": "sha512-//Mp9bxRbKSTBWZRrhTcdWiDlbltxFkx0DgqaIZrsv0TKLV9t3zBFaH0ve6y6w+bf3aH4OK0T5loXt+0jDQpmg==",
        "_location": "/@optoolco/tonic",
        "_phantomChildren": {
        },
        "_requested": {
            "type": "range",
            "registry": true,
            "raw": "@optoolco/tonic@^13.3.6",
            "name": "@optoolco/tonic",
            "escapedName": "@optoolco%2ftonic",
            "scope": "@optoolco",
            "rawSpec": "^13.3.6",
            "saveSpec": null,
            "fetchSpec": "^13.3.6"
        },
        "_requiredBy": [
            "#USER",
            "/"
        ],
        "_resolved": "https://registry.npmjs.org/@optoolco/tonic/-/tonic-13.3.6.tgz",
        "_shasum": "93e520e8f4c004b8f3927c1f8acec9c76926038d",
        "_spec": "@optoolco/tonic@^13.3.6",
        "_where": "/src/ddd",
        "author": {
            "name": "optoolco"
        },
        "bugs": {
            "url": "https://github.com/optoolco/tonic/issues"
        },
        "bundleDependencies": false,
        "dependencies": {
        },
        "deprecated": false,
        "description": "A component framework.",
        "devDependencies": {
            "benchmark": "^2.1.4",
            "esbuild": "^0.8.36",
            "standard": "14.3.1",
            "tape-run": "^8.0.0",
            "tapzero": "0.2.2",
            "uuid": "3.3.3"
        },
        "directories": {
            "test": "test"
        },
        "homepage": "https://tonic.technology",
        "license": "MIT",
        "main": "index.js",
        "name": "@optoolco/tonic",
        "repository": {
            "type": "git",
            "url": "git+https://github.com/optoolco/tonic.git"
        },
        "scripts": {
            "build": "./scripts/build.js && npm run minify:esm && npm run minify:cjs",
            "ci:test:tape-run": "esbuild --bundle test/index.js | tape-run",
            "lint": "standard -v",
            "minify:cjs": "esbuild index.js --keep-names --minify --outfile=dist/tonic.min.js",
            "minify:esm": "esbuild index.esm.js --keep-names --minify --outfile=dist/tonic.min.esm.js",
            "prepare": "./scripts/build.js",
            "test": "npm run build && standard && esbuild --bundle test/index.js | tape-run",
            "test:open": "npm run build && esbuild --bundle test/index.js | tape-run --browser chrome --keep-open"
        },
        "standard": {
            "ignore": [
                "dist/*",
                "test/fixtures/*"
            ]
        },
        "version": "13.3.6"
    };
});
var load1 = __swcpack_require__.bind(void 0, function(module, exports) {
    class TonicTemplate {
        constructor(rawText, templateStrings, unsafe){
            this.isTonicTemplate = true;
            this.unsafe = unsafe;
            this.rawText = rawText;
            this.templateStrings = templateStrings;
        }
        valueOf() {
            return this.rawText;
        }
        toString() {
            return this.rawText;
        }
    }
    class Tonic extends window.HTMLElement {
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
            if (!hasValidName) throw Error('Mangling. https://bit.ly/2TkJ6zP');
            if (!htmlName) htmlName = Tonic._splitName(c.name).toLowerCase();
            if (!Tonic.ssr && window.customElements.get(htmlName)) throw new Error(`Cannot Tonic.add(${c.name}, '${htmlName}') twice`);
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
            if (typeof c.stylesheet === 'function') Tonic.registerStyles(c.stylesheet);
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
                        )) return new TonicTemplate(o.join('\n'), null, false);
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
                if (typeof o === 'object' && o && o.nodeType === 1 && typeof o.cloneNode === 'function') return this._placehold([
                    o
                ]);
                return o;
            };
            const out = [];
            for(let i = 0; i < strings.length - 1; i++)out.push(strings[i], refs(values[i]));
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
                    if (p && p.then) return p.then(()=>{
                        this.updated && this.updated(oldProps);
                        resolve();
                    });
                    this.updated && this.updated(oldProps);
                    resolve();
                }, 0)
            );
            return this.pendingReRender;
        }
        reRender(o = this.props) {
            const oldProps = {
                ...this.props
            };
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
            if (render instanceof Tonic.AsyncFunction) return render.call(this, this.html, this.props).then((content)=>this._apply(target1, content)
            );
            else if (render instanceof Tonic.AsyncFunctionGenerator) return this._drainIterator(target1, render.call(this));
            else if (render === null) this._apply(target1, content1);
            else if (render instanceof Function) this._apply(target1, render.call(this, this.html, this.props) || '');
        }
        _apply(target2, content) {
            if (content && content.isTonicTemplate) content = content.rawText;
            else if (typeof content === 'string') content = Tonic.escape(content);
            if (typeof content === 'string') {
                if (this.stylesheet) content = `<style nonce=${Tonic.nonce || ''}>${this.stylesheet()}</style>${content}`;
                target2.innerHTML = content;
                if (this.styles) {
                    const styles = this.styles();
                    for (const node of target2.querySelectorAll('[styles]'))for (const s of node.getAttribute('styles').split(/\s+/))Object.assign(node.style, styles[s.trim()]);
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
                    for(let i = 0; i < childNodes.length; i++)walk(childNodes[i], fn);
                };
                walk(target2, (node, children, id)=>{
                    for (const child of children)node.parentNode.insertBefore(child, node);
                    delete Tonic._children[this._id][id];
                    node.parentNode.removeChild(node);
                });
            } else {
                target2.innerHTML = '';
                target2.appendChild(content.cloneNode(true));
            }
        }
        connectedCallback() {
            this.root = this.shadowRoot || this // here for back compat
            ;
            if (super.id && !Tonic._refIds.includes(super.id)) Tonic._refIds.push(super.id);
            const cc = (s)=>s.replace(/-(.)/g, (_, m)=>m.toUpperCase()
                )
            ;
            for (const { name: _name , value  } of this.attributes){
                const name = cc(_name);
                const p = this.props[name] = value;
                if (/__\w+__\w+__/.test(p)) {
                    const { 1: root  } = p.split('__');
                    this.props[name] = Tonic._data[root][p];
                } else if (/\d+__float/.test(p)) this.props[name] = parseFloat(p, 10);
                else if (p === 'null__null') this.props[name] = null;
                else if (/\w+__boolean/.test(p)) this.props[name] = p.includes('true');
                else if (/placehold:\w+:\w+__/.test(p)) {
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
                if (!this._source) this._source = this.innerHTML;
                else this.innerHTML = this._source;
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
        version: typeof require !== 'undefined' ? load().version : null,
        SPREAD: /\.\.\.\s?(__\w+__\w+__)/g,
        ESC: /["&'<>`/]/g,
        AsyncFunctionGenerator: (async function*() {
        }).constructor,
        AsyncFunction: (async function() {
        }).constructor,
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
    if (typeof module === 'object') module.exports = Tonic;
});
__swcpack_require__.bind(void 0, function(module, exports) {
    'use strict';
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    function _defineProperties(target, props) {
        for(var i = 0; i < props.length; i++){
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
    }
    function _defineProperty(obj, key, value) {
        if (key in obj) Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
        else obj[key] = value;
        return obj;
    }
    // Polyfill for element.matches, to support Internet Explorer. It's a relatively
    // simple polyfill, so we'll just include it rather than require the user to
    // include the polyfill themselves. Adapted from
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
    var matches = function matches(element, selector) {
        return element.matches ? element.matches(selector) : element.msMatchesSelector ? element.msMatchesSelector(selector) : element.webkitMatchesSelector ? element.webkitMatchesSelector(selector) : null;
    };
    // Polyfill for element.closest, to support Internet Explorer. It's a relatively
    var closestPolyfill = function closestPolyfill(el, selector) {
        var element = el;
        while(element && element.nodeType === 1){
            if (matches(element, selector)) return element;
            element = element.parentNode;
        }
        return null;
    };
    var closest = function closest(element, selector) {
        return element.closest ? element.closest(selector) : closestPolyfill(element, selector);
    };
    // Returns true if the value has a "then" function. Adapted from
    // https://github.com/graphql/graphql-js/blob/499a75939f70c4863d44149371d6a99d57ff7c35/src/jsutils/isPromise.js
    var isPromise = function isPromise(value) {
        return Boolean(value && typeof value.then === 'function');
    };
    var AutocompleteCore1 = function AutocompleteCore() {
        var _this = this;
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        }, search = _ref.search, _ref$autoSelect = _ref.autoSelect, autoSelect = _ref$autoSelect === void 0 ? false : _ref$autoSelect, _ref$setValue = _ref.setValue, setValue = _ref$setValue === void 0 ? function() {
        } : _ref$setValue, _ref$setAttribute = _ref.setAttribute, setAttribute = _ref$setAttribute === void 0 ? function() {
        } : _ref$setAttribute, _ref$onUpdate = _ref.onUpdate, onUpdate = _ref$onUpdate === void 0 ? function() {
        } : _ref$onUpdate, _ref$onSubmit = _ref.onSubmit, onSubmit = _ref$onSubmit === void 0 ? function() {
        } : _ref$onSubmit, _ref$onShow = _ref.onShow, onShow = _ref$onShow === void 0 ? function() {
        } : _ref$onShow, _ref$onHide = _ref.onHide, onHide = _ref$onHide === void 0 ? function() {
        } : _ref$onHide, _ref$onLoading = _ref.onLoading, onLoading = _ref$onLoading === void 0 ? function() {
        } : _ref$onLoading, _ref$onLoaded = _ref.onLoaded, onLoaded = _ref$onLoaded === void 0 ? function() {
        } : _ref$onLoaded;
        _classCallCheck(this, AutocompleteCore);
        _defineProperty(this, "value", '');
        _defineProperty(this, "searchCounter", 0);
        _defineProperty(this, "results", []);
        _defineProperty(this, "selectedIndex", -1);
        _defineProperty(this, "handleInput", function(event) {
            var value = event.target.value;
            _this.updateResults(value);
            _this.value = value;
        });
        _defineProperty(this, "handleKeyDown", function(event) {
            var key = event.key;
            switch(key){
                case 'Up':
                case 'Down':
                case 'ArrowUp':
                case 'ArrowDown':
                    var selectedIndex = key === 'ArrowUp' || key === 'Up' ? _this.selectedIndex - 1 : _this.selectedIndex + 1;
                    event.preventDefault();
                    _this.handleArrows(selectedIndex);
                    break;
                case 'Tab':
                    _this.selectResult();
                    break;
                case 'Enter':
                    var selectedResult = _this.results[_this.selectedIndex];
                    _this.selectResult();
                    _this.onSubmit(selectedResult);
                    break;
                case 'Esc':
                case 'Escape':
                    _this.hideResults();
                    _this.setValue();
                    break;
                default:
                    return;
            }
        });
        _defineProperty(this, "handleFocus", function(event) {
            var value = event.target.value;
            _this.updateResults(value);
            _this.value = value;
        });
        _defineProperty(this, "handleBlur", function() {
            _this.hideResults();
        });
        _defineProperty(this, "handleResultMouseDown", function(event) {
            event.preventDefault();
        });
        _defineProperty(this, "handleResultClick", function(event) {
            var target = event.target;
            var result = closest(target, '[data-result-index]');
            if (result) {
                _this.selectedIndex = parseInt(result.dataset.resultIndex, 10);
                var selectedResult = _this.results[_this.selectedIndex];
                _this.selectResult();
                _this.onSubmit(selectedResult);
            }
        });
        _defineProperty(this, "handleArrows", function(selectedIndex) {
            // Loop selectedIndex back to first or last result if out of bounds
            var resultsCount = _this.results.length;
            _this.selectedIndex = (selectedIndex % resultsCount + resultsCount) % resultsCount; // Update results and aria attributes
            _this.onUpdate(_this.results, _this.selectedIndex);
        });
        _defineProperty(this, "selectResult", function() {
            var selectedResult = _this.results[_this.selectedIndex];
            if (selectedResult) _this.setValue(selectedResult);
            _this.hideResults();
        });
        _defineProperty(this, "updateResults", function(value) {
            var currentSearch = ++_this.searchCounter;
            _this.onLoading();
            _this.search(value).then(function(results) {
                if (currentSearch !== _this.searchCounter) return;
                _this.results = results;
                _this.onLoaded();
                if (_this.results.length === 0) {
                    _this.hideResults();
                    return;
                }
                _this.selectedIndex = _this.autoSelect ? 0 : -1;
                _this.onUpdate(_this.results, _this.selectedIndex);
                _this.showResults();
            });
        });
        _defineProperty(this, "showResults", function() {
            _this.setAttribute('aria-expanded', true);
            _this.onShow();
        });
        _defineProperty(this, "hideResults", function() {
            _this.selectedIndex = -1;
            _this.results = [];
            _this.setAttribute('aria-expanded', false);
            _this.setAttribute('aria-activedescendant', '');
            _this.onUpdate(_this.results, _this.selectedIndex);
            _this.onHide();
        });
        _defineProperty(this, "checkSelectedResultVisible", function(resultsElement) {
            var selectedResultElement = resultsElement.querySelector("[data-result-index=\"".concat(_this.selectedIndex, "\"]"));
            if (!selectedResultElement) return;
            var resultsPosition = resultsElement.getBoundingClientRect();
            var selectedPosition = selectedResultElement.getBoundingClientRect();
            if (selectedPosition.top < resultsPosition.top) // Element is above viewable area
            resultsElement.scrollTop -= resultsPosition.top - selectedPosition.top;
            else if (selectedPosition.bottom > resultsPosition.bottom) // Element is below viewable area
            resultsElement.scrollTop += selectedPosition.bottom - resultsPosition.bottom;
        });
        this.search = isPromise(search) ? search : function(value) {
            return Promise.resolve(search(value));
        };
        this.autoSelect = autoSelect;
        this.setValue = setValue;
        this.setAttribute = setAttribute;
        this.onUpdate = onUpdate;
        this.onSubmit = onSubmit;
        this.onShow = onShow;
        this.onHide = onHide;
        this.onLoading = onLoading;
        this.onLoaded = onLoaded;
    };
    // Generates a unique ID, with optional prefix. Adapted from
    // https://github.com/lodash/lodash/blob/61acdd0c295e4447c9c10da04e287b1ebffe452c/uniqueId.js
    var idCounter = 0;
    var uniqueId = function uniqueId() {
        var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        return "".concat(prefix).concat(++idCounter);
    };
    // Calculates whether element2 should be above or below element1. Always
    // places element2 below unless all of the following:
    // 1. There isn't enough visible viewport below to fit element2
    // 2. There is more room above element1 than there is below
    // 3. Placing elemen2 above 1 won't overflow window
    var getRelativePosition = function getRelativePosition(element1, element2) {
        var position1 = element1.getBoundingClientRect();
        var position2 = element2.getBoundingClientRect();
        var positionAbove = /* 1 */ position1.bottom + position2.height > window.innerHeight && /* 2 */ window.innerHeight - position1.bottom < position1.top && /* 3 */ window.pageYOffset + position1.top - position2.height > 0;
        return positionAbove ? 'above' : 'below';
    };
    // Credit David Walsh (https://davidwalsh.name/javascript-debounce-function)
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    var debounce = function debounce(func, wait, immediate) {
        var timeout;
        return function executedFunction() {
            var context = this;
            var args = arguments;
            var later = function later() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
    // string in the format: `key1="value1" key2="value2"` for easy use in an HTML string.
    var Props1 = /*#__PURE__*/ function() {
        function Props(index, selectedIndex, baseClass) {
            _classCallCheck(this, Props);
            this.id = "".concat(baseClass, "-result-").concat(index);
            this["class"] = "".concat(baseClass, "-result");
            this['data-result-index'] = index;
            this.role = 'option';
            if (index === selectedIndex) this['aria-selected'] = 'true';
        }
        _createClass(Props, [
            {
                key: "toString",
                value: function toString() {
                    var _this = this;
                    return Object.keys(this).reduce(function(str, key) {
                        return "".concat(str, " ").concat(key, "=\"").concat(_this[key], "\"");
                    }, '');
                }
            }
        ]);
        return Props;
    }();
    var Autocomplete1 = function Autocomplete(root) {
        var _this2 = this;
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        }, search = _ref.search, _ref$onSubmit = _ref.onSubmit, onSubmit = _ref$onSubmit === void 0 ? function() {
        } : _ref$onSubmit, _ref$onUpdate = _ref.onUpdate, onUpdate = _ref$onUpdate === void 0 ? function() {
        } : _ref$onUpdate, _ref$baseClass = _ref.baseClass, baseClass = _ref$baseClass === void 0 ? 'autocomplete' : _ref$baseClass, autoSelect = _ref.autoSelect, _ref$getResultValue = _ref.getResultValue, getResultValue = _ref$getResultValue === void 0 ? function(result) {
            return result;
        } : _ref$getResultValue, renderResult = _ref.renderResult, _ref$debounceTime = _ref.debounceTime, debounceTime = _ref$debounceTime === void 0 ? 0 : _ref$debounceTime;
        _classCallCheck(this, Autocomplete);
        _defineProperty(this, "expanded", false);
        _defineProperty(this, "loading", false);
        _defineProperty(this, "position", {
        });
        _defineProperty(this, "resetPosition", true);
        _defineProperty(this, "initialize", function() {
            _this2.root.style.position = 'relative';
            _this2.input.setAttribute('role', 'combobox');
            _this2.input.setAttribute('autocomplete', 'off');
            _this2.input.setAttribute('autocapitalize', 'off');
            _this2.input.setAttribute('autocorrect', 'off');
            _this2.input.setAttribute('spellcheck', 'false');
            _this2.input.setAttribute('aria-autocomplete', 'list');
            _this2.input.setAttribute('aria-haspopup', 'listbox');
            _this2.input.setAttribute('aria-expanded', 'false');
            _this2.resultList.setAttribute('role', 'listbox');
            _this2.resultList.style.position = 'absolute';
            _this2.resultList.style.zIndex = '1';
            _this2.resultList.style.width = '100%';
            _this2.resultList.style.boxSizing = 'border-box'; // Generate ID for results list if it doesn't have one
            if (!_this2.resultList.id) _this2.resultList.id = uniqueId("".concat(_this2.baseClass, "-result-list-"));
            _this2.input.setAttribute('aria-owns', _this2.resultList.id);
            document.body.addEventListener('click', _this2.handleDocumentClick);
            _this2.input.addEventListener('input', _this2.core.handleInput);
            _this2.input.addEventListener('keydown', _this2.core.handleKeyDown);
            _this2.input.addEventListener('focus', _this2.core.handleFocus);
            _this2.input.addEventListener('blur', _this2.core.handleBlur);
            _this2.resultList.addEventListener('mousedown', _this2.core.handleResultMouseDown);
            _this2.resultList.addEventListener('click', _this2.core.handleResultClick);
            _this2.updateStyle();
        });
        _defineProperty(this, "setAttribute", function(attribute, value) {
            _this2.input.setAttribute(attribute, value);
        });
        _defineProperty(this, "setValue", function(result) {
            _this2.input.value = result ? _this2.getResultValue(result) : '';
        });
        _defineProperty(this, "renderResult", function(result, props) {
            return "<li ".concat(props, ">").concat(_this2.getResultValue(result), "</li>");
        });
        _defineProperty(this, "handleUpdate", function(results, selectedIndex) {
            _this2.resultList.innerHTML = '';
            results.forEach(function(result, index) {
                var props = new Props1(index, selectedIndex, _this2.baseClass);
                var resultHTML = _this2.renderResult(result, props);
                if (typeof resultHTML === 'string') _this2.resultList.insertAdjacentHTML('beforeend', resultHTML);
                else _this2.resultList.insertAdjacentElement('beforeend', resultHTML);
            });
            _this2.input.setAttribute('aria-activedescendant', selectedIndex > -1 ? "".concat(_this2.baseClass, "-result-").concat(selectedIndex) : '');
            if (_this2.resetPosition) {
                _this2.resetPosition = false;
                _this2.position = getRelativePosition(_this2.input, _this2.resultList);
                _this2.updateStyle();
            }
            _this2.core.checkSelectedResultVisible(_this2.resultList);
            _this2.onUpdate(results, selectedIndex);
        });
        _defineProperty(this, "handleShow", function() {
            _this2.expanded = true;
            _this2.updateStyle();
        });
        _defineProperty(this, "handleHide", function() {
            _this2.expanded = false;
            _this2.resetPosition = true;
            _this2.updateStyle();
        });
        _defineProperty(this, "handleLoading", function() {
            _this2.loading = true;
            _this2.updateStyle();
        });
        _defineProperty(this, "handleLoaded", function() {
            _this2.loading = false;
            _this2.updateStyle();
        });
        _defineProperty(this, "handleDocumentClick", function(event) {
            if (_this2.root.contains(event.target)) return;
            _this2.core.hideResults();
        });
        _defineProperty(this, "updateStyle", function() {
            _this2.root.dataset.expanded = _this2.expanded;
            _this2.root.dataset.loading = _this2.loading;
            _this2.root.dataset.position = _this2.position;
            _this2.resultList.style.visibility = _this2.expanded ? 'visible' : 'hidden';
            _this2.resultList.style.pointerEvents = _this2.expanded ? 'auto' : 'none';
            if (_this2.position === 'below') {
                _this2.resultList.style.bottom = null;
                _this2.resultList.style.top = '100%';
            } else {
                _this2.resultList.style.top = null;
                _this2.resultList.style.bottom = '100%';
            }
        });
        this.root = typeof root === 'string' ? document.querySelector(root) : root;
        this.input = this.root.querySelector('input');
        this.resultList = this.root.querySelector('ul');
        this.baseClass = baseClass;
        this.getResultValue = getResultValue;
        this.onUpdate = onUpdate;
        if (typeof renderResult === 'function') this.renderResult = renderResult;
        var core = new AutocompleteCore1({
            search: search,
            autoSelect: autoSelect,
            setValue: this.setValue,
            setAttribute: this.setAttribute,
            onUpdate: this.handleUpdate,
            onSubmit: onSubmit,
            onShow: this.handleShow,
            onHide: this.handleHide,
            onLoading: this.handleLoading,
            onLoaded: this.handleLoaded
        });
        if (debounceTime > 0) core.handleInput = debounce(core.handleInput, debounceTime);
        this.core = core;
        this.initialize();
    } // Set up aria attributes and events
    ;
    module.exports = Autocomplete1;
});
var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function dispatchChangeEvent(target, value) {
    const event = new CustomEvent('change', {
        bubbles: true,
        detail: {
            text: ()=>value
        }
    });
    target.dispatchEvent(event);
}
class FilterBase extends __default {
    constructor(){
        super();
        this.state.values = this.state.values || {
        };
    }
    modifyState(parentState) {
        if (parentState.values) {
            parentState.values[this.id] = this.value;
        }
    }
    setState(parentState1) {
        if (parentState1.values[this.id]) {
            this.value = parentState1.values[this.id];
        }
    }
    connected() {
        this.classList.add('filter');
    }
    set value(val2) {
        this.state.values[this.id] = val2;
    }
    get value() {
        return this.state.values[this.id];
    }
}
class AutocompleteFilter extends FilterBase {
    constructor(){
        super();
        const self = this;
        this.fetchProjectsJSON().then((fetched)=>{
            self.state.projects = fetched.rows;
        });
    }
    render() {
        return this.html`
        <div class="autocomplete filter-group" style="position: relative;" data-expanded="false" data-loading="false" data-position="below">
          <input class="autocomplete-input" controller="${this.id}" value="Release-Engineering-Team" name="${this.id}_text" id="${this.id}_text" placeholder="Enter project name or #hashtag">
          <ul class="autocomplete-result-list"></ul>
          <input type="hidden" name="${this.id}" controller="${this.id}" class='filter-input' id="${this.id}">
        </div>
      `;
    }
    fetchProjectsJSON() {
        return __awaiter(this, void 0, void 0, function*() {
            const response = yield fetch("/metrics/project_tree.json?_shape=objects&_size=max&_ttl=86400");
            const fetched = yield response.json();
            return fetched;
        });
    }
    modifyState(parentState2) {
        if (parentState2.values) {
            parentState2.values[this.id] = this.value && this.value['phid'] ? this.value['phid'] : this.value;
        }
    }
    set value(val1) {
        if (val1['phid']) {
            var hiddeninput = this.querySelector('input[type=hidden]');
            hiddeninput.value = val1['phid'];
            val1.value = val1['phid'];
        }
        if (val1 == this.state.values[this.id]) {
            return;
        }
        this.state.values[this.id] = val1;
        this.completer.setValue(val1);
        dispatchChangeEvent(this, val1);
    }
    get value() {
        if (!this.state.values[this.id]) {
            var hiddeninput = this.querySelector('input[type=hidden]');
            return hiddeninput.value;
        }
        return this.state.values[this.id];
    }
    connected() {
        return __awaiter(this, void 0, void 0, function*() {
            this.classList.add('filter');
            const self = this;
            const state = this.state;
            this.querySelector('input[type=hidden]');
            this.completer = new Autocomplete(this.querySelector('.autocomplete'), {
                search: function(input) {
                    if (input.length < 1) {
                        return [];
                    }
                    let text = input.toLowerCase();
                    let words = text.split(/\W+/);
                    function score1(project) {
                        var strings = [
                            project.name.toLowerCase()
                        ];
                        if (project.slug) {
                            strings.push(project.slug);
                        }
                        var score = 0;
                        for (let w of words){
                            var cnt = 0;
                            for (let s of strings){
                                if (!s) {
                                    continue;
                                }
                                if (s == text) {
                                    cnt += 3;
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
                            } else {
                                score += cnt;
                            }
                        }
                        return score;
                    }
                    var result = state.projects.filter(score1);
                    if (result.length > 1) {
                        result = result.sort(function(a, b) {
                            return score1(b) - score1(a);
                        });
                    }
                    return result;
                },
                onUpdate: (results, selectedIndex)=>{
                    if (selectedIndex > -1) {
                        const val = results[selectedIndex];
                        self.value = val;
                    }
                },
                onSubmit: (result)=>{
                    if (result && result.phid) {
                        self.value = result;
                    } else {
                        self.value = '';
                    }
                },
                getResultValue: (result)=>result.name || result
                ,
                renderResult: function(result, props) {
                    const slug = result.slug ? `- <span class='slug'>#${result.slug}</span>` : '';
                    return `
        <li ${props}>
          <div>
            ${result.name}${slug}
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
__default.add(AutocompleteFilter);
class InputFilter extends FilterBase {
    connected() {
        this.classList.add('filter');
        this.state.inputs = this.querySelectorAll('input');
        const self = this;
        this.inputListener = function(e) {
            self.input(e);
        };
        var i;
        for (i of this.state.inputs){
            if (this.state[i.id]) {
                i.value = this.state[i.id];
            } else {
                this.state[i.id] = i.value;
            }
        }
    }
    input(e3) {
        this.state.values[e3.target.id] = e3.target.value;
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
        return this.html`
      <div id="filter-group-${id}" class="filter-group input-group dashboard-filter filter-type-text">
      <span class="input-group-text"><label for="filter_${id}">${label}</label></span>
      <input id="filter_${id}" controller="${id}" name="${name}" class="form-control filter-input" type="text">
      </div>`;
    }
}
__default.add(InputFilter);
class DaterangeFilter extends InputFilter {
    constructor(){
        super();
        if (!this.state.values) this.state.values = {
        };
    }
    input(e1) {
        this.id;
        const ele = e1.target;
        if (ele.classList.contains('range-start')) {
            this.start = ele.value;
        } else if (ele.classList.contains('range-end')) {
            this.end = ele.value;
        }
        dispatchChangeEvent(this, this.value);
    }
    modifyState(parentState3) {
        if (parentState3.values) {
            parentState3.values[this.id + '_start'] = this.start;
            parentState3.values[this.id + '_end'] = this.end;
            delete parentState3.values[this.id];
        }
    }
    setState(parentState4) {
        const start = this.id + '_start';
        const end = this.id + '_end';
        this.value = parentState4.values[this.id];
        this.start = parentState4.values[start];
        this.end = parentState4.values[end];
    }
    get value() {
        return this.start + ':' + this.end;
    }
    set value(val3) {
        if (val3 == undefined) {
            return;
        }
        if (val3.indexOf(':') > 0) {
            const vals = val3.split(':');
            this.start = vals[0];
            this.end = vals[1];
        } else if (val3 !== ':') {
            this.start = '';
            this.end = val3;
        } else {
            this.start = '';
            this.end = '';
        }
    }
    get start() {
        return this.state.values[this.id + '_start'];
    }
    set start(val4) {
        this.state.values[this.id + '_start'] = val4;
        this.querySelector('#' + this.id + '_start').value = val4;
    }
    get end() {
        return this.state.values[this.id + '_end'];
    }
    set end(val5) {
        this.state.values[this.id + '_end'] = val5;
        this.querySelector('#' + this.id + '_end').value = val5;
    }
    disconnected() {
    }
    render() {
        const id = this.id;
        return this.html`
    <div id="${id}" class="p-0 d-inline-flex input-group filter-type-daterange align-self-center">
    <span class="input-group-text">From:</span>
    <input id="${id}_start" controller="${id}" name="${id}_start" class="form-control range-start" type="date"  aria-label="Start Date">
    <span class="input-group-text">To:</span>
    <input id="${id}_end" controller="${id}" name="${id}_end" class="form-control range-end" type="date"  aria-label="End Date">
    </div>
    `;
    }
}
__default.add(DaterangeFilter);
class TabItem extends __default {
    set selected(val6) {
        this.state.selected = val6;
        if (val6) {
            this.state.panel.classList.remove('hidden');
            this.state.tab.classList.add('active');
        } else {
            this.state.panel.classList.add('hidden');
            this.state.tab.classList.remove('active');
        }
    }
    get value() {
        return this.state.value;
    }
    set value(val7) {
        this.state.value = val7;
    }
    connected() {
        const parentTabs = this.parentElement.querySelector('.nav-tabs');
        const tab = this.querySelector('.nav-link');
        parentTabs.appendChild(tab.parentElement);
        this.state.tab = tab;
        this.state.panel = document.getElementById('panel-' + this.id);
    }
    get selected() {
        return this.state.selected;
    }
    click(e2) {
        if (!e2.target.matches('.nav-link')) return;
        e2.preventDefault();
        e2.stopPropagation();
        this.selected = true;
        this.closest('nav-tabs').selected = this;
    }
    render() {
        this.selected ? 'active' : '';
        const hidden = this.selected ? '' : 'hidden';
        this.props.label;
        return this.html`
    <li class='nav-item' panel='panel-${this.id}'>
      <a class='nav-link ${this.selected}' href='#'>${this.props.label}</a>
    </li>
    <div class='panel ${hidden}' id='panel-${this.id}'>
      ${this.childNodes}
    </div>
    `;
    }
}
__default.add(TabItem);
class NavTabs extends InputFilter {
    set value(val8) {
        this.state.values[this.id] = val8;
    }
    get value() {
        return this.state.values[this.id];
    }
    set selected(tab) {
        if (this.state.selected == tab) {
            return;
        }
        if (this.state.selected) {
            this.state.selected.selected = false;
        }
        if (!tab.selected) {
            tab.selected = true;
        }
        this.state.selected = tab;
        this.value = tab.id;
    }
    render() {
        const val = this.value;
        const tabs = this.children;
        const tabitems = [];
        for (const tab of tabs){
            if (tab.id == val) {
                tab.selected = true;
                this.selected = tab;
            } else {
                tab.selected = false;
            }
            tabitems.push(tab);
        }
        return this.html`
    <ul class="nav nav-tabs">

    </ul>
    ${this.children}
    `;
    }
}
__default.add(NavTabs);
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
class DataSource extends __default {
    constructor(){
        super();
        this.query = {
        };
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
    async fetch(opts = {
    }) {
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
    renderStaticDatasets() {
        return this.html`
    <static-data-set id='ds-project_tree'
     url="/metrics/project_tree.json?_shape=objects&_size=max&_ttl=86400">
    </static-data-set>
    `;
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
            queries.push(this.html`<data-set id='ds-${attrs.name}' url='${this.url}' ...${attrs}>${query.sql}</data-set>`);
        }
        const staticsets = this.renderStaticDatasets();
        return this.html`
      ${queries}
      ${staticsets}
      ${this.children}
    `;
    }
}
__default.add(DataSource);
class BaseDataSet extends __default {
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
    async fetch() {
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
        const res = await window.fetch(url.toString());
        const data = await res.json();
        return data;
    }
    render(p1, p2, p3) {
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
__default.add(StaticDataSet);
__default.add(DataSet);
class DatasetCursor {
    data = {
    };
    indexes = {
    };
    constructor(datasource, data){
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
        return this.data.rows.filter(cb, thisarg);
    }
    index(key) {
        if (!this.indexes[key]) {
            const idx = {
            };
            for (const row of this.data.rows){
                idx[row[key]] = row;
            }
            this.indexes[key] = idx;
        }
        return this.indexes[key];
    }
    lookup(key1, val9) {
        const idx = this.index(key1);
        return idx[val9];
    }
}
var { default: Tonic1  } = load1();
class DashboardApp extends Tonic1 {
    constructor(){
        super();
        if (history.state) {
            this.setState(history.state);
        } else {
            this.state.values = {
            };
        }
    }
    connected() {
        this.setState();
        this.addEventListener('change', this.change);
        const self = this;
        this.querySelector('form');
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
    popstate(e4) {
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
    submit(e5, originalTarget) {
        e5.preventDefault();
        e5.stopPropagation();
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
        fetch(url.toString()).then(function(response) {
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
}
Tonic1.add(DashboardApp);
export { DashboardApp as DashboardApp, InputFilter as InputFilter };
export { DashboardApp as default };
