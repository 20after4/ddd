import Autocomplete from "../_snowpack/pkg/@trevoreyre/autocomplete-js.js";
import Tonic from "../_snowpack/pkg/@optoolco/tonic.js";
async function findTasks(tasks) {
  var ids = tasks.split(" ");
  var id_str = ids.map((id) => "'" + id + "'").join(",");
  var query = `/metrics/Task.json??sql=select+name%2C+status%2C+phid%2C+dateCreated%2C+dateModified%2C+description%2C+authorPHID%2C+ownerPHID%2C+priority%2C+points%2C+subtype%2C+closerPHID%2C+dateClosed%2C+[custom.points.final]%2C+[custom.deadline.start]%2C+id%2C+type%2C+attachments+from+Task+WHERE+id+in+(${id_str})+order+by+dateModified&_shape=objects&_size=max`;
  const response = await fetch(query);
  const fetched = await response.json();
  return fetched;
}
class AutocompleteFilter extends Tonic {
  render() {
    return this.html`
        <div id="autocomplete" class="autocomplete" style="position: relative;" data-expanded="false" data-loading="false" data-position="below">
          <input class="autocomplete-input" value="Release-Engineering-Team" name="project_name" id="project_name" placeholder="Enter project name or #hashtag" role="combobox" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-owns="autocomplete-result-list-1" aria-activedescendant="">
          <ul class="autocomplete-result-list" role="listbox" style="position: absolute; z-index: 1; width: 100%; box-sizing: border-box; visibility: hidden; pointer-events: none; top: 100%;" id="autocomplete-result-list-1"></ul>
          <input type="hidden" name="project" id="project" value="PHID-PROJ-uier7rukzszoewbhj7ja">
        </div>
      `;
  }
  connected() {
    var hiddeninput = this.querySelector("input[type=hidden]");
    this.completer = new Autocomplete(this, {
      search: (input) => {
        if (input.length < 1) {
          return [];
        }
        let text = input.toLowerCase();
        let words = text.split(/\W+/);
        function score(project) {
          var strings = [project.name.toLowerCase()];
          if (project.slug) {
            strings.push(project.slug);
          }
          var score2 = 0;
          for (let w of words) {
            var cnt = 0;
            for (let s of strings) {
              if (!s) {
                continue;
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
              score2 = 0;
              break;
            } else {
              score2 += cnt;
            }
          }
          return score2;
        }
        var result = projects.filter(score);
        if (result.length > 1) {
          result = result.sort(function(a, b) {
            return score(b) - score(a);
          });
        }
        return result;
      },
      autoSelect: true,
      onUpdate: (results, selectedIndex) => {
        if (selectedIndex > -1) {
          hiddeninput.value = results[selectedIndex].phid;
        }
      },
      onSubmit: (result) => {
        if (result && result.phid) {
          result = result.phid;
        } else {
          result = "";
        }
        hiddeninput.value = result;
      },
      getResultValue: (result) => result.name,
      renderResult: (result, props) => `
        <li ${props}>
          <div>
            ${result.name}
          </div>
        </li>
      `,
      debounceTime: 500
    });
  }
}
var projects = [];
async function fetchProjectsJSON() {
  const response = await fetch("/metrics/project_tree.json?_shape=objects&_size=max&_ttl=86400");
  const fetched = await response.json();
  return fetched;
}
Tonic.add(AutocompleteFilter);
class InputFilter extends Tonic {
  connected() {
    const inputs = this.querySelectorAll("input");
    var i;
    var self = this;
    for (i of inputs) {
      i.addEventListener("input", function(e) {
        self.input(e);
      });
    }
  }
  input(e) {
    this.state.value = e.target.value;
  }
  render() {
    const id = this.props.id;
    var name = this.props.name || id;
    var label = this.props.label || name;
    return this.html`
      <div id="filter-group-${id}" class="filter-group input-group dashboard-filter filter-type-text">
      <span class="input-group-text"><label for="${id}">${label}</label></span>
      <input id="${id}" name="${name}" class="form-control" type="text">
      </div>`;
  }
}
Tonic.add(InputFilter);
class DaterangeFilter extends InputFilter {
  input(e) {
    const ele = e.target;
    if (ele.classList.contains("range-start")) {
      this.state.data_start = ele.value;
    } else if (ele.classList.contains("range-end")) {
      this.state.date_end = ele.value;
    }
  }
  disconnected() {
  }
  render() {
    return this.html`
    <div id="filter-group-date" class="p-0 d-inline-flex input-group filter-type-daterange align-self-center w-25">
    <span class="input-group-text">From:</span>
    <input id="date_start" name="date_start" class="form-control range-start" type="date" value="2020-11-01" aria-label="Start Date">
    <span class="input-group-text">To:</span>
    <input id="date_end" name="date_end" class="form-control range-end" type="date" value="2021-11-01" aria-label="End Date">
    </div>
    `;
  }
}
Tonic.add(DaterangeFilter);
export {InputFilter, AutocompleteFilter, findTasks, DaterangeFilter};
