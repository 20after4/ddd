

class FakeConsole:
    """this is used if rich is not installed. This makes rich an optional dependency
     and keeps debugging code and console logging from breaking the world.
    """
    def log(self, *output):
        print(*output)

    def print_exception(self, e=None):
        print(e)

    def status(self, *msg):
        print(*msg)
        return self

    def update(self, *msg):
        print(*msg)
        return self

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False

try:
    from rich.console import Console
    console = Console(stderr=True)
except:
    console = FakeConsole()
