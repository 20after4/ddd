import Tonic from '@optoolco/tonic';
function waitForID(id, context = null) {
    return new Promise(resolve => {
        var ele = document.getElementById(id);
        if (ele) {
            return resolve(ele);
        }
        const observer = new MutationObserver(mutations => {
            const ele = document.getElementById(id);
            if (ele) {
                resolve(ele);
                observer.disconnect();
            }
        });
        observer.observe(context || window.document, {
            childList: true,
            subtree: true
        });
    });
}
class DependableComponent extends Tonic {
    constructor() {
        super();
        this.hasResolved = false;
        if (!this.state.values) {
            this.state.values = {};
        }
    }
    async waitfor(id) {
        const myid = this.id;
        var promise;
        var waiter;
        if (id in DependableComponent._waitingFor) {
            waiter = DependableComponent._waitingFor[id];
            promise = waiter.promise;
        }
        else {
            waiter = { promise: promise, resolver: function () { } };
            promise = new Promise(function (resolve) {
                waiter.resolver = resolve;
            });
            waiter.promise = promise;
            DependableComponent._waitingFor[id] = waiter;
        }
        const self = this;
        promise.then(function (component) {
            self.resolved();
            return component;
        });
        return promise;
    }
    connected() {
        this.resolved();
    }
    resolved() {
        this.hasResolved = true;
    }
}
DependableComponent._waitingFor = {};
export { DependableComponent, waitForID };
//# sourceMappingURL=dom.js.map