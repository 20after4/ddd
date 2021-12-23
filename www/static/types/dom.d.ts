import Tonic from '@operatortc/tonic';
declare function waitForID(id: any, context?: any): Promise<unknown>;
interface WaitingForId {
    [index: string]: {
        promise: Promise<DependableComponent>;
        resolver: Function;
    };
}
declare type PHID = string;
interface QueryState {
    project?: PHID;
    date_start?: string;
    date_end?: string;
    [key: string]: any;
}
declare type StringAnyMap = {
    [key: string]: any;
};
declare class Query {
    valid_search_params: string[];
    _url: URL;
    static singleton_instance: any;
    _state: QueryState;
    _changed: StringAnyMap;
    static init(state?: QueryState): any;
    constructor();
    set state(newState: QueryState);
    set(key: any, val: any): this;
    set url(url: URL);
    get url(): URL;
    get state_changes(): StringAnyMap;
    get change_count(): any;
    reset_changes(): StringAnyMap;
    get state(): QueryState;
    get project(): string;
    set project(val: string);
    get date_start(): string;
    set date_start(val: string);
    get date_end(): string;
    set date_end(val: string);
    get values(): QueryState;
    get default_start(): string;
}
declare class DependableComponent extends Tonic {
    static _base_url: string;
    ele(selector: any): any;
    inp(selector: any): any;
    hasResolved: boolean;
    static _waitingFor: WaitingForId;
    static debug_logging: boolean;
    static logging: boolean;
    debug(...args: any[]): void;
    error(...args: any[]): void;
    log(...args: any[]): void;
    constructor(data?: any);
    get base_url(): any;
    waitfor(id: any): Promise<any>;
    connected(): void;
    resolved(): void;
}
export { DependableComponent, Query, waitForID };
//# sourceMappingURL=dom.d.ts.map