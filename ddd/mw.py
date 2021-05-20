import re

def version(ver):

    """Validate our version number formats"""
    try:
        return re.match("(\\d+\\.\\d+(\\.\\d+-)?wmf\\.?\\d+)", ver).group(0)
    except Exception:
        return None
    return None
