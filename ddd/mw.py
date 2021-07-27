import re
from typing import NewType, Optional

from semver import VersionInfo


class MWVersion(VersionInfo):
    def __init__(self, *args, **kwds):
        if len(args) == 1:
            version = args[0]
        elif "version" in kwds:
            version = kwds["version"]
        else:
            return super().__init__(*args, **kwds)
        print(*args, **kwds)
        info = self.parse(version).to_dict()
        super().__init__(**info)

    def next_version(self, part="minor"):
        return super().next_version(part, "wmf")


"""
ddd.mw defines some types related to MediaWiki versions and deployment schedule.
"""
past_versions = {
    "1.36.0": "2021-04-04",
    "1.35.0": "2020-07-14",
    "1.34.0": "2019-10-15",
    "1.33.0": "2019-04-10",
    "1.32.0": "2018-10-16",
    "1.31.0": "2018-04-17",
    "1.30.0": "2017-09-19",
    "1.29.0": "2017-04-26",
    "1.28.0": "2016-10-25",
    "1.27.0": "2016-05-31",
    "1.26.0": "2015-09-29",
    "1.25.0": "2015-04-07",
    "1.24.0": "2014-09-19",
    "1.23.0": "2014-04-14",
    "1.22.0": "2013-10-24",
    "1.21.0": "2013-03-18",
    "1.20.0": "2012-09-16",
    "1.19.0": "2012-02-09",
    "1.18.0": "2011-07-18",
    "1.17.0": "2010-12-07",
    "1.16.0": "2010-02-22",
    "1.15.0": "2009-03-25",
    "1.14.0": "2009-01-07",
    "1.13.0": "2008-07-23",
    "1.12.0": "2008-02-18",
    "1.11.0": "2007-09-05",
    "1.10.0": "2007-04-30",
    "1.9.0": "2007-01-08",
    "1.8.0": "2006-10-10",
    "1.7.0": "2006-07-06",
    "1.6.0": "2006-04-05",
    "1.5.0": "2005-07-31",
    "1.4.0": "2004-12-01",
    "1.3.0": "2004-05-22",
    "1.2.0": "2004-02-28",
    "1.1.0": "2003-12-08",
    "pre-1.1.0": "2003-04-14",
}


def version(ver: str, raiseException=False) -> Optional[MWVersion]:
    """
    Validate our version number format.
    Optionally raise exception on invalid version strings.
    """
    try:
        return MWVersion(re.match("(\\d+\\.\\d+(\\.\\d+-)?wmf\\.?\\d+)", ver).group(0))
    except Exception:
        if raiseException:
            raise
        return None
    return None
