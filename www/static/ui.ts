import {DependableComponent} from "./dom.js";
import Tonic from '@operatortc/tonic';
import { Modal } from 'bootstrap';

class ModalDialog extends DependableComponent {
  render() {
    return this.html`
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
    const output = [];
    for (const task of this.state.tasks) {
      output.push(this.html`
        <phab-task id='${task}'>${task}</phab-task>
      `);
    }
    return output;
  }

  showTasks(tasks) {
    this.state.tasks = tasks;
    this.querySelector('.modal-body').innerHTML = this.renderBody().join('');
    this.show();
  }
}

class PhabTask extends Tonic {
  render() {
    return this.html`<a href='https://phabricator.wikimedia.org/T${this.id}'>T${this.id}</a>`
  }
}

Tonic.add(PhabTask);

Tonic.add(TaskDialog);
export {ModalDialog, TaskDialog}