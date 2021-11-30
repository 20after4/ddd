import { DependableComponent } from "./dom.js";
declare class ModalDialog extends DependableComponent {
    render(): any;
    renderBody(): any[];
    connected(): void;
    show(): void;
    hide(): void;
}
declare class TaskDialog extends ModalDialog {
    constructor();
    renderBody(): any[];
    showTasks(tasks: any): void;
}
export { ModalDialog, TaskDialog };
//# sourceMappingURL=ui.d.ts.map