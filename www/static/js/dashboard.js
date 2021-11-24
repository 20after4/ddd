import {findTasks} from './autocomplete.js';

function renderVegaCharts() {
  function renderVegaChart(el, chart, query_string, height_style = undefined) {

    var data = []
    function datasource(chart, dataspec, query_string) {
      var type = dataspec['type']
      var query = encodeURIComponent( dataspec['query']);

      if (type == 'sql') {
        return {
          name: dataspec['name'],
          url: `/${chart.db}.json?_shape=objects&sql=${query}&${query_string}`,
          format: {'type': 'json', 'property': 'rows'}
        }
      } else if (type == 'query') {
        return {
          name: dataspec['name'],
          url: `/${chart.db}/${query}.json?_shape=objects&${query_string}`,
          format: {'type': 'json', "proprty": "rows"}
        }
      }
    }


    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      description: chart.title,
      width: 'container',
      height: height_style,
      view: {stroke: null},
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
      data: datasource(chart, {name: 'data', type:'sql', query:chart.query}, query_string),
      ...chart.display
    };
    if (el) {
      var view;
      var container = el;
      while (container && !container.classList.contains('dashboard-card')) {
        container=container.parentElement;
      }

      vegaEmbed(el, spec,{renderer: "svg"}).then(function(result) {
        result.view.run();
        console.log('spec',spec);
        result.view.logLevel(vega.Debug);
        view = result.view;

        result.view.addEventListener('click', function(event, ctx, arg2){
          if (!ctx){
            return;
          }
          const datum = ctx.datum;
          if (datum.task) {
            var queryframe = container.querySelector('queryframe')
            findTasks(datum.task).then(fetched => {
              //console.log('tasks',fetched);
              var rows = fetched.rows.map(function(r){
                return `<div>T${r.id} - ${r.name}</div>`
              })
              queryframe.innerHTML = rows.join('')
            });
          }
        });

      });
    }
  }
  var scripts = document.querySelectorAll('.dashboard-card-chart > script');
  for (var script of scripts) {
    renderVegaChart(script.parentElement,JSON.parse(script.text), window.location.search)
  }

  function bindEvent(x) {
    var field = x.parentElement.querySelector('input');
    x.addEventListener('click', function(event){
      field.value = '';
      x.style.display='none';
    });
    field.addEventListener('input',function(event){
      if (field.value) {
        x.style.display='block';
      } else {
        x.style.display='none';
      }
    })
  }

  for (var x of document.querySelectorAll(".filter-group .x")) {
    bindEvent(x);
  }
}
export {renderVegaCharts};