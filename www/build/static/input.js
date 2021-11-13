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
const Tonic = require('@optoolco/tonic');
class TonicInput extends Tonic {
    defaults() {
        return {
            type: 'text',
            placeholder: '',
            color: 'var(--tonic-primary)',
            spellcheck: false,
            ariaInvalid: false,
            invalid: false,
            radius: '3px',
            disabled: false,
            position: 'left'
        };
    }
    get form() {
        return this.querySelector('input').form;
    }
    get value() {
        if (this._modified) {
            return typeof this.state.value === 'string' ? this.state.value : this.props.value;
        } else {
            return typeof this.props.value === 'string' ? this.props.value : this.state.value;
        }
    }
    set value(value) {
        this._modified = true;
        this.querySelector('input').value = value;
        this.state.value = value;
    }
    setValid() {
        const input = this.querySelector('input');
        if (!input) return;
        input.setCustomValidity('');
        input.removeAttribute('invalid');
    }
    setInvalid(msg) {
        const input = this.querySelector('input');
        if (!input) return;
        this.setAttribute('edited', true);
        this.state.edited = true;
        msg = msg || this.props.errorMessage;
        input.setCustomValidity(msg);
        input.setAttribute('invalid', msg);
        const span = this.querySelector('.tonic--invalid span');
        if (!span) return;
        span.textContent = msg;
        const wrapper = this.querySelector('.tonic--invalid');
        wrapper.style.display = 'block';
    }
    static stylesheet() {
        return `
      tonic-input .tonic--wrapper {
        position: relative;
      }

      tonic-input[symbol-id] .tonic--right tonic-icon,
      tonic-input[src] .tonic--right tonic-icon {
        right: 6px;
      }

      tonic-input[symbol-id] .tonic--right input,
      tonic-input[src] .tonic--right input {
        padding-right: 40px;
      }

      tonic-input[symbol-id] .tonic--left tonic-icon,
      tonic-input[src] .tonic--left tonic-icon {
        left: 6px;
      }

      tonic-input[symbol-id] .tonic--left input,
      tonic-input[src] .tonic--left input {
        padding-left: 40px;
      }

      tonic-input[symbol-id] tonic-icon,
      tonic-input[src] tonic-icon {
        position: absolute;
        bottom: 10px;
      }

      tonic-input label {
        color: var(--tonic-medium, #999);
        font-weight: 500;
        font: 12px/14px var(--tonic-subheader, 'Arial', sans-serif);
        text-transform: uppercase;
        letter-spacing: 1px;
        padding-bottom: 10px;
        display: block;
        user-select: none;
        -webkit-user-select: none;
      }

      tonic-input input {
        color: var(--tonic-primary, #333);
        font: 14px var(--tonic-monospace, 'Andale Mono', monospace);
        padding: 8px;
        background-color: var(--tonic-input-background, var(--tonic-background, transparent));
        border: 1px solid var(--tonic-border, #ccc);
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      tonic-input input:focus {
        background-color: var(--tonic-input-background-focus, rgba(241, 241, 241, 0.75));
        outline: none;
      }

      tonic-input[edited] input[invalid]:focus,
      tonic-input[edited] input:invalid:focus,
      tonic-input[edited] input[invalid],
      tonic-input[edited] input:invalid {
        border-color: var(--tonic-error, #f66);
      }

      tonic-input[edited] input[invalid] ~ .tonic--invalid,
      tonic-input[edited] input:invalid ~ .tonic--invalid {
        transform: translateY(0);
        visibility: visible;
        opacity: 1;
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 1s ease 0s;
      }

      tonic-input input[disabled] {
        background-color: transparent;
      }

      tonic-input[label] .tonic--invalid {
        margin-bottom: -13px;
      }

      tonic-input .tonic--invalid {
        font-size: 14px;
        text-align: center;
        margin-bottom: 13px;
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        transform: translateY(-10px);
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s ease 1s;
        visibility: hidden;
        opacity: 0;
        z-index: 1;
      }

      tonic-input .tonic--invalid span {
        color: white;
        padding: 2px 6px;
        background-color: var(--tonic-error, #f66);
        border-radius: 2px;
        position: relative;
        display: inline-block;
        margin: 0 auto;
      }

      tonic-input .tonic--invalid span:after {
        content: '';
        width: 0;
        height: 0;
        display: block;
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid var(--tonic-error, #f66);
      }
    `;
    }
    renderLabel() {
        if (!this.props.label) return '';
        return this.html`
      <label
        for="tonic--input_${this.props.id}"
      >${this.props.label}</label>
    `;
    }
    renderIcon() {
        if (!this.props.src && !this.props.symbolId) return '';
        const opts = {
        };
        if (this.props.src) {
            opts.src = this.props.src;
        } else if (this.props.symbolId) {
            opts.symbolId = this.props.symbolId;
        }
        if (this.props.color) {
            opts.color = this.props.color;
        }
        if (this.props.fill) {
            opts.fill = this.props.fill;
        }
        opts.size = '20px';
        return this.html`
      <tonic-icon ...${opts}>
      </tonic-icon>
    `;
    }
    setFocus(pos) {
        const input = this.querySelector('input');
        input.focus();
        try {
            input.setSelectionRange(pos, pos);
        } catch (err) {
            console.warn(err);
        }
    }
    setupEvents() {
        const input = this.querySelector('input');
        const relay = (name)=>{
            this.dispatchEvent(new window.CustomEvent(name, {
                bubbles: true
            }));
        };
        input.addEventListener('focus', (e)=>{
            this.state.focus = true;
            relay('focus');
        });
        input.addEventListener('blur', (e)=>{
            if (this.state.rerendering) return;
            this.state.focus = false;
            relay('blur');
        });
        input.addEventListener('input', (e)=>{
            this._modified = true;
            this.state.edited = true;
            this.setAttribute('edited', true);
            this.state.value = e.target.value;
            this.state.pos = e.target.selectionStart;
        });
        const state = this.state;
        if (!state.focus) return;
        this.setFocus(state.pos);
    }
    updated() {
        this.setupEvents();
        setTimeout(()=>{
            if (this.props.invalid) {
                this.setInvalid(this.props.errorMessage);
            } else {
                this.setValid();
            }
        }, 32);
        this.state.rerendering = false;
    }
    reRender(...args) {
        var _super_reRender = (..._args)=>super.reRender(..._args)
        ;
        return _asyncToGenerator((function*() {
            this.state.rerendering = true;
            return _super_reRender(...args);
        }).bind(this))();
    }
    connected() {
        this.updated();
    }
    styles() {
        const { width , height , radius , padding  } = this.props;
        return {
            wrapper: {
                width
            },
            input: {
                width: '100%',
                height,
                borderRadius: radius,
                padding
            }
        };
    }
    render() {
        const { ariaInvalid , ariaLabelledby , disabled , height , label , max , maxlength , min , minlength , name , pattern , placeholder , position , readonly , required , spellcheck , tabindex , theme , title , type  } = this.props;
        if (ariaLabelledby) this.removeAttribute('ariaLabelledby');
        if (height) this.style.height = height;
        if (name) this.removeAttribute('name');
        if (tabindex) this.removeAttribute('tabindex');
        if (theme) this.classList.add(`tonic--theme--${theme}`);
        const value = this.value;
        const errorMessage = this.props.errorMessage || this.props.errorMessage || 'Invalid';
        const classes = [
            'tonic--wrapper'
        ];
        if (position) classes.push(`tonic--${position}`);
        const list = this.elements.length ? this.props.id + '_datalist' : null;
        const attributes = {
            ariaInvalid,
            ariaLabel: label,
            'aria-labelledby': ariaLabelledby,
            disabled: disabled === 'true',
            max,
            maxlength,
            min,
            minlength,
            name,
            pattern,
            placeholder,
            position,
            readonly: readonly === 'true',
            required: required === 'true',
            spellcheck,
            tabindex,
            title,
            value,
            list
        };
        if (this.state.edited) {
            this.setAttribute('edited', true);
        }
        let datalist = '';
        if (list) {
            datalist = this.html`
        <datalist id="${list}">
          ${this.elements}
        </datalist>
      `;
        }
        return this.html`
      <div class="${classes.join(' ')}" styles="wrapper">
        ${this.renderLabel()}
        ${this.renderIcon()}

        <input ... ${_objectSpread({
            styles: 'input',
            type,
            id: `tonic--input_${this.props.id}`
        }, attributes)}/>

        <div class="tonic--invalid">
          <span id="tonic--error-${this.props.id}">${errorMessage}</span>
        </div>

        ${datalist}
      </div>
    `;
    }
    constructor(){
        super();
        this._modified = false;
    }
}
module.exports = {
    TonicInput
};
