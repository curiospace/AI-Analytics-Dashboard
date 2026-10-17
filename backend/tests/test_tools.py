import pytest

import tools
from tools import ToolError, make_chart, make_sandbox, run_sql


@pytest.fixture(scope="module")
def sandbox():
    return make_sandbox()


def test_loads_all_tables_with_dashboard_types(sandbox):
    names = {r[0] for r in sandbox.execute("SHOW TABLES").fetchall()}
    assert {"orders_data", "financial_ledger", "inventory_log", "hr_roster"} <= names
    # 'N/A' order ids become NULL, so the column is numeric like in the dashboard
    assert sandbox.execute("SELECT typeof(orderId) FROM inventory_log LIMIT 1").fetchone()[0] == "BIGINT"


def test_select_works_and_stores_full_result(sandbox):
    store = {}
    text = run_sql(sandbox, "SELECT status, count(*) AS n FROM orders_data GROUP BY 1 ORDER BY 2 DESC", store)
    assert text.startswith("result_id: r1")
    assert store["r1"]["rows"][0] == ["LOST", 689]
    assert "n (BIGINT)" in text


@pytest.mark.parametrize("sql", [
    "DROP TABLE orders_data",
    "DELETE FROM orders_data",
    "INSERT INTO hr_roster VALUES ('X','maker','high','Active',1)",
    "COPY orders_data TO '/tmp/leak.csv'",
    "ATTACH '/tmp/other.db'",
    "SET enable_external_access = true",
    "SELECT 1; DROP TABLE orders_data",
    "PRAGMA memory_limit='100GB'",
    "EXPLAIN SELECT 1",
    "",
])
def test_rejects_anything_but_one_select(sandbox, sql):
    with pytest.raises(ToolError):
        run_sql(sandbox, sql, {})
    assert sandbox.execute("SELECT count(*) FROM orders_data").fetchone()[0] == 1166  # nothing was damaged


@pytest.mark.parametrize("sql", [
    "SELECT * FROM read_csv('/etc/passwd')",
    "SELECT * FROM read_text('/etc/hostname')",
    "SELECT * FROM glob('/home/*')",
])
def test_cannot_read_files_outside(sandbox, sql):
    with pytest.raises(ToolError):
        run_sql(sandbox, sql, {})


def test_bad_sql_is_a_readable_error(sandbox):
    with pytest.raises(ToolError, match="SQL error"):
        run_sql(sandbox, "SELECT nope FROM orders_data", {})


def test_row_cap_and_preview(sandbox):
    store = {}
    text = run_sql(sandbox, "SELECT range AS i FROM range(5000)", store)
    assert len(store["r1"]["rows"]) == tools.MAX_ROWS
    assert "cut off" in text
    assert text.count("\n") < 40  # the model sees a preview, not 1000 rows


def test_timeout_interrupts_slow_queries(sandbox, monkeypatch):
    monkeypatch.setattr(tools, "TIMEOUT_SECONDS", 1)
    with pytest.raises(ToolError):
        run_sql(sandbox, "SELECT count(*) FROM range(100000000) a, range(100000000) b", {})


def test_dates_and_decimals_become_json_safe(sandbox):
    store = {}
    run_sql(sandbox, "SELECT DATE '2025-03-01' AS d, 1.50::DECIMAL(5,2) AS v", store)
    assert store["r1"]["rows"] == [["2025-03-01", 1.5]]


def _store(sandbox, sql):
    store = {}
    run_sql(sandbox, sql, store)
    return store


def test_make_chart_builds_spec_from_stored_rows(sandbox):
    store = _store(sandbox, "SELECT productType AS product, avg(quotePrice) AS price FROM orders_data GROUP BY 1 ORDER BY 2 DESC")
    spec = make_chart(store, "r1", "hbar", "product", ["price"], "Average quote", "currency")
    assert spec["type"] == "hbar" and spec["format"] == "currency"
    assert len(spec["rows"]) == 5 and set(spec["rows"][0]) == {"product", "price"}
    assert spec["sql"].startswith("SELECT productType")


@pytest.mark.parametrize("kwargs, message", [
    (dict(result_id="r9", type="bar", x="a", y=["b"]), "Unknown result_id"),
    (dict(result_id="r1", type="pie", x="a", y=["b"]), "Unknown chart type"),
    (dict(result_id="r1", type="bar", x="a", y=["missing"]), "not in r1"),
    (dict(result_id="r1", type="bar", x="a", y=["a"]), "not numeric"),
    (dict(result_id="r1", type="bar", x="a", y=[]), "at least one"),
    (dict(result_id="r1", type="bar", x="a", y=["b"], format="euro"), "Unknown format"),
    (dict(result_id="r1", type="bar", x="a", y=["b"], format="percent"), "fractions between 0 and 1"),
])
def test_make_chart_rejects_bad_requests(sandbox, kwargs, message):
    store = _store(sandbox, "SELECT 'x' AS a, 5.0 AS b")
    with pytest.raises(ToolError, match=message):
        make_chart(store, title="t", **kwargs)


def test_make_chart_limits(sandbox):
    many = _store(sandbox, "SELECT range AS i, range AS j FROM range(500)")
    with pytest.raises(ToolError, match="too many"):
        make_chart(many, "r1", "line", "i", ["j"], "t")
    slices = _store(sandbox, "SELECT range::VARCHAR AS a, range AS b FROM range(9)")
    with pytest.raises(ToolError, match="donut"):
        make_chart(slices, "r1", "donut", "a", ["b"], "t")
    empty = _store(sandbox, "SELECT 'x' AS a, 1 AS b WHERE false")
    with pytest.raises(ToolError, match="no rows"):
        make_chart(empty, "r1", "bar", "a", ["b"], "t")
    nulls = _store(sandbox, "SELECT 'x' AS a, NULL::INT AS b")
    with pytest.raises(ToolError, match="not numeric"):
        make_chart(nulls, "r1", "bar", "a", ["b"], "t")


def test_tool_definitions_are_well_formed():
    assert [t["name"] for t in tools.TOOLS] == ["run_sql", "make_chart"]
    for t in tools.TOOLS:
        assert t["input_schema"]["additionalProperties"] is False
        assert set(t["input_schema"]["required"]) <= set(t["input_schema"]["properties"])
