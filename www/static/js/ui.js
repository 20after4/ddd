import { DependableComponent } from "./dom.js";
import Tonic from '@operatortc/tonic';
import { Modal } from 'bootstrap';
class ModalDialog extends DependableComponent {
    render() {
        return this.html `
    <div id='modal-${this.id}' class="modal fade" aria-hidden="true" aria-labelledby="modal-${this.id}-title" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="modal-${this.id}-title">${this.props.title}</h5>
          </div>
          <div class="modal-body">
            ${this.renderBody()}
            ${this.elements}
          </div>
        </div>
      </div>
    </div>
    `;
    }
    get body() {
        return this.ele('.modal-body');
    }
    set title(title) {
        this.props.title = title;
        document.getElementById(`modal-${this.id}-title`).innerText = title;
    }
    renderBody() {
        return [];
    }
    connected() {
        this.state.modal = new Modal(this.querySelector('.modal'));
    }
    show() {
        this.state.modal.show();
    }
    hide() {
        this.state.modal.hide();
    }
}
Tonic.add(ModalDialog);
class TaskDialog extends ModalDialog {
    constructor() {
        super();
        this.props.title = 'Counted Tasks';
        this.state.tasks = [];
        console.log('loaded taskdialog', this);
    }
    renderBody() {
        const tasks = this.state.tasks.map((task) => {
            return new PhabTask(this.state.data.lookup('id', task));
        });
        console.log(tasks);
        return tasks;
    }
    showTasks(tasks) {
        this.state.tasks = tasks;
        const body = this.body;
        body.innerHTML = '';
        for (const task of tasks) { //this.renderBody()) {
            if (task) {
                body.appendChild(task);
            }
        }
        this.show();
    }
}
class PhabTask extends DependableComponent {
    static stylesheet() {
        return `
      phab-task {
        display:inline-block;
        padding: 4px;
      }
    `;
    }
    constructor(id) {
        super();
        if (typeof (id) == 'string') {
            this.id = id;
        }
        else if (id['id']) {
            this.id = id['id'];
            this.state.data = id;
        }
        else {
            console.log('invalid id', id);
            throw new Error('Invalid id: ' + id);
        }
    }
    render() {
        return this.html `<a title='Phabricator Task T${this.id}' href='https://phabricator.wikimedia.org/T${this.id}'>T${this.id}</a> ${this.state.data['name']}`;
    }
}
Tonic.add(PhabTask);
Tonic.add(TaskDialog);
export { ModalDialog, TaskDialog, PhabTask };
//# sourceMappingURL=ui.js.map