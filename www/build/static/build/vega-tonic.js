import Tonic from './_snowpack/pkg/@optoolco/tonic.js';
import vegaEmbed from './_snowpack/pkg/vega-embed.js';
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
class VegaChart extends Tonic {
    static stylesheet() {
        return `
      vega-chart {
        display: inline-block;
        position: relative;
      }

      vega-chart canvas {
        display: inline-block;
        position: relative;
      }
    `;
    }
    redraw() {
        return _asyncToGenerator((function*() {
            if (this.props.spec) {
                this.disconnected();
                return this.connected();
            }
        }).bind(this))();
    }
    disconnected() {
        if (this.state && this.state.vega) {
            this.state.vega.finalize();
            this.state.vega = null;
            this.state.view = null;
        }
    }
    connected() {
        return _asyncToGenerator((function*() {
            if (!this.props.spec) return;
            result = yield vegaEmbed(el, this.props.spec, _objectSpread({
                renderer: "svg"
            }, this.props.options));
            this.state.vega = result;
            this.state.view = result.view;
            console.log('vega spec', this.props.spec);
            result.view.run();
        }).bind(this))();
    }
    render() {
        return this.html`
      <div class='vega-chart'>
      </div>
    `;
    }
}
Tonic.add(VegaChart);
export { VegaChart };
