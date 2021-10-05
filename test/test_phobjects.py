from cgi import test
import json
from pathlib import Path
from pprint import pprint
from re import A
from typing import Callable, Mapping, Sequence
import requests
from sqlite_utils.db import Database
import pytest
from ddd.phab import Conduit, ConduitCursor
from ddd.phobjects import PHID, PHIDRef, PHObject, PHObjectEncoder, User, init_caches


@pytest.fixture(scope="session")
def ctx():
    class TestContext:
        meta: Mapping

        def __init__(self):
            conduit = Conduit(phab_url='https://mock/api/', token='cli-mock')
            self.meta = {"db": Database(memory=True), "conduit": conduit}

    return TestContext()


@pytest.fixture(scope="session")
def phobject_instance():
    return PHObject.instance(PHID("PHID-TASK-00000000"))


def test_phobject(phobject_instance):
    assert isinstance(phobject_instance, PHObject)
    assert isinstance(phobject_instance.phid, PHID)
    assert PHObject.instance(PHID("PHID-TASK-00000000")) is phobject_instance


def test_conduit_cursor(ctx):
    db = ctx.meta["db"]
    PHObject.db = db

    class MockResponse(requests.Response):
        def __init__(self, mockfile):

            self.mockfile = mockfile

        def json(self, object_hook: Callable = None):
            with open(self.mockfile) as f:
                p = json.load(f, object_hook=object_hook)  # type: dict
                return p

    response = MockResponse(Path(__file__).parent / "phabricator_transactions.json")
    c = ctx.meta["conduit"]
    cursor = ConduitCursor(c, response, "maniphest.project.task.transactions", {})
    # test verifies that the mock data is handled properly by ConduitCursor and appropriate
    # some key objects are instantiated.
    for key, val in cursor.result.items():
        assert isinstance(val, Sequence)
        for item in val:
            assert isinstance(item, Mapping)
            assert "dateCreated" in item
            # test that the phidref instance is automatically created
            phidref = item["authorPHID"]  # type: ignore
            assert isinstance(phidref, PHIDRef)

    # with db.conn:
    #     for project in cursor.result["data"]:
    #         # pprint(project.data)
    #         # print(repr(project))
    #         project.save()
    #         # while 'parent' in project and project.parent:
    #         #    project=project.parent
    #         #    project.save()
    # db.conn.commit()
