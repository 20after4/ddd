declare const CategoricalBubbleController_base: import("chart.js").ChartComponent & {
    new (chart: import("chart.js").Chart<keyof import("chart.js").ChartTypeRegistry, (number | import("chart.js").ScatterDataPoint | import("chart.js").BubbleDataPoint)[], unknown>, datasetIndex: number): BubbleController;
    prototype: BubbleController;
};
export class CategoricalBubbleController extends CategoricalBubbleController_base {
}
export namespace CategoricalBubbleController {
    const id: string;
    namespace defaults {
        const datasetElementType: boolean;
        const dataElementType: string;
        namespace animations {
            namespace numbers {
                const type: string;
                const properties: string[];
            }
        }
    }
    namespace overrides {
        namespace scales {
            namespace x {
                const type_1: string;
                export { type_1 as type };
            }
            namespace y {
                const type_2: string;
                export { type_2 as type };
            }
        }
        namespace plugins {
            namespace tooltip {
                namespace callbacks {
                    function title(context: any): any;
                    function title(context: any): any;
                }
            }
        }
    }
}
import { BubbleController } from "chart.js";
export {};
