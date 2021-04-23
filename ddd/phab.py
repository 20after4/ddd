
from builtins import str
from collections import UserDict, UserString, deque
from collections.abc import Iterable

import json
import os

# todo: remove dependency on requests
import requests

from ddd.data import DataIterator, Data
from ddd.phobjects import *

class Conduit(object):
    phab_url = 'https://phabricator.wikimedia.org/api/'

    def __init__(self, phab_url: str = None):
        if phab_url:
            self.phab_url = phab_url

        self.conduit_token = self._get_token()
        if self.conduit_token is None:
            err = "Unable to find a conduit token in ~/.arcrc or environment"
            raise ConduitException(self, None, err)

    def _get_token(self):
        """
        Use the $CONDUIT_TOKEN envvar, fallback to whatever is in ~/.arcrc
        """
        token = None
        token_path = os.path.expanduser('~/.arcrc')
        if os.path.exists(token_path):
            with open(token_path) as f:
                arcrc = json.load(f)
                if (self.phab_url in arcrc['hosts']):
                    token = arcrc['hosts'][self.phab_url]['token']

        return os.environ.get('CONDUIT_TOKEN', token)

    def request(self, method: str, args: dict, raw: bool = False):
        """
        Helper method to call a phabricator api and return a ConduitResult
        which can be used to iterate over all of the resulting records.
        """
        data = flatten_for_post(args)
        data['api.token'] = self.conduit_token
        r = requests.post(f"{self.phab_url}{method}", data=data)
        if raw:
            return r
        return ConduitResult(conduit=self, res=r, method=method, args=args)

    def edit(self, method: str,  objectidentifier: str, transactions: list):
        """
        Calls a conduit "edit" method which applies a list of transactions
        to a specified object (specified by a phabricator identifier such as
        T123, #project or a PHID of the appropriate type)

        Raises an exception if something goes wrong and returns the decoded
        conduit response otherwise.
        """
        data = {
            "parameters": {
                "transactions": transactions,
                "objectidentifier": objectidentifier
            }
        }
        data = flatten_for_post(args)
        data['api.token'] = self.conduit_token
        r = requests.post(f"{self.phab_url}{method}", data=data)
        json = r.json()
        if json['error_info'] is not None:
            raise ConduitException(self.conduit, self, json['error_info'])
        return json


class ConduitResult(object):
    """
    ConduitResult handles fetching multiple pages of records from the conduit
    api so that the results can be treated as a single collection of records.
    """
    conduit = None
    result = None
    method = None
    args = None
    data = None
    cursor = None

    def __init__(self, conduit: Conduit, res: requests.Response,
                 method: str, args: dict):
        self.conduit = conduit
        self.method = method
        self.args = args
        self.cursor = {}
        self.handle_result(res)

    def retry(self):
        pass

    def next_page(self):
        """
        Load the next page of results from conduit, using the cursor that was
        returned by the most recently fetched page to specify the starting
        point. This is specified by an "after" argument added to the request.
        """
        after = self.cursor.get('after', None)
        if after is None:
            raise ConduitException(self.conduit, self,
                                   'Cannot fetch pages beyond the last.')
        args = self.args
        args['after'] = after
        res = self.conduit.request(method=self.method, args=args, raw=True)
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
        if json['error_info'] is not None:
            raise ConduitException(self.conduit, self, json['error_info'])

        self.result = json['result']

        if "cursor" in self.result:
            self.cursor = self.result['cursor']
        else:
            self.cursor = {}

        if "data" in self.result:
            # Modern conduit methods return a result[data] and result{cursor}
            if self.data is None:
                self.data = deque()
            self.data.extend(self.result['data'])
        elif self.data is None:
            # Older methods just return a result:
            self.data = self.result

    def has_more(self):
        return self.cursor.get('after', None)

    def resolve_phids(self, data=False):
        if data is False:
            data = self.data

        if isinstance(data, dict):
            iter = data.items()
        elif isinstance(data, (Iterable, list)) :
            iter = enumerate(data)
        else:
            return

        for key, val in iter:
            if isPHID(val):
                data[key] = PHObject.instance(val)
            elif isinstance(val, (list, dict)):
                self.resolve_phids(data=val)

        if data is self.data:
            phids = [phid for phid in PHObject.instances.keys()]
            args = {'phids': phids}
            res = self.conduit.request(method='phid.query', args=args, raw=True)
            objs = res.json()
            for key, vals in objs['result'].items():
                PHObject.instances[key].update(vals)

                # for attr in vals.keys():
                #     setattr(PHObject.instances[key], attr, vals[attr])
            return res

    def __iter__(self):
        return DataIterator(self.data)

    def __getitem__(self, item):
        return Data(self.data[item])

    def __len__(self):
        return len(self.data)

    def __contains__(self, item):
        return item in self.data



class ConduitException(Exception):
    def __init__(self, conduit: Conduit, result: ConduitResult, message: str):
        self.conduit = conduit
        self.result = result
        self.message = message

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

    if isinstance(h, str) or isinstance(h, bool):
        result[kk] = h
    elif isinstance(h, list) or isinstance(h, tuple):
        for i, v1 in enumerate(h):
            flatten_for_post(v1, result, '%s[%d]' % (kk, i))
    elif isinstance(h, dict):
        for (k, v) in h.items():
            key = k if kk is None else "%s[%s]" % (kk, k)
            if isinstance(v, dict):
                for i, v1 in v.items():
                    flatten_for_post(v1, result, '%s[%s]' % (key, i))
            else:
                flatten_for_post(v, result, key)
    return result
