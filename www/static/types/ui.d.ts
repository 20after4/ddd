import { DependableComponent } from "./dom.js";
declare class ModalDialog extends DependableComponent {
    render(): any;
    get body(): HTMLElement;
    set title(title: any);
    renderBody(): any[];
    connected(): void;
    show(): void;
    hide(): void;
}
declare class TaskDialog extends ModalDialog {
    constructor();
    renderBody(): any;
    showTasks(tasks: any): void;
}
declare class PhabTask extends DependableComponent {
    static stylesheet(): string;
    constructor(id: any);
    render(): any;
}
export { ModalDialog, TaskDialog, PhabTask };
//# sourceMappingURL=ui.d.ts.map