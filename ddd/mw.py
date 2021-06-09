import re
from typing import NewType, Optional
MWVersion = NewType('MWVersion', str)

def version(ver:str) -> Optional[MWVersion]:

    """Validate our version number formats"""
    try:
        return MWVersion(re.match("(\\d+\\.\\d+(\\.\\d+-)?wmf\\.?\\d+)", ver).group(0))
    except Exception:
        return None
    return None
