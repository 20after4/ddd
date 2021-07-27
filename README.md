# D³

`ddd` or `d³` is a toolkit for accessing APIs and processing data from disperate
 systems.

## Status

This tool an supporting libraries are in early stages of experimentation and
development. The APIs are not yet stable and the featureset is not yet decoded
let alone completely implemented. Stay tuned or get involved.

## Currently supported data sources:

 * Phabricator's conduit API.

## Coming soon:

 * Elastic ELK
 * Wikimedia SAL
 * Gerrit's rest API

# Usage

## boardmetrics.py

This tool is used to extract data from phabricator and organize it in a structure that will facilitate further analysis.
The analysis of task activities can provide some insight into workflows.
The output if this tool will be used as the data source for charts to visualize certain agile project planning metrics.

Example usage (this is rough and can be simplified with a bit more refinement.)

From the project directory:
```bash
./ddd/boardmetrics.py --project=PHID-PROJ-fmcvjrkfvvzz3gxavs3a --mock=test/train.transactions.json --dump=json > metrics.json
```

This calculates data for the given project PHID, using data from a mock api call result (to speed up testing) and dumps the output as json.

If you omit the --mock argument then it will request a rather large amount of data from the phabricator API which takes an extra 20+ seconds to fetch.


# Example code:

```python
from ddd.phab import Conduit

phab = Conduit()

# Call phabricator's meniphest.search api and retrieve all results
r = phab.request('maniphest.search', {'queryKey': "KpRagEN3fCBC",
                "limit": "40",
                "attachments": {
                    "projects": True,
                    "columns": True
                }})
# This fetches every page of results, note the API limits a single request to
# fetching at most 100 results (controlled by the limit argument)
# But fetch_all will request each page from the server until all available
# records have been retrieved.
r.fetch_all()
```
