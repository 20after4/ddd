import { TonicInput } from '../_snowpack/pkg/@optoolco/components/input.js'
import vegaEmbed from '../_snowpack/pkg/vega-embed.js'



class FilterField extends TonicInput {



  static stylesheet () {
    return `
      filter-field {
        display: inline-block;
        position: relative;
      }
    `
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
    result.view.run();
  }

  render () {
    return this.html`
      <div class='filter-group input-group dashboard-filter'>
      <span class='input-group-text'><label for='${this.props.id}'></label></span>
      <input type=''
      </div>
    `
  }
}
export {VegaChart}