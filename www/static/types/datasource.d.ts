import { DependableComponent, Query } from "./dom.js";
declare class DataSource extends DependableComponent {
    constructor();
    static stylesheet(): string;
    set query(query_params: any);
    get url(): URL;
    fetch(opts?: {}): Promise<any>;
    get queries(): any;
    disconnected(): void;
    connected(): Promise<void>;
    reRender(): void;
    render(): any;
}
declare class BaseDataSet extends DependableComponent {
    query: Query;
    constructor();
    stateChanged(key: any, values: any): void;
    get url(): any;
}
declare class DataSet extends BaseDataSet {
    static stylesheet(): string;
    get url(): string;
    fetch(cache?: boolean): Promise<DatasetCursor>;
    render(p1: any, p2: any, p3: any): any;
}
declare class StaticDataSet extends DataSet {
    fetch(): Promise<any>;
    render(p1: any, p2: any, p3: any): any;
}
interface DataResponse {
    rows: any[];
    columns: string[];
    error: any;
    ok: boolean;
    private: boolean;
    query: {
        sql: string;
        params: {
            any: any;
        };
    };
    database: string;
    query_ms: number;
    truncated: boolean;
}
declare class DatasetCursor {
    data: {
        rows: any[];
        columns: any[];
    };
    dataset: DataSet;
    url: string;
    indexes: {};
    constructor(dataset: DataSet, data: DataResponse, url: string);
    get length(): number;
    get rows(): any[];
    get columns(): any[];
    get rawdata(): {
        rows: any[];
        columns: any[];
    };
    filter(cb: any, thisarg: any): any[];
    /**
     * creates an index over one column of the data
     */
    index(key: any): any;
    /** lookup searches the dataset for a row matching 'val' in the 'key' column
     * this will create an index over the column for faster lookups after the first use.
     */
    lookup(key: any, val: any): any;
}
declare function initDataSets(): boolean;
declare function fetchData(dataset_id: string, cache?: boolean, wait?: boolean): Promise<DatasetCursor>;
export { DataSource, BaseDataSet, DataSet, StaticDataSet, initDataSets, fetchData };
//# sourceMappingURL=datasource.d.ts.map