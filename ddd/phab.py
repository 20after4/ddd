from __future__ import annotations

import json
import os
from builtins import str
from collections import UserDict, UserList, deque
from collections.abc import Iterable
from pprint import pprint
from tokenize import Number
from typing import Collection, MutableMapping, MutableSequence, Union

# todo: remove dependency on requests
import requests
from numpy import real

from ddd.data import Data, DataIterator, wrapitem
from ddd.phobjects import PHObject, isPHID


class Conduit(object):
    phab_url: str = "https://phabricator.wikimedia.org/api/"
    token: str = ""

    def __init__(self, phab_url: str = None, token: str = None):
        if phab_url:
            self.phab_url = phab_url

        if token:
            self.token = token
        else:
            self.token = self._get_token()

        if self.token is None:
            err = "Unable to find a conduit token in ~/.arcrc or environment"
            raise ConduitException(conduit=self, message=err)

    def _get_token(self):
        """
        Use the $CONDUIT_TOKEN envvar, fallback to whatever is in ~/.arcrc
        """
        token = None
        token_path = os.path.expanduser("~/.arcrc")
        if os.path.exists(token_path):
            with open(token_path) as f:
                arcrc = json.load(f)
                if self.phab_url in arcrc["hosts"]:
                    token = arcrc["hosts"][self.phab_url]["token"]

        return os.environ.get("CONDUIT_TOKEN", token)

    def raw_request(self, method: str, args: MutableMapping):
        """
        Helper method to call a phabricator api and return a ConduitCursor
        which can be used to iterate over all of the resulting records.
        """
        req = flatten_for_post(args)
        req["api.token"] = self.token
        r = requests.post(f"{self.phab_url}{method}", data=req)
        return r

    def request(self, method: str, args: MutableMapping):
        r = self.raw_request(method=method, args=args)
        return ConduitCursor(conduit=self, res=r, method=method, args=args)

    def edit(self, method: str, objectidentifier: str, transactions: list):
        """
        Calls a conduit "edit" method which applies a list of transactions
        to a specified object (specified by a phabricator identifier such as
        T123, #project or a PHID of the appropriate type)

        Raises an exception if something goes wrong and returns the decoded
        conduit response otherwise.
        """
        req = {
            "parameters": {
                "transactions": transactions,
                "objectidentifier": objectidentifier,
            }
        }
        req = flatten_for_post(req)
        req["api.token"] = self.token
        r = requests.post(f"{self.phab_url}{method}", data=req)
        json = r.json()
        if json["error_info"] is not None:
            raise ConduitException(conduit=self, message=json["error_info"])
        return json


class ConduitCursor(object):
    """
    ConduitCursor handles fetching multiple pages of records from the conduit
    api so that one api call can be treated as a single collection of results even
    though it's split across multiple requests to the server.
    """

    conduit: Conduit
    result: MutableMapping
    method: str
    args: MutableMapping
    data: deque[Data]
    cursor: MutableMapping

    def __init__(
        self,
        conduit: Conduit,
        res: requests.Response,
        method: str,
        args: MutableMapping,
    ):
        self.conduit = conduit
        self.method = method
        self.args = args
        self.cursor = {}
        self.data = deque()
        self.handle_result(res)

    def retry(self):
        pass

    def next_page(self):
        """
        Load the next page of results from conduit, using the cursor that was
        returned by the most recently fetched page to specify the starting
        point. This is specified by an "after" argument added to the request.
        """
        after = self.cursor.get("after", None)
        if after is None:
            raise ConduitException(
                conduit=self.conduit, message="Cannot fetch pages beyond the last."
            )
        args = self.args
        args["after"] = after
        res = self.conduit.raw_request(method=self.method, args=args)
        self.handle_result(res)

    def fetch_all(self):
        while self.has_more():
            self.next_page()

    def handle_result(self, res):
        """
        Process the result from a conduit call and store the records, along
        with a cursor for fetching further pages when the result exceeds the
        limit for a single request. The default and maximum limit is 100.
        """
        json = res.json()
        if json["error_info"] is not None:
            raise ConduitException(conduit=self.conduit, message=json["error_info"])

        self.result = json["result"]

        if "cursor" in self.result:
            self.cursor = self.result["cursor"]
        else:
            self.cursor = {}
        # pprint(self.result)
        if "data" in self.result:
            # Modern conduit methods return a result map with the key "data"
            # mapped to a list of records and the key "cursor" maps to a record
            # of pagination details.
            self.data.extend(self.result["data"])
        else:
            # Older methods just return a result:
            self.data.extend(self.result.values())

    def has_more(self):
        return self.cursor.get("after", None)

    def resolve_phids(self, data=None):
        if data is None:
            data = self.data

        if isinstance(data, MutableMapping):
            iter = data.items()
        elif isinstance(data, (Iterable, MutableSequence)):
            iter = enumerate(data)
        else:
            return

        for key, val in iter:
            if key != "phid" and isPHID(val):
                data[key] = PHObject.instance(val)
            elif isinstance(val, (MutableSequence, MutableMapping)):
                self.resolve_phids(data=val)

        if data is self.data and len(PHObject.instances):
            PHObject.resolve_phids(self.conduit)

    def __iter__(self):
        return DataIterator(self.data)

    def __getitem__(self, key):
        if key not in self.data:
            raise KeyError(key)
        return wrapitem(self.data[key])

    def __len__(self):
        return len(self.data)

    def __contains__(self, item):
        return item in self.data


class ConduitException(Exception):
    def __init__(
        self, message: str, conduit: Conduit = None, result: ConduitCursor = None
    ):
        self.conduit = conduit
        self.result = result
        self.message = message

    def __repr__(self):
        return "ConduitException(message='%s')" % self.message

    def __str__(self):
        return "ConduitException: " + self.message

def flatten_for_post(h, result=None, kk=None):
    """
    Since phab expects x-url-encoded form post data (meaning each
    individual list element is named). AND because, evidently, requests
    can't do this for me, I found a solution via stackoverflow.

    See also:
    <https://secure.phabricator.com/T12447>
    <https://stackoverflow.com/questions/26266664/requests-form-urlencoded-data/36411923>
    """
    if result is None:
        result = {}

    if isinstance(h, (str, bool)):
        result[kk] = h
    elif isinstance(h, (int, float)):
        # Because conduit response comes back empty when you pass raw int
        # values:
        result[kk] = str(h)
    elif hasattr(h, "items"):
        for (k, v) in h.items():
            key = k if kk is None else "%s[%s]" % (kk, k)
            if hasattr(v, "items"):
                for i, v1 in v.items():
                    flatten_for_post(v1, result, "%s[%s]" % (key, i))
            else:
                flatten_for_post(v, result, key)
    elif isinstance(h, Iterable):
        for i, v1 in enumerate(h):
            flatten_for_post(v1, result, "%s[%d]" % (kk, i))
    return result
