import os
import threading
from pathlib import Path

import duckdb

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE / "DataA2-1" / "DataA2"))

con = duckdb.connect()

# The CSVs are parsed once into in-memory tables, then reloaded only when a file changes on disk.
# (Querying the CSV files directly re-parsed them on every request: about 50 ms per table scan.)
_mtimes: dict[str, int] = {}
_version = 0  # goes up whenever any table was reloaded; used to invalidate cached results
_lock = threading.Lock()


def refresh() -> int:
    """Reload any CSV that is new or changed since the last call. When nothing changed this is one
    stat() per file, so it is cheap enough to run before every request. Returns the data version."""
    global _version
    with _lock:
        changed = False
        for file in sorted(DATA_DIR.glob("*.csv")):
            mtime = file.stat().st_mtime_ns
            if _mtimes.get(file.stem) == mtime:
                continue
            con.execute(
                f'CREATE OR REPLACE TABLE "{file.stem}" AS SELECT * FROM read_csv_auto(?, nullstr=[\'\', \'N/A\'])',
                [str(file)],
            )
            _mtimes[file.stem] = mtime
            changed = True
        if changed:
            _version += 1
        return _version


def version() -> int:
    return _version


refresh()
