import Autocomplete from "./_snowpack/pkg/@trevoreyre/autocomplete-js.js";
import Tonic from "./_snowpack/pkg/@optoolco/tonic.js";
import {fetchData} from "./datasource.js";
async function findTasks(tasks) {
  var ids = tasks.split(" ");
  var id_str = ids.map((id) => "'" + id + "'").join(",");
  var query = `/metrics/Task.json??sql=select+name%2C+status%2C+phid%2C+dateCreated%2C+dateModified%2C+description%2C+authorPHID%2C+ownerPHID%2C+priority%2C+points%2C+subtype%2C+closerPHID%2C+dateClosed%2C+[custom.points.final]%2C+[custom.deadline.start]%2C+id%2C+type%2C+attachments+from+Task+WHERE+id+in+(${id_str})+order+by+dateModified&_shape=objects&_size=max`;
  const response = await fetch(query);
  const fetched = await response.json();
  return fetched;
}
function dispatchChangeEvent(target, value) {
  const event = new CustomEvent("change", {
    bubbles: true,
    detail: {text: () => value}
  });
  target.dispatchEvent(event);
}
class FilterBase extends Tonic {
  constructor() {
    super();
    this.state.values = this.state.values || {};
  }
  modifyState(parentState) {
    if (parentState.values) {
      parentState.values[this.id] = this.value;
    }
  }
  setState(parentState) {
    if (parentState.values[this.id]) {
      this.value = parentState.values[this.id];
    }
  }
  connected() {
    this.classList.add("filter");
  }
  set value(val) {
    this.state.values[this.id] = val;
  }
  get value() {
    return this.state.values[this.id];
  }
}
class AutocompleteFilter extends FilterBase {
  static stylesheet() {
    return `
    .autocomplete-input {
      border: 1px solid #ccc;
      border-radius: 8px;
      width: 100%;
      padding: 7px 7px 7px 48px;
      box-sizing: border-box;
      position: relative;
      font-size: 16px;
      line-height: 1.5;
      flex: 1;
      background-color: #eee;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iOCIvPjxwYXRoIGQ9Ik0yMSAyMWwtNC00Ii8+PC9zdmc+');
      background-repeat: no-repeat;
      background-position: 12px center;
    }

    .autocomplete-input:focus,
    .autocomplete-input[aria-expanded="true"] {
      border-color: rgba(0, 0, 0, 0.12);
      background-color: #fff;
      outline: none;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.16);
    }

    [data-position="below"] .autocomplete-input[aria-expanded="true"] {
      border-bottom-color: transparent;
      border-radius: 8px 8px 0 0;
    }

    [data-position="above"] .autocomplete-input[aria-expanded="true"] {
      border-top-color: transparent;
      border-radius: 0 0 8px 8px;
      z-index: 2;
    }

    /* Loading spinner */
    .autocomplete[data-loading="true"]::after {
      content: "";
      border: 3px solid rgba(0, 0, 0, 0.12);
      border-right: 3px solid rgba(0, 0, 0, 0.48);
      border-radius: 100%;
      width: 20px;
      height: 20px;
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      animation: rotate 1s infinite linear;
    }

    .autocomplete-result-list {
      margin: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      padding: 0;
      box-sizing: border-box;
      max-height: 296px;
      overflow-y: auto;
      background: #fff;
      list-style: none;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.16);
    }

    [data-position="below"] .autocomplete-result-list {
      margin-top: -1px;
      border-top-color: transparent;
      border-radius: 0 0 8px 8px;
      padding-bottom: 8px;
    }

    [data-position="above"] .autocomplete-result-list {
      margin-bottom: -1px;
      border-bottom-color: transparent;
      border-radius: 8px 8px 0 0;
      padding-top: 8px;
    }

    /* Single result item */
    .autocomplete-result {
      cursor: default;
      padding: 12px 12px 12px 48px;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iOCIvPjxwYXRoIGQ9Ik0yMSAyMWwtNC00Ii8+PC9zdmc+');
      background-repeat: no-repeat;
      background-position: 12px center;
    }

    .autocomplete-result:hover,
    .autocomplete-result[aria-selected="true"] {
      background-color: rgba(0, 0, 0, 0.06);
    }

    @keyframes rotate {
      from {
        transform: translateY(-50%) rotate(0deg);
      }
      to {
        transform: translateY(-50%) rotate(359deg);
      }
    }
    `;
  }
  render() {
    return this.html`
        <div class="autocomplete filter-group" data-expanded="false" data-loading="false" data-position="below">
          <input class="autocomplete-input" controller="${this.id}" value="Release-Engineering-Team" name="${this.id}_text" id="${this.id}_text" placeholder="Enter project name or #hashtag" type="search">
          <ul class="autocomplete-result-list"></ul>
          <input type="hidden" name="${this.id}" controller="${this.id}" class='filter-input' id="${this.id}">
        </div>
      `;
  }
  async fetchProjectsJSON() {
    return fetchData("project_tree");
  }
  modifyState(parentState) {
    if (parentState.values) {
      parentState.values[this.id] = this.value["phid"];
    }
  }
  setState(parentState) {
    if (parentState.values[this.id]) {
      var hiddeninput = this.querySelector("input[type=hidden]");
      var val = parentState.values[this.id];
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
  set value(val) {
    if (val == this.state.values[this.id]) {
      return;
    }
    this.state.values[this.id] = val;
    this.completer.setValue(val);
    dispatchChangeEvent(this, val);
  }
  get value() {
    if (!this.state.values[this.id]) {
      var hiddeninput = this.querySelector("input[type=hidden]");
      return hiddeninput.value;
    }
    return this.state.values[this.id];
  }
  async connected() {
    const self = this;
    this.state.projects = this.fetchProjectsJSON().then((fetched) => {
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
          var strings = [project.name.toLowerCase()];
          if (project.slug) {
            strings.push(project.slug.toLowerCase());
          }
          if (project.path && project.path != project.name) {
            strings.push(project.path.toLowerCase());
          }
          var score2 = 0;
          for (let w of words) {
            var cnt = 0;
            var len = strings.length;
            for (let s of strings) {
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
      onUpdate: (results, selectedIndex) => {
        if (selectedIndex > -1) {
          const val = results[selectedIndex];
          self.value = val;
        }
      },
      onSubmit: (result) => {
        if (result && result.phid) {
          self.value = result;
        }
      },
      getResultValue: (result) => result.name || result,
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
    for (i of this.state.inputs) {
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
  static stylesheet() {
    return `
    input[type=search]::-webkit-search-cancel-button {
      -webkit-appearance: searchfield-cancel-button;
    }
    `;
  }
  constructor() {
    super();
    if (!this.state.values)
      this.state.values = {};
  }
  input(e) {
    const id = this.id;
    const ele = e.target;
    if (ele.classList.contains("range-start")) {
      this.start = ele.value;
    } else if (ele.classList.contains("range-end")) {
      this.end = ele.value;
    }
    dispatchChangeEvent(this, this.value);
  }
  modifyState(parentState) {
    if (parentState.values) {
      parentState.values[this.id + "_start"] = this.start;
      parentState.values[this.id + "_end"] = this.end;
      delete parentState.values[this.id];
    }
  }
  setState(parentState) {
    const start = this.id + "_start";
    const end = this.id + "_end";
    this.value = parentState.values[this.id];
    this.start = parentState.values[start];
    this.end = parentState.values[end];
  }
  get value() {
    return this.start + ":" + this.end;
  }
  set value(val) {
    if (val == void 0) {
      return;
    }
    if (val.indexOf(":") > 0) {
      const vals = val.split(":");
      this.start = vals[0];
      this.end = vals[1];
    } else if (val !== ":") {
      this.start = "";
      this.end = val;
    } else {
      this.start = "";
      this.end = "";
    }
  }
  get start() {
    return this.state.values[this.id + "_start"];
  }
  set start(val) {
    this.state.values[this.id + "_start"] = val;
    this.querySelector("#" + this.id + "_start").value = val;
  }
  get end() {
    return this.state.values[this.id + "_end"];
  }
  set end(val) {
    this.state.values[this.id + "_end"] = val;
    this.querySelector("#" + this.id + "_end").value = val;
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
Tonic.add(DaterangeFilter);
class NavTabs extends InputFilter {
  set value(val) {
    this.state.values[this.id] = val;
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
  click(e) {
    if (!e.target.matches(".nav-link"))
      return;
    e.preventDefault();
    e.stopPropagation();
    const panel = e.target.parentElement.getAttribute("panel");
    this.selected = document.getElementById(panel).parentElement;
  }
  render() {
    const val = this.value;
    const tabs = this.children;
    const tabitems = [];
    for (const tab of tabs) {
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
  set selected(val) {
    this.value = val;
  }
  get value() {
    return this.state.value;
  }
  set value(val) {
    this.state.value = val;
    if (val) {
      this.state.panel.classList.remove("hidden");
      this.state.tab.classList.add("active");
    } else {
      this.state.panel.classList.add("hidden");
      this.state.tab.classList.remove("active");
    }
  }
  connected() {
    const parentTabs = this.parentElement.querySelector(".nav-tabs");
    if (parentTabs) {
      const tab = this.querySelector(".nav-link");
      parentTabs.appendChild(tab.parentElement);
      this.state.tab = tab;
      this.state.panel = document.getElementById("panel-" + this.id);
    }
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
export {InputFilter, AutocompleteFilter, findTasks, DaterangeFilter, NavTabs};
