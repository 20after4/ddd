import Autocomplete from "../_snowpack/pkg/@trevoreyre/autocomplete-js/dist/autocomplete.esm.js";
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
function projectSearcher() {
    var projects = [];
    function _fetchProjectsJSON() {
        _fetchProjectsJSON = _asyncToGenerator(function*() {
            const response = yield fetch("/metrics/project_tree.json?_shape=objects&_size=max&_ttl=86400");
            const fetched = yield response.json();
            return fetched;
        });
        return _fetchProjectsJSON.apply(this, arguments);
    }
    function fetchProjectsJSON() {
        return _fetchProjectsJSON.apply(this, arguments);
    }
    const elements = document.querySelectorAll(".autocomplete");
    if (elements && elements.length) {
        fetchProjectsJSON().then((fetched)=>{
            projects = fetched.rows;
        });
    }
    elements.forEach((el)=>{
        var hiddeninput = el.parentElement.querySelector("input[type=hidden]");
        var completer = new Autocomplete(el, {
            search: (input)=>{
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
                        strings.push(project.slug);
                    }
                    var score2 = 0;
                    for (let w of words){
                        var cnt = 0;
                        for (let s of strings){
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
            onUpdate: (results, selectedIndex)=>{
                if (selectedIndex > -1) {
                    hiddeninput.value = results[selectedIndex].phid;
                } else {
                    hiddeninput.value = "";
                }
            },
            onSubmit: (result)=>{
                if (result && result.phid) {
                    result = result.phid;
                } else {
                    result = "";
                }
                hiddeninput.value = result;
            },
            getResultValue: (result)=>result.name
            ,
            renderResult: (result, props)=>`
          <li ${props}>
            <div>
              ${result.name}
            </div>
          </li>
        `
            ,
            debounceTime: 500
        });
    });
}
export { projectSearcher, findTasks };
