import Tonic from '../_snowpack/pkg/@optoolco/tonic.js';
class DashboardApp extends Tonic {
    render() {
        return this.html`

    <div class="container-fluid p-0 dashboard-filters">
      <div class="row justify-content-between">
          <div class="dashboard-header">
            <div class="page-header" style="border-color: black">
              <h1>Data³</h1>
            </div>
          </div>

          <autocomplete-filter></autocomplete-filter>

          <input-filter id='task_id' label='Task'></input-filter>
          <input-filter id='column' label='Column'></input-filter>

          <daterange-filter id='date'>
          </daterange-filter>

          <div id="filter-group-buttons" class="col-sm-1 align-self-center align-items-center col-auto">
            <input type="submit" value="Update" class="button">
          </div>
      </div>
    </div>
    `;
    }
}
Tonic.add(DashboardApp);
export { DashboardApp };
export default DashboardApp;
