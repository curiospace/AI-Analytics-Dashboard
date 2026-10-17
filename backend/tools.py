import json
import math
import threading
from pathlib import Path
from datetime import date, datetime
from decimal import Decimal

import duckdb
from anthropic.types import ToolParam

from db import DATA_DIR

MAX_ROWS = 1000  # rows kept per query result
PREVIEW_ROWS = 25  # rows shown to the model
MAX_CHART_ROWS = 200
TIMEOUT_SECONDS = 10
CHART_TYPES = ("line", "bar", "hbar", "donut")
CHART_FORMATS = ("number", "currency", "percent")


class ToolError(Exception):
    """A problem the model can read and fix (bad SQL, unknown column). Sent back as an is_error tool_result."""


def make_sandbox() -> duckdb.DuckDBPyConnection:
    sandbox_con = duckdb.connect()

    # First load all CSV files into internal DuckDB tables
    for file in Path(DATA_DIR).glob("*.csv"):
        table_name = file.stem

        # Escape double quotes in identifier
        safe_table_name = table_name.replace('"', '""')

        # same nullstr as db.py, so the column types match the dashboard's
        sandbox_con.execute(
            f"""
            CREATE OR REPLACE TABLE "{safe_table_name}" AS
            SELECT *
            FROM read_csv_auto(?, nullstr=['', 'N/A'])
            """,
            [str(file)]
        )

    # resource limits, set before the configuration is locked
    sandbox_con.execute("SET memory_limit = '512MB'")
    sandbox_con.execute("SET threads = 2")

    # CSV files are no longer needed because data is now
    # stored in DuckDB tables.
    sandbox_con.execute("SET enable_external_access = false")

    # Prevent later configuration changes
    sandbox_con.execute("SET lock_configuration = true")

    return sandbox_con


def _jsonable(value):
    # JSON cannot carry dates, decimals or NaN
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def run_sql(sandbox, sql: str, store: dict) -> str:
    # exactly one SELECT: no DROP/INSERT/COPY/ATTACH/SET, no second statement hidden after a ';'
    try:
        statements = sandbox.extract_statements(sql)
    except duckdb.Error as e:
        raise ToolError(f"SQL error: {e}") from e
    if len(statements) != 1 or statements[0].type != duckdb.StatementType.SELECT:
        raise ToolError("Only a single SELECT query is allowed.")

    # stop queries that run too long
    timer = threading.Timer(TIMEOUT_SECONDS, sandbox.interrupt)
    timer.start()
    try:
        result = sandbox.execute(sql)
        columns = [(desc[0], str(desc[1])) for desc in result.description]
        rows = result.fetchmany(MAX_ROWS + 1)
    except duckdb.Error as e:
        raise ToolError(f"SQL error: {e}") from e
    finally:
        timer.cancel()

    truncated = len(rows) > MAX_ROWS
    rows = [[_jsonable(v) for v in row] for row in rows[:MAX_ROWS]]

    # the full result stays on the server; the model gets an id and a short preview
    result_id = f"r{len(store) + 1}"
    store[result_id] = {"columns": [c[0] for c in columns], "rows": rows, "sql": sql}

    lines = [
        f"result_id: {result_id}",
        "columns: " + ", ".join(f"{name} ({kind})" for name, kind in columns),
        f"rows: {len(rows)}" + (f" (query was cut off at {MAX_ROWS} rows)" if truncated else ""),
    ]
    if len(rows) > PREVIEW_ROWS:
        lines.append(f"first {PREVIEW_ROWS} rows:")
    lines += [json.dumps(row) for row in rows[:PREVIEW_ROWS]]
    return "\n".join(lines)


def make_chart(store: dict, result_id: str, type: str, x: str, y: list[str], title: str, format: str | None = None) -> dict:
    # the chart data comes from the stored query result, never from the model
    result = store.get(result_id)
    if result is None:
        raise ToolError(f"Unknown result_id '{result_id}'. Call run_sql first and use the result_id it returns.")
    if type not in CHART_TYPES:
        raise ToolError(f"Unknown chart type '{type}'. Use one of: {', '.join(CHART_TYPES)}.")
    if format is not None and format not in CHART_FORMATS:
        raise ToolError(f"Unknown format '{format}'. Use one of: {', '.join(CHART_FORMATS)}.")
    if not y:
        raise ToolError("y must list at least one numeric column.")

    columns, rows = result["columns"], result["rows"]
    for column in [x, *y]:
        if column not in columns:
            raise ToolError(f"Column '{column}' is not in {result_id}. Available columns: {', '.join(columns)}.")
    if not rows:
        raise ToolError("The query returned no rows, so there is nothing to chart.")
    if len(rows) > MAX_CHART_ROWS:
        raise ToolError(f"{len(rows)} rows is too many to chart (max {MAX_CHART_ROWS}). Aggregate in SQL, for example by month, or use LIMIT.")

    x_index = columns.index(x)
    y_indexes = [columns.index(c) for c in y]
    for column, index in zip(y, y_indexes):
        if any(isinstance(r[index], bool) or not isinstance(r[index], (int, float)) for r in rows):
            raise ToolError(f"Column '{column}' is not numeric (or contains NULLs). Cast it or filter the NULLs in SQL.")
    if type == "donut" and (len(y) != 1 or len(rows) > 8):
        raise ToolError("A donut needs exactly one y column and at most 8 rows. Use a bar chart instead.")
    if format == "percent" and any(abs(r[i]) > 1.5 for r in rows for i in y_indexes):
        raise ToolError("format 'percent' expects fractions between 0 and 1 (0.86 for 86%). Divide in SQL or use format 'number'.")

    spec = {
        "type": type,
        "title": title[:80],
        "x": x,
        "y": list(y),
        "rows": [{x: r[x_index], **{c: r[i] for c, i in zip(y, y_indexes)}} for r in rows],
        "sql": result["sql"],
    }
    if format:
        spec["format"] = format
    return spec


# the tool definitions sent to Claude. The description text is part of the prompt.
TOOLS: list[ToolParam] = [
    {
        "name": "run_sql",
        "description": (
            "Run one read-only DuckDB SELECT query on the company data (the tables are described in the system prompt). "
            "Returns a result_id, the column names and types, and the first rows. "
            "Use it for every number you state. Aggregate in SQL instead of returning many raw rows."
        ),
        "eager_input_streaming": True,
        "input_schema": {
            "type": "object",
            "properties": {"sql": {"type": "string", "description": "A single SELECT (or WITH ... SELECT) statement."}},
            "required": ["sql"],
            "additionalProperties": False,
        },
    },
    {
        "name": "make_chart",
        "description": (
            "Show a chart to the user using the rows of an earlier run_sql result. Pass only the result_id and column names, never data. "
            "type: line for trends over time, bar to compare categories, hbar for ranked categories, donut for shares (at most 8 slices). "
            "x is the category or time column, y is one or more numeric columns. "
            "format: currency for dollar amounts, percent only when the values are fractions between 0 and 1, otherwise number."
        ),
        "eager_input_streaming": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "result_id": {"type": "string", "description": "The result_id returned by run_sql."},
                "type": {"type": "string", "enum": list(CHART_TYPES)},
                "x": {"type": "string", "description": "Column for the categories or time axis."},
                "y": {"type": "array", "items": {"type": "string"}, "description": "Numeric column(s) to plot."},
                "title": {"type": "string", "description": "Short chart title, under 80 characters."},
                "format": {"type": "string", "enum": list(CHART_FORMATS)},
            },
            "required": ["result_id", "type", "x", "y", "title"],
            "additionalProperties": False,
        },
    },
]
