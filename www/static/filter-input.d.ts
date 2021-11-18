import { DependableComponent, Query } from "./dom.js";
declare function findTasks(tasks: string): Promise<any>;
declare class FilterBase extends DependableComponent {
    query: Query;
    constructor();
    modifyState(query: any): void;
    setState(query: any): void;
    connected(): void;
    set value(val: any);
    get value(): any;
    get changed(): any;
    set changed(val: any);
    blur(): void;
}
declare class AutocompleteFilter extends FilterBase {
    input: HTMLInputElement;
    static stylesheet(): string;
    completer: any;
    render(): import("./tonic.js").TonicTemplate;
    click(): void;
    modifyState(query: any): void;
    setState(query: any): Promise<void>;
    set value(val: any);
    get value(): any;
    connected(): void;
}
declare class InputFilter extends FilterBase {
    connected(): void;
    input(e: any): void;
    get value(): any;
    set value(val: any);
    render(): import("./tonic.js").TonicTemplate;
}
declare class DaterangeFilter extends InputFilter {
    static stylesheet(): string;
    input(e: Event): void;
    modifyState(query: Query): void;
    setState(query: Query): void;
    get value(): string;
    set value(val: string);
    get start(): any;
    get end(): any;
    get(id: string): any;
    set start(val: any);
    set end(val: any);
    disconnected(): void;
    click(): void;
    render(): import("./tonic.js").TonicTemplate;
}
declare type TabType = TabItem & HTMLElement;
declare class NavTabs extends InputFilter {
    tabs: TabType[];
    constructor();
    set value(val: any);
    get value(): any;
    set selected(tab: any);
    connected(): void;
    click(e: any): void;
    renderTabs(): any[];
    render(): import("./tonic.js").TonicTemplate;
}
declare class TabItem extends DependableComponent {
    isTrue(val: any): boolean;
    get value(): any;
    set value(val: any);
    connected(): void;
    set selected(val: boolean);
    get selected(): boolean;
    render(): import("./tonic.js").TonicTemplate;
}
export { InputFilter, AutocompleteFilter, findTasks, DaterangeFilter, NavTabs, TabItem };
