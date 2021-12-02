# Data³

Data³ is a toolkit and general framework for visualizing just about any data. Wikimedia's engineering productivity team have begun assembling a toolkit to help us organize, analyze and visualize data collected from our development, deployment, testing and project planning processes. There is a need for better tooling and data collection in order to have reliable and accessible data to inform data-driven decision-making. This is important because we need to measure the impact of changes to our deployment processes and team practices so that we can know whether a change to our process is beneficial and quantify the impacts of the changes we make.

The first applications for the Data³ tools are focused on exploring software development and deployment data, as well as workflow metrics exported from Wikimedia's phabricator instance.

The core of the toolkit consists of the following:

* Datasette.io provides a front-end for browsing and querying one or more SQLite databases.
* A simple dashboard web app that uses the datasette json api to query sqlite and renders the resulting data as charts (rendered with vega-lite) or html templates for custom reports or interactive displays.
* A comprehensive python library and command line interface for querying and processing Phabricator task data exported via conduit api requests.
* Several custom dashboards for datasette which provide visualization of metrics related to Phabricator tasks and workflows.
* A custom dashboard to explore data and statistics about production MediaWiki deployments.

## Demo / Development Instance

There is a development & testing instance of Datasette and the Data³ Dashboard at [https://data.releng.team/dev/](https://data.releng.team/dev/)

## Status

This tool and supporting libraries are currently experimental. The dashboard and initial data model have reached the stage of [MVP](https://en.wikipedia.org/wiki/Minimum_viable_product). The future development direction is currently uncertain but this is a solid foundation to build on.

 This project has a wiki page on MediaWiki.org: [Data³/Metrics-Dashboard](https://www.mediawiki.org/wiki/Data%C2%B3/Metrics-Dashboard )

## Currently supported data sources:

 * Phabricator's conduit API.

## Future Possibilities:

 * Elastic ELK
 * Wikimedia SAL
 * GitLab APIs

# Usage

## Installation

setup.py will install a command line tool called `dddcli`

To install for development use:

```bash
python3 setup.py develop
```

### dddcli

You can use the following sub-commands by running `dddcli sub-command [args]` to access various functionality.

### Phabricator metrics:  `dddcli metrics`

* This tool is used to extract data from phabricator and organize it in a structure that will facilitate further analysis.
* The analysis of task activities can provide some insight into workflows.
* The output if this tool will be used as the data source for charts to visualize certain agile project planning metrics.

#### cache-columns
The first thing to do is cache the columns for the project you're interested in.
This will speed up future actions because it avoids a lot of unnecessary requests
to Phabricator that would otherwise be required to resolve the names of projects
and workboard columns.

```bash
dddcli metrics cache-columns --project=PHID-PROJ-uier7rukzszoewbhj7ja
```

Then you can fetch the actual metrics and map them into local sqlite tables with the map sub-command:


```bash
dddcli metrics map --project=#release-engineering-team
```

Note that `--project` accepts either a `PHID` or a project `#hashtag`

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

### Datasette

The main user interface for the Data³ tool is provided by Datasette.

Datasette is installed as a dependency of this repo by running `poetry install` from the repository root.

Once dependencies are installed, you can run datasette from the ddd checkout like this:

```bash
export DATASETTE_PORT=8001
export DATASETTE_HOST=localhost # or use 0.0.0.0 to listen on a public interface
export DATASETTE_DIR=./www  #this should point to the www directory included in this repo.
datasette --reload --metadata www/metadata.yaml -h #DATASETTE_HOST -p $DATASETTE_PORT  $DATASETTE_DIR
```

For deployment on a server, there are sample systemd units in `etc/systemd/*` including a file watcher to
restart datasette when the data changes. Approximately the same behavior is achieved by the --reload argument to the
datasette command given here and that is adequate for development and testing locally.

### Datasette Plugins

Datasette has been extended with some plugins to add custom functionality.

* See `www/plugins` for Data³ customizations.
* There is also a customized version of datasette-dashboards which is included via a submodule at
`src/datacube-dashboards`.  Do the usual `git submodule update --init` to get that source code.
* There are custom views and routes added in ddd_datasette.py that map urls like /-/ddd/$page/  to files in `www/templates/view/`.

# Example code:

## Conduit API client:

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
```

This fetches every page of results, note the API limits a single request to
fetching **at most** 100 objects, however, fetch_all will request each page from the server until all available records have been retrieved:

```python
r.fetch_all()
```


## PHIDRef

Whenever encountering a phabricator `phid`, we use PHIDRef objects to wrap the phid. This provides several conveniences for working with phabricator objects efficiently.  This interactive python session demonstrates how it works:

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

1. You can construct a bunch of `PHIDRef` instances and then later on you can fetch all of the data in a single call to phabricator's conduit api. This is accomplished by calling `PHObject.resolve_phids()`.
2. `resolve_phids()` can store a local cache of the phid details in the phobjects table. After calling resolve_phids completes, all `PHObject` instances will contain the `name`, `url` and `status` of the corresponding phabricator objects.
3. An instance of PHIDRef can be used transparently as a database key.
4. `str(PHIDRef_instance)` returns the original `"PHID-TYPE-hash"` string.
5. `PHIDRef_instance.object` returns an instantiated `PHObject` instance.

