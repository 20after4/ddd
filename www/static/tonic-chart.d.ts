import { ChartTypeRegistry } from 'chart.js'
import { TonicChart, BubbleChart, CategoricalBubbleController} from './tonic-chart.js'
declare module 'chart.js' {
    interface ChartTypeRegistry {
        categoricalBubble: ChartTypeRegistry['bubble']
    }
}
export { TonicChart, BubbleChart, CategoricalBubbleController }
