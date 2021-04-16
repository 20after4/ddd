import requests
import sys
import json
from pprint import pprint

from ddd.phab import Conduit

phab = Conduit()



r = phab.request('maniphest.search', {'queryKey': "KpRagEN3fCBC",
                "limit": "40",
                "attachments": {
                    "projects": True,
                    "columns": True
                }})

r.fetch_all()

ids = [f"T{obj.id}" for obj in r]
print(ids)

ids = []
url = 'https://gerrit.wikimedia.org/r/changes/'
for tid in ids:
    query = {'q': f"bug:{tid}"}

    res = requests.get(url, params=query)
    jsontxt = res.text[4:]
    objs = json.loads(jsontxt)
    for obj in objs:
        print(f"{tid},{obj['change_id']},-{obj['deletions']},+{obj['insertions']}")


if __name__ == "__main__":
    pass
