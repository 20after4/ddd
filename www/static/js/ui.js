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
            ${this.elements}
          </div>
        </div>
      </div>
    </div>
    `;
    }
    connected() {
        this.state.modal = new Modal(this);
    }
}
Tonic.add(ModalDialog);
export { ModalDialog };
//# sourceMappingURL=ui.js.map