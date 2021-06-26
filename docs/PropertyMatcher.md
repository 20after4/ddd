================
PropertyMatcher
================

Use an instance of PropertyMatcher as a decorator to register callback functions
that match specified patterns within a tree of json data.  The patterns are
specified as string arguments to the decorator declaration.

To match a specific key=value combination, simply specify the key name followed
by the value, separated by an equal sign and no whitespace or other characters.
To match a property nested within a sub-object, specify the path to the object
separated by dots, then a colon, then a key=value combination for the property
you want to match.

So in the example below, we match when both the top-level transactionType attribute
has the specific value "core:edge" and the object contains a child object named meta which contains a child called edge which has an attribute named type with a
value of 41

Usage example:

```python
def process_transactions(transactions):
    mapper = PropertyMatcher()

    @mapper("transactionType=core:edge", "meta.edge:type=41")
    def edge(t):
        ''' match project edge transactions '''
        oldValue = [PHIDRef(p) for p in t["oldValue"]]
        newValue = [PHIDRef(p) for p in t["newValue"]]
        return [["projects", '', oldValue, newValue]]

    for taskid, t in transactions.result.items():
        st = sorted(t, key=itemgetter("dateCreated"))
        for record in st:
            for row in mapper.run(record):
                if row:
                    yield row

# fetch a bunch of data from somewhere:
transactions = get_some_transactions()

for match in process_transactions(transactions):
    # do something with the match:
    process(match)

```