import Tonic from '@operatortc/tonic'
import {DependableComponent} from "./dom.js"
import {vegaLite, vega} from 'vega-embed'
import vegaEmbed from 'vega-embed'

import {BaseDataSet, fetchData } from './datasource.js'

class VegaChart extends DependableComponent {
  constructor() {
    super();
    this.props.spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container',
      height: 'container',
      padding: 50,
      autosize: {
        type: "fit",
        contains: "padding"
      },
      view: {stroke: null},
      config: {
        background: '#00000000',
        arc: {
          innerRadius: 50
        },
        line: {
          point: true
        }
      }
    };
  }
  static stylesheet () {
    return `
      vega-chart .chart-title {
        font-weight: bold;
      }
      tab-item .panel {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      vega-chart {
        background-color:white;
        display: block;
        margin: 0.5rem 0.5rem;
        padding: 0.5rem;
        border: 1px solid #ddd;
        overflow:hidden;
      }
      vega-chart {
        flex: 1 1 45%;
        position:relative;
        height: auto !important;
        width: auto;
        min-height: 450px;
        max-height: 800px;
        min-width: 600px;
        max-width: 50%;
      }
      vega-chart.view-stack, vega-chart.view-table {
        height: auto;
        width:100%;
        flex: 0 0 100%;
        max-width: 100%;
        max-height: 100%;
        min-height: 550px
      }
      vega-chart.max {
        position: absolute;
        right: 0px;
        left: 0px;
        margin: 0px !important;
        z-index: 1000;
        width: auto;
        height: auto !important;
        bottom: 0px;
        top: 76px;
      }
      vega-chart .vega-embed {
        position:unset;
        display:block;
        width: 100%;
        height: 100%;
        padding-right: 0;
      }
      .vega-embed svg {
        width: 100%;
        height: 100%;
      }
      .view-switcher {
        position: absolute;
        top:0;
        right:0;
      }

      vega-chart.view-table .vega-embed {
        display:none;
      }
      vega-chart .table-view{
        display:none;
      }
      vega-chart.view-table {
        position: relative;
      }
      vega-chart.view-table .table-view {
        display: block;
        width: 100%;
        overflow:scroll;
        height: 100%;
      }
    `
  }

  render (props) {
    return this.html`
    <div class='chart-title'>${this.props.title}</div>
    ${this.html`<button-group class='view-switcher' id='${this.id}-view-switcher'></button-group>`}
    ${this.elements}
    <div class='vega-embed'>
    <tonic-loader></tonic-loader>
    </div>
    <div class='table-view'>

    </div>
    `
  }

  click(e){
    try {
      const label = e.target.closest('label');
      if (!label) return;
      const classes = label.classList;

      if (classes.contains('view-stack')) {
        this.className = 'view-stack';
      } else if (classes.contains('view-grid')) {
        this.className = 'view-grid';
      } else if (classes.contains('view-table')) {
        this.renderTable();
        this.className = 'view-table';
      } else {
        this.className = 'view-normal';
      }
    } catch(err) {
      this.debug(err, e);
    }
  }
  renderTable() {
    if (this.state.data){
      console.log(this.state.data);
      const out = [];
      out.push('<table class="table table-striped table-hover table-sm table-bordered"><thead><tr>');
      out.push(`<caption>Tabular source data for the chart titled "${this.props.title}"</caption>`)
      for (const col of this.state.data.columns) {
        out.push("<th>"+col+"</th>");
      }
      out.push("</tr></thead><tbody>");
      for (const row of this.state.data.rows) {
        out.push('<tr>');
        for (const col in row) {
          out.push("<td>"+row[col]+"</td>");
        }
        out.push('</tr>');
      }
      out.push("</tbody></table>");
      const container = this.querySelector('.table-view');
      container.innerHTML = out.join("");
    }
  }
  datasetChanged(ds:BaseDataSet) {
    if (this.state.view) {
      const view = this.state.view;
      const url = ds.url;
      this.disconnected();
      this.hasResolved=false;
      this.reRender();
      // fetch(url).then(function(response){
      //   view.data('data', response.json());
      //   view.signal('url', url).run();
      //   view.signal('width', 400).run();
      //   console.log('vega view', view);
      //   console.log('vega state', view.getState());
      // });

    }
    this.loadcharts();
  }

  disconnected() {

  }

  connected(){
    //this.loadcharts();
  }

  updated(props) {
    this.loadcharts();
  }
  loadcharts () {
    if (this.state && this.state.vega) {

      this.state.vega.finalize();
      this.state.vega = null;
      this.state.view = null;
      const vega = this.querySelector('.vega-embed');
      console.log('reload vega', this.state, vega);
      if (vega)
        vega.remove();

    }
    const data_id = this.getAttribute('data-source');
    this.state.data_id = data_id;
    var datasource = this.props.datasource || document.getElementById( data_id );
    this.props.datasource = datasource;
    if (!this.state.display) {
      const script = this.querySelector('script');
      const json = script.innerText
      this.state.display = JSON.parse(json);
    }

    fetchData(data_id).then((data) => {
      this.state.data = data;
      var spec = {
        ...this.props.spec,
        data: {
          name: "data",
          values: data.rows
          //format: {'type': 'json', 'property': 'rows'}
        },
        ...this.state.display
      };

      vegaEmbed(
        this.querySelector('.vega-embed'),
        spec,
        {renderer: "svg", actions: false, ...this.props.options}
      ).then((result) => {
        this.state.vega = result;
        this.state.view = result.view;


        if (result.view){
          if (DependableComponent.debug_logging) {
            //result.view.logLevel(vega.Debug);
          } else {
            result.view.logLevel(vega.Error);
          }
          result.view.run();
          this.debug('vega running', result);
          this.classList.remove('hidden')
        }else{
          this.debug('no vega view');
        }


      }).catch((result)=>{
        try {
          this.classList.add('hidden');
          if (this.state.vega) {
            this.state.vega.finalize();
          }
          this.debug(result);
        } catch (err) {
          this.error(err);
        }
      });
    }).catch((reason) => {
      this.debug(reason);
      this.classList.add('hidden');
    });

  }




}

class ButtonGroup extends DependableComponent {
  btns:any = [
    {
      id: 'view-grid',
      icon: 'icon-grid-3x2',
      title: 'Display the chart narrow.',
      checked: true,
    },
    {
      id: 'view-stack',
      icon: 'icon-view-stacked',
      title: 'Display the chart wider.',
      checked: false,
    },
    {
      id: 'view-table',
      icon: 'icon-table',
      title: 'Tabular view of this data.',
      checked: false,
    },

  ]
  renderButtons() {
    var btns = [];
    for (const btn of this.btns) {
      const checked = btn.checked ? 'checked' : '';
      btns.push(this.html`
        <input type="radio"
          class="btn-check"
          id="${this.id}-${btn.id}"
          name="${this.id}"
          autocomplete="off"
          value='${btn.id}'
          ${checked}>
        <label class="btn btn-outline-secondary btn-sm ${btn.id}" for="${this.id}-${btn.id}"><span class="visually-hidden">${btn.title}</span>
          <tonic-icon title="${btn.title}" symbol-id="${btn.icon}"
          alt="${btn['alt']}"
          src="${this.baseurl}static/icons.svg"
          fill="${btn['color']??'black'}"
          size="20px"></tonic-icon>
        </label>
      `);
    }
    return btns;
  }
  render() {
    return this.html`
    <form id='form-${this.id}'><div class="btn-group" role="group" aria-label="Basic radio toggle button group">
      ${this.renderButtons()}
    </div></form>`;
  }

}
Tonic.add(ButtonGroup);
export {VegaChart}