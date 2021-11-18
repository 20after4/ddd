export class TonicInput {
    static stylesheet(): string;
    _modified: boolean;
    defaults(): {
        type: string;
        placeholder: string;
        color: string;
        spellcheck: boolean;
        ariaInvalid: boolean;
        invalid: boolean;
        radius: string;
        disabled: boolean;
        position: string;
    };
    get form(): any;
    set value(arg: any);
    get value(): any;
    setValid(): void;
    setInvalid(msg: any): void;
    renderLabel(): any;
    renderIcon(): any;
    setFocus(pos: any): void;
    setupEvents(): void;
    updated(): void;
    reRender(...args: any[]): Promise<any>;
    connected(): void;
    styles(): {
        wrapper: {
            width: any;
        };
        input: {
            width: string;
            height: any;
            borderRadius: any;
            padding: any;
        };
    };
    render(): any;
}
