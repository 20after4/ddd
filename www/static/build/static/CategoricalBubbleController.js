import {BubbleController} from '../_snowpack/pkg/chartjs/auto.js';
class CategoricalBubbleController extends BubbleController {

  /**
	 * Parse array of objects
	 * @protected
	 */
   parseObjectData(meta, data, start, count) {
    const parsed = super.parseObjectData(meta, data, start, count);
    for (let i = 0; i < parsed.length; i++) {
      const item = data[start + i];
      // @ts-ignore
      parsed[i]._custom = (item && item.r && +item.r || this.resolveDataElementOptions(i + start).radius);
    }
    return parsed;
  }
};
CategoricalBubbleController.id = 'categoricalBubble';
CategoricalBubbleController.defaults =  {
  datasetElementType: false,
  dataElementType: 'point',
  animations: {
    numbers: {
      type: 'number',
      properties: ['x', 'y', 'borderWidth', 'radius']
    }
  }
};
CategoricalBubbleController.overrides = {
  scales: {
    x: {
      type: 'category'
    },
    y: {
      type: 'category'
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        title(context) {
          var value = context[0] && context[0].parsed && context[0].parsed['value'];
          if (!value) {
            return '';
          }
          return value;
        }
      }
    }
  }
};
Chart.register(CategoricalBubbleController);

export {CategoricalBubbleController}