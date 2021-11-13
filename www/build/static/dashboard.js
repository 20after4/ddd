import { findTasks } from './autocomplete.js';
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
function renderVegaCharts() {
    function renderVegaChart(el, chart1, query_string1, height_style = undefined) {
        var data = [];
        function datasource(chart, dataspec, query_string) {
            var type = dataspec['type'];
            var query = encodeURIComponent(dataspec['query']);
            if (type == 'sql') {
                return {
                    name: dataspec['name'],
                    url: `/${chart.db}.json?_shape=objects&sql=${query}&${query_string}`,
                    format: {
                        'type': 'json',
                        'property': 'rows'
                    }
                };
            } else if (type == 'query') {
                return {
                    name: dataspec['name'],
                    url: `/${chart.db}/${query}.json?_shape=objects&${query_string}`,
                    format: {
                        'type': 'json',
                        "proprty": "rows"
                    }
                };
            }
        }
        const spec = _objectSpread({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: chart1.title,
            width: 'container',
            height: height_style,
            view: {
                stroke: null
            },
            config: {
                background: '#00000000',
                arc: {
                    innerRadius: 50
                },
                line: {
                    point: true
                }
            },
            datasets: {
            },
            data: datasource(chart1, {
                name: 'data',
                type: 'sql',
                query: chart1.query
            }, query_string1)
        }, chart1.display);
        if (el) {
            var view;
            var container = el;
            while(container && !container.classList.contains('dashboard-card')){
                container = container.parentElement;
            }
            vegaEmbed(el, spec, {
                renderer: "svg"
            }).then(function(result) {
                result.view.run();
                console.log('spec', spec);
                result.view.logLevel(vega.Debug);
                view = result.view;
                result.view.addEventListener('click', function(event, ctx, arg2) {
                    if (!ctx) {
                        return;
                    }
                    const datum = ctx.datum;
                    if (datum.task) {
                        var queryframe = container.querySelector('queryframe');
                        findTasks(datum.task).then((fetched)=>{
                            //console.log('tasks',fetched);
                            var rows = fetched.rows.map(function(r) {
                                return `<div>T${r.id} - ${r.name}</div>`;
                            });
                            queryframe.innerHTML = rows.join('');
                        });
                    }
                });
            });
        }
    }
    var scripts = document.querySelectorAll('.dashboard-card-chart > script');
    for (var script of scripts){
        renderVegaChart(script.parentElement, JSON.parse(script.text), window.location.search);
    }
    function bindEvent(x) {
        var field = x.parentElement.querySelector('input');
        x.addEventListener('click', function(event) {
            field.value = '';
            x.style.display = 'none';
        });
        field.addEventListener('input', function(event) {
            if (field.value) {
                x.style.display = 'block';
            } else {
                x.style.display = 'none';
            }
        });
    }
    for (var x1 of document.querySelectorAll(".filter-group .x")){
        bindEvent(x1);
    }
}
export { renderVegaCharts };
