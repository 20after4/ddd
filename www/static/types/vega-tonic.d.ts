import { DependableComponent } from "./dom.js";
import { AsyncComponentFetcher, BaseDataSet } from './datasource.js';
declare class Chart extends DependableComponent {
    fetcher: AsyncComponentFetcher;
    constructor();
}
declare class VegaChart extends Chart {
    constructor();
    static stylesheet(): string;
    render(props: any): any;
    click(e: any): void;
    renderTable(): void;
    renderSource(): void;
    chartClicked(e: any, arg: any): Promise<void>;
    datasetChanged(ds: BaseDataSet): void;
    disconnected(): void;
    connected(): void;
    updated(props: any): void;
    loadcharts(): void;
}
declare class HtmlChart extends Chart {
    render(): any;
}
export { VegaChart, HtmlChart };
//# sourceMappingURL=vega-tonic.d.ts.map