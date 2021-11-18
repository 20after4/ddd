declare class Tonic extends HTMLElement {
    id:string;
    static _createId(): string;
    static _splitName(s: any): any;
    static _normalizeAttrs(o: any, x?: {}): {};
    static match(el: any, s: any): any;
    static getPropertyNames(proto: any): string[];
    static add(c: any, htmlName?: any): any;
    static registerStyles(stylesheetFn: any): void;
    static escape(s: any): any;
    static unsafeRawString(s: any, templateStrings: any): TonicTemplate;
    _tags: string;
    _refIds: any[];
    _data: {};
    _states: {};
    _children: {};
    _reg: {};
    _stylesheetRegistry: any[];
    _index: number;
    version: any;
    SPREAD: RegExp;
    ESC: RegExp;
    AsyncFunctionGenerator: Function;
    AsyncFunction: Function;
    MAP: {
        '"': string;
        '&': string;
        '\'': string;
        '<': string;
        '>': string;
        '`': string;
        '/': string;
    };
    _state: any;
    preventRenderOnReconnect: boolean;
    props: any;
    elements: any[];
    nodes: any[];
    get base_url(): any;
    _checkId(): string;
    set state(arg: any);
    get state(): any;
    _events(): void;
    _prop(o: any): string;
    _placehold(r: any): string;
    dispatch(eventName: any, detail?: any): void;
    html(strings: any, ...values: any[]): TonicTemplate;
    scheduleReRender(oldProps: any): any;
    pendingReRender: any;
    reRender(o?: {}): any;
    handleEvent(e: any): void;
    _drainIterator(target: any, iterator: any): any;
    _set(target: any, render: any, content?: string): any;
    _apply(target: any, content: any): void;
    connectedCallback(): any;
    root: any;
    _id: any;
    _source: any;
    isInDocument(target: any): boolean;
    disconnectedCallback(): void;
    isTonicComponent: boolean;
    ele(selector:string):HTMLElement;
    inp(selector:string):HTMLInputElement;
    click(e?:Event)
}
declare class TonicTemplate {
    constructor(rawText: any, templateStrings: any, unsafe: any);
    isTonicTemplate: boolean;
    unsafe: any;
    rawText: any;
    templateStrings: any;
    valueOf(): any;
    toString(): any;
}
export default Tonic;
export {Tonic, TonicTemplate};
