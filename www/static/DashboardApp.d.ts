import { TonicIcon } from './TonicIcon.js';
import { InputFilter } from './filter-input.js';
import { VegaChart } from './vega-tonic.js';
import { DependableComponent, Query } from "./dom.js";
import { DateTime } from "luxon";
declare class DashboardApp extends DependableComponent {
    query: Query;
    submitListener: any;
    popstateListener: any;
    constructor();
    update_state_listeners(): void;
    change(e: any): void;
    popstate(e: any): void;
    setState(state?: any): void;
    submit(e?: any): boolean;
    loadContent(url: URL): Promise<void>;
    render(): import("./tonic.js").TonicTemplate;
}
export { DashboardApp, InputFilter, VegaChart, DateTime, TonicIcon };
export default DashboardApp;
