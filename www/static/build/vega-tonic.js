import Tonic from './_snowpack/pkg/@optoolco/tonic.js'
import vegaEmbed from './_snowpack/pkg/vega-embed.js'

class VegaChart extends Tonic {

  static stylesheet () {
    return `
      vega-chart {
        display: inline-block;
        position: relative;
      }

      vega-chart canvas {
        display: inline-block;
        position: relative;
      }
    `
  }


  async redraw () {
    if (this.props.spec) {
      this.disconnected()
      return this.connected();
    }
  }

  disconnected() {
    if (this.state && this.state.vega) {
      this.state.vega.finalize();
      this.state.vega = null;
      this.state.view = null;
    }
  }

  async connected () {
    if (!this.props.spec)
      return;

    result = await vegaEmbed(el, this.props.spec, {renderer: "svg", ...this.props.options});
    this.state.vega = result;
    this.state.view = result.view;
    console.log('vega spec', this.props.spec)
    result.view.run();
  }

  render () {
    return this.html`
      <div class='vega-chart'>
      </div>
    `
  }
}
Tonic.add(VegaChart);
export {VegaChart}