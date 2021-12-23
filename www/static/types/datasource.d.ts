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
    fetch(ids: any): Promise<any>;
    render(p1: any, p2: any, p3: any): any;
}
interface DataMap {
    [key: string]: any;
}
/**
 * AsyncComponentFetcher -
 * handles loading a bunch of objects from the back end
 * database by batching individual calls to load() and bundling them together into
 * one call to the backend where the rows are loaded in a single query of the form:
 * SELECT * FROM Table WHERE pk IN (id1, id2, ..., idn)
 *
 * The async load(id) function blocks up to 10ms to allow a bunch of async calls to collect
 * the ids that are needed and then load will batch the calls into one fetch, finally the
 * results of the fetch are unbundled and returned by the individual promises.
 */
declare class AsyncComponentFetcher {
    ds: StaticDataSet;
    cls: typeof DependableComponent;
    data: DataMap;
    pending: Promise<any>;
    batching: Promise<any>;
    pk: string;
    requestedIds: string[];
    constructor(ds: StaticDataSet, cls: typeof DependableComponent, pk: string);
    load(id: any): Promise<any>;
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
export { DataSource, BaseDataSet, DataSet, StaticDataSet, initDataSets, fetchData, AsyncComponentFetcher };
//# sourceMappingURL=datasource.d.ts.map