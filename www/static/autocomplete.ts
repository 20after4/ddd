
import {Autocomplete} from './autocomplete.min.js';



function projectSearcher() {

  var projects = [];

  async function fetchProjectsJSON() {
    const response = await fetch("/metrics/project_tree.json?_shape=objects&_size=max&ttl=60");
    const fetched = await response.json();
    return fetched;
  }

  const elements = document.querySelectorAll('.autocomplete');
  if (elements && elements.length) {
    fetchProjectsJSON().then(fetched => {
      projects=fetched.rows;
    });
  }
  elements.forEach(el => {
    var hiddeninput = <HTMLInputElement> el.parentElement.querySelector('input[type=hidden]')

    var completer = new Autocomplete(el, {search:input => {
        if (input.length < 1) {
          return []
        }
        let text = input.toLowerCase();
        let words = text.split(/\W+/);

        function score(project) {
          var strings = [project.name.toLowerCase()];
          if (project.slug) {
            strings.push(project.slug)
          }
          var score = 0;
          for (let w of words) {
            var cnt = 0;
            for (let s of strings) {
              if (!s) {
                continue;
              }
              if (s.startsWith(text)){
                cnt+=2;
              }
              if (s.startsWith(w)) {
                cnt++;
              }
              if (s.includes(w)) {
                cnt++;
              }
            }
            if (cnt < 1) {
              score = 0;
              break;
            } else {
              score += cnt
            }
          }
          return score;
        }

        var result = projects.filter(score);
        if (result.length > 1) {
          result = result.sort(function(a,b){
            return score(b) - score(a);
          });
        }
        return result;
      },
      autoSelect: true,
      onSubmit: result => {
        if (result && result.phid) {
          result=result.phid;
        } else {
          result = '';
        }
        hiddeninput.value = result;
      },
      getResultValue: result => result.name,
      renderResult: (result, props) => `
          <li ${props}>
            <div>
              ${result.name}
            </div>
          </li>
        `,
        debounceTime: 500,
      });
    });
  }
export { projectSearcher }