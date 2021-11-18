
import Chart from 'chart.js/auto';
import 'chartjs-adapter-luxon';
import {CategoricalBubbleController} from './CategoricalBubbleController.js';
import Tonic from '@operatortc/tonic'


class TonicChart extends Tonic {
  constructor () {
    super()
    this.Chart = Chart;
  }
  static stylesheet () {
    return `
      tonic-chart {
        display: inline-block;
        position: relative;
      }

      tonic-chart canvas {
        display: inline-block;
        position: relative;
      }
    `
  }

  async redraw () {
    return this.connected()
  }

  options(data) {
    return {
      type: 'bar',
      data: {},
      options: {}
    }
  }

  async connected () {
    var datasets = this.children;
    console.log('this',this);
    console.log('datasets', datasets)
    let data = null
    if (this.props.library) {
      this.Chart = this.props.library;
    }
    console.log('this.props', this.props)
    if (!this.Chart) return;

    var src = this.props.src;

    if (typeof src === 'string') {
      if (src.startsWith('ds-')) {
        src = document.getElementById(src);
        this.props.src = src;

      }
    }
    if (typeof src == 'object' && src.fetch) {
      var response = await src.fetch();
      console.log('response', response);
      if (response.err) {
        console.error(response.err)
        data = {}
      } else {
        data = response.rows;
        const options = this.options(data);

        console.log('chart options', options)
        const root = this.querySelector('canvas');
        // @ts-ignore
        const chart = new this.Chart(root, options);
        this.state.chart = chart;
        console.log(chart);
      }
    }
  }

  render () {
    const {
      width,
      height
    } = this.props

    this.style.width = width
    this.style.height = height

    return this.html`
      <canvas ...${{ width, height }}>
      </canvas>
      <div class='children' style='display:none'>
      ${this.elements}
      </div>
    `
  }
}
Tonic.add(TonicChart);

class BubbleChart extends TonicChart {
  constructor() {
    super();


  }
  options(data) {
    console.log(this.getAttributeNames(), this);
    const xKey = this.getAttribute('x') || 'x';
    const yKey = this.getAttribute('y') || 'y';
    const valueKey = this.getAttribute('value') || 'value';
    const max = parseInt(this.getAttribute('max') || '0');
    const min = parseInt(this.getAttribute('min')||'0');
    const values = []
    const labelmap = {};
    const labels = [];
    const keys = ['x','y']
    var idx = 0;
    for (const d of data) {
      values.push(d[valueKey]||d['r'])
    }
    const maxValue = Math.max(...values);
    for (const indexKey of keys) {
      for (const d of data) {
        const val = d[indexKey];
        if (!labelmap[val]){
          labels.push(val);
          labelmap[val]=labels.length-1;
        }
        d[indexKey] = labelmap[val];
        var rval = parseInt(d[valueKey]);
        d['value'] = rval;
        if (max > 0) {
          rval = Math.round((rval / maxValue) * max);
        }
        if (rval < min) {
          rval = min;
        }
        d['_custom'] = rval;
      }
    }
    console.log(labels);
    return {
      type: 'categoricalBubble',
      data: {
            labels: labels,
            datasets: [
            {
              label: 'chart',
              data: data,
              parsing:false
            }
          ]
      },
      options: {
          parsing: {
            xAxisKey: xKey,
            yAxisKey: yKey,
            index: this.getAttribute('index')|| 'x',
            value: valueKey,
          },
          scales: {
              x: { type: 'category', labels: labels},
              y: { type: 'category', labels: labels},
              radius: { type: 'linear', min: 2, max: 25}
          }
      }
    }
  }

}
Tonic.add(BubbleChart);


export { TonicChart, BubbleChart, CategoricalBubbleController }
