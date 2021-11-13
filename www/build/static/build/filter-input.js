import Autocomplete from "./_snowpack/pkg/@trevoreyre/autocomplete-js.js";
import Tonic from "./_snowpack/pkg/@optoolco/tonic.js";
import { fetchData } from "./datasource.js";
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
function _findTasks() {
    _findTasks = _asyncToGenerator(function*(tasks) {
        var ids = tasks.split(" ");
        var id_str = ids.map((id)=>"'" + id + "'"
        ).join(",");
        var query = `/metrics/Task.json??sql=select+name%2C+status%2C+phid%2C+dateCreated%2C+dateModified%2C+description%2C+authorPHID%2C+ownerPHID%2C+priority%2C+points%2C+subtype%2C+closerPHID%2C+dateClosed%2C+[custom.points.final]%2C+[custom.deadline.start]%2C+id%2C+type%2C+attachments+from+Task+WHERE+id+in+(${id_str})+order+by+dateModified&_shape=objects&_size=max`;
        const response = yield fetch(query);
        const fetched = yield response.json();
        return fetched;
    });
    return _findTasks.apply(this, arguments);
}
function findTasks(tasks) {
    return _findTasks.apply(this, arguments);
}
function dispatchChangeEvent(target, value) {
    const event = new CustomEvent("change", {
        bubbles: true,
        detail: {
            text: ()=>value
        }
    });
    target.dispatchEvent(event);
}
class FilterBase extends Tonic {
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
        this.classList.add("filter");
    }
    set value(val2) {
        this.state.values[this.id] = val2;
    }
    get value() {
        return this.state.values[this.id];
    }
    constructor(){
        super();
        this.state.values = this.state.values || {
        };
    }
}
class AutocompleteFilter extends FilterBase {
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
        return _asyncToGenerator(function*() {
            return fetchData("project_tree");
        })();
    }
    modifyState(parentState2) {
        if (parentState2.values) {
            parentState2.values[this.id] = this.value["phid"];
        }
    }
    setState(parentState3) {
        if (parentState3.values[this.id]) {
            var hiddeninput = this.querySelector("input[type=hidden]");
            var val = parentState3.values[this.id];
            if (val["phid"]) {
                hiddeninput.value = val["phid"];
                val["value"] = val["phid"];
                this.value = val;
            } else {
                const self = this;
                const cb = function() {
                    setTimeout(function() {
                        self.value = self.state.projects.lookup("phid", val);
                    }, 30);
                };
                if (this.state.projects["then"]) {
                    this.state.projects.then(cb);
                } else {
                    cb();
                }
            }
        }
    }
    set value(val1) {
        if (val1 == this.state.values[this.id]) {
            return;
        }
        this.state.values[this.id] = val1;
        this.completer.setValue(val1);
        dispatchChangeEvent(this, val1);
    }
    get value() {
        if (!this.state.values[this.id]) {
            var hiddeninput = this.querySelector("input[type=hidden]");
            return hiddeninput.value;
        }
        return this.state.values[this.id];
    }
    connected() {
        return _asyncToGenerator((function*() {
            const self = this;
            this.state.projects = this.fetchProjectsJSON().then((fetched)=>{
                self.state.projects = fetched;
            });
            this.classList.add("filter");
            const state = this.state;
            var hiddeninput = this.querySelector("input[type=hidden]");
            this.completer = new Autocomplete(this.querySelector(".autocomplete"), {
                search: function(input) {
                    if (input.length < 1) {
                        return [];
                    }
                    let text = input.toLowerCase();
                    let words = text.split(/\W+/);
                    function score(project) {
                        var strings = [
                            project.name.toLowerCase()
                        ];
                        if (project.slug) {
                            strings.push(project.slug.toLowerCase());
                        }
                        if (project.path && project.path != project.name) {
                            strings.push(project.path.toLowerCase());
                        }
                        var score2 = 0;
                        for (let w of words){
                            var cnt = 0;
                            var len = strings.length;
                            for (let s of strings){
                                if (!s) {
                                    continue;
                                }
                                if (s == text) {
                                    cnt += 3 * len;
                                }
                                if (s.startsWith(text)) {
                                    cnt += 2 * len;
                                }
                                if (s.startsWith(w)) {
                                    cnt += len;
                                }
                                if (s.includes(w)) {
                                    cnt += len;
                                }
                                len--;
                            }
                            if (cnt < 1) {
                                score2 = 0;
                                break;
                            } else {
                                score2 += cnt;
                            }
                        }
                        return score2;
                    }
                    var result = state.projects.filter(score);
                    if (result.length > 1) {
                        result = result.sort(function(a, b) {
                            return score(b) - score(a);
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
                    }
                },
                getResultValue: (result)=>result.name || result
                ,
                renderResult: function(result, props) {
                    const slug = result.slug ? `- <span class='slug'>#${result.slug}</span>` : "";
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
        }).bind(this))();
    }
    constructor(){
        super();
    }
}
Tonic.add(AutocompleteFilter);
class InputFilter extends FilterBase {
    connected() {
        this.classList.add("filter");
        this.state.inputs = this.querySelectorAll("input");
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
    input(e) {
        this.state.values[e.target.id] = e.target.value;
        dispatchChangeEvent(this, this.value);
    }
    get value() {
        return this.state["filter_" + this.id];
    }
    set value(val) {
        this.querySelector("#filter_" + this.id).value = val;
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
Tonic.add(InputFilter);
class DaterangeFilter extends InputFilter {
    input(e1) {
        const id = this.id;
        const ele = e1.target;
        if (ele.classList.contains("range-start")) {
            this.start = ele.value;
        } else if (ele.classList.contains("range-end")) {
            this.end = ele.value;
        }
        dispatchChangeEvent(this, this.value);
    }
    modifyState(parentState4) {
        if (parentState4.values) {
            parentState4.values[this.id + "_start"] = this.start;
            parentState4.values[this.id + "_end"] = this.end;
            delete parentState4.values[this.id];
        }
    }
    setState(parentState5) {
        const start = this.id + "_start";
        const end = this.id + "_end";
        this.value = parentState5.values[this.id];
        this.start = parentState5.values[start];
        this.end = parentState5.values[end];
    }
    get value() {
        return this.start + ":" + this.end;
    }
    set value(val3) {
        if (val3 == void 0) {
            return;
        }
        if (val3.indexOf(":") > 0) {
            const vals = val3.split(":");
            this.start = vals[0];
            this.end = vals[1];
        } else if (val3 !== ":") {
            this.start = "";
            this.end = val3;
        } else {
            this.start = "";
            this.end = "";
        }
    }
    get start() {
        return this.state.values[this.id + "_start"];
    }
    set start(val4) {
        this.state.values[this.id + "_start"] = val4;
        this.querySelector("#" + this.id + "_start").value = val4;
    }
    get end() {
        return this.state.values[this.id + "_end"];
    }
    set end(val5) {
        this.state.values[this.id + "_end"] = val5;
        this.querySelector("#" + this.id + "_end").value = val5;
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
    constructor(){
        super();
        if (!this.state.values) this.state.values = {
        };
    }
}
Tonic.add(DaterangeFilter);
class NavTabs extends InputFilter {
    set value(val6) {
        this.state.values[this.id] = val6;
    }
    get value() {
        return this.state.values[this.id];
    }
    set selected(tab) {
        if (this.state.selected == tab) {
            return;
        }
        if (this.state.selected) {
            this.state.selected.value = false;
        }
        if (!tab.value) {
            tab.value = true;
        }
        this.state.selected = tab;
        this.value = tab.id;
    }
    click(e2) {
        if (!e2.target.matches(".nav-link")) return;
        e2.preventDefault();
        e2.stopPropagation();
        const panel = e2.target.parentElement.getAttribute("panel");
        this.selected = document.getElementById(panel).parentElement;
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
Tonic.add(NavTabs);
class TabItem extends Tonic {
    set selected(val7) {
        this.value = val7;
    }
    get value() {
        return this.state.value;
    }
    set value(val8) {
        this.state.value = val8;
        if (val8) {
            this.state.panel.classList.remove("hidden");
            this.state.tab.classList.add("active");
        } else {
            this.state.panel.classList.add("hidden");
            this.state.tab.classList.remove("active");
        }
    }
    connected() {
        const parentTabs = this.parentElement.querySelector(".nav-tabs");
        const tab = this.querySelector(".nav-link");
        parentTabs.appendChild(tab.parentElement);
        this.state.tab = tab;
        this.state.panel = document.getElementById("panel-" + this.id);
    }
    get selected() {
        return this.value;
    }
    render() {
        const selected = this.selected ? "active" : "";
        const hidden = this.selected ? "" : "hidden";
        const label = this.props.label;
        return this.html`
    <li class='nav-item' panel='panel-${this.id}'>
      <a class='nav-link ${selected}' href='#panel-${this.id}'>${this.props.label}</a>
    </li>
    <div class='panel ${hidden}' id='panel-${this.id}'>
      ${this.childNodes}
    </div>
    `;
    }
}
Tonic.add(TabItem);
export { InputFilter, AutocompleteFilter, findTasks, DaterangeFilter, NavTabs };
