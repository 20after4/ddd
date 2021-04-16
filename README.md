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

The most useful bits of code that can be found in this repo are demonstrated
with the following code examples:

# Example:

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
