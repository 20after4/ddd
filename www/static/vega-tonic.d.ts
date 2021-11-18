import { DependableComponent } from "./dom.js";
import { BaseDataSet } from './datasource.js';
declare class VegaChart extends DependableComponent {
    constructor();
    static stylesheet(): string;
    render(props: any): import("./tonic.js").TonicTemplate;
    click(e: any): void;
    renderTable(): void;
    datasetChanged(ds: BaseDataSet): void;
    disconnected(): void;
    connected(): void;
    updated(props: any): void;
    loadcharts(): void;
}
export { VegaChart };
