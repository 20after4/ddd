import { DependableComponent } from "./dom.js";
import { vega } from 'vega-embed';
import vegaEmbed from 'vega-embed';
import { fetchData } from './datasource.js';
class VegaChart extends DependableComponent {
    constructor() {
        super();
        this.props.spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            view: { stroke: null },
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
    static stylesheet() {
        return `
      tab-item .panel {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      vega-chart {
        display: block;
        flex: 1 1 800px;
        margin: 0.5rem 0.5rem;
        padding: 1rem;
        border: 1px solid #ddd;
      }
      .vega-embed {
        display: block;
        width: auto;
        height: auto;
      }

    `;
    }
    datasetChanged(ds) {
        if (this.state.view) {
            const view = this.state.view;
            const url = ds.url;
            this.disconnected();
            this.hasResolved = false;
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
        if (this.state && this.state.vega) {
            this.state.vega.finalize();
            this.state.vega = null;
            this.state.view = null;
        }
    }
    connected() {
        this.loadcharts();
    }
    updated(props) {
        this.loadcharts();
    }
    loadcharts() {
        const data_id = this.getAttribute('data-source');
        this.state.data_id = data_id;
        var datasource = this.props.datasource || document.getElementById(data_id);
        this.props.datasource = datasource;
        if (!this.state.display) {
            const script = this.querySelector('script');
            const json = script.innerText;
            this.state.display = JSON.parse(json);
        }
        fetchData(data_id).then((data) => {
            console.log('data', data);
            if (!data.rows || data.rows.length < 1) {
                console.log('no data', data);
                return;
            }
            var spec = {
                ...this.props.spec,
                data: {
                    name: "data",
                    values: data.rows
                    //format: {'type': 'json', 'property': 'rows'}
                },
                ...this.state.display
            };
            console.log('vega spec', spec);
            console.log('data-source for vega-chart', datasource.url);
            var self = this;
            // @ts-ignore
            var embed = vegaEmbed(this.querySelector('.vega-embed'), spec, { renderer: "svg", ...this.props.options });
            embed.then(function (result) {
                self.state.vega = result;
                self.state.view = result.view;
                result.view.logLevel(vega.Debug);
                result.view.run();
                console.log('vega running', result);
            });
        });
    }
    render(props) {
        return this.html `
    <div class='chart-title'>${this.props.title}</div>
    ${this.elements}
    <div class='vega-embed'></div>
    `;
    }
}
export { VegaChart };
//# sourceMappingURL=vega-tonic.js.map