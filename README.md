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

## cli

setup.py will install a command line tool called `dddcli`

To install for development use:

```bash
python3 setup.py develop
```


You can use the following sub-commands with `dddcli command [args]` to access various functionality.

### phabricator metrics

This tool is used to extract data from phabricator and organize it in a structure that will facilitate further analysis.
The analysis of task activities can provide some insight into workflows.
The output if this tool will be used as the data source for charts to visualize certain agile project planning metrics.

Example usage (this is rough and can be simplified with a bit more refinement.)

The first thing to do is cache the columns for the project you're interested in.
This will speed up future actions because it avoids a lot of unnecessary requests
to Phabricator that would otherwise be required to resolve the names of projects
and workboard columns.

```bash
dddcli metrics cache-columns --project=PHID-PROJ-uier7rukzszoewbhj7ja
```

Then you can fetch the actual metrics and map them into local sqlite tables:


```bash
dddcli metrics map --project=PHID-PROJ-uier7rukzszoewbhj7ja
```

To get cli usage help, try

```bash
dddcli metrics map --help
```

To run it with a test file instead of connecting to phabricator:

```bash
dddcli metrics map --mock=test/train.transactions.json
```

This runs the mapper with data from a file, treating that as a mock api call result (to speed up testing)

If you omit the --mock argument then it will request a rather large amount of data from the phabricator API which takes an extra 20+ seconds to fetch.

### datasette

To run datasette, from the ddd checkout:

```bash
dddcli serve ./www
```
Sample systemd units are in `etc/systemd/*` including a file watcher to restart datasette
when the data changes.

# Example code:

## PHIDRef

Whenever encountering a phabricator `phid`, we use PHIDRef objects to wrap the phid. This provides several conveniences
for working with phabricator objects efficiently.  This interactive python session demonstrates how it works:

```python
In [1]: phid = PHIDRef('PHID-PROJ-uier7rukzszoewbhj7ja')
# PHIDRef has a placeholder for the Project instance:
IN [2]: phid.object
Out[2]: Project(name="", phid="PHID-PROJ-uier7rukzszoewbhj7ja")

# Once we call resolve_phids, then the data is filled in from cache or from a conduit request if it's not cached:
In [3]: PHObject.resolve_phids(phab, DataCache(db))
Out[3]: {'PHID-PROJ-uier7rukzszoewbhj7ja': Project(name="Releas...ewbhj7ja")}

# now phid and phid.object are useful:
In [4]: phid.object
Out[4]: Project(name="Release-Engineering-Team", phid="PHID-PROJ-uier7rukzszoewbhj7ja")

In [5]: phid
Out[5]: PHIDRef('PHID-PROJ-uier7rukzszoewbhj7ja', object='Release-Engineering-Team')

In [6]: str(phid.object)
Out[6]: Release-Engineering-Team

In [7]: str(phid)
Out[7]: PHID-PROJ-uier7rukzszoewbhj7ja

```

1. You can construct a bunch of PHIDRef instances and then later on you can fetch all of
   the data in a single call to `resolve_phids()`.
2. resolve_phids can store a local cache of the phid details in the phobjects table.
3. a PHIDRef can be used transparently as a database key.
 * `str(PHIDRef_instance)` returns the original `"PHID-TYPE-hash"` string.
 * `PHIDRef_instance.object` returns an instantiated `PHObject` instance.
 * After calling `resolve_phids()`, all `PHObject` instances will contain the `name`,
   `url` and `status` of the corresponding phabricator objects.


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
