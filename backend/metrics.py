from datetime import date, timedelta

from functools import lru_cache

import db
from db import con


def _one(sql, params=()) -> tuple:
    # aggregate queries without GROUP BY always return exactly one row
    # a fresh cursor per query: one shared connection mixes up results when requests run in parallel
    row = con.cursor().execute(sql, list(params)).fetchone()
    assert row is not None
    return row


# One date rule for every view: quotes count in the month they were created, delivered orders in the month they
# were completed. So "on-time in 2026" means the same orders on the KPI card, the chart and in the chat.
CREATED = "creationDate"
COMPLETED = "completionDate"


def order_filter(date_from,date_to, product = None, prefix = "", date_col = CREATED):
    where = f"{prefix}{date_col} BETWEEN ? AND ?"
    params = [date_from, date_to]
    if product:
        where += f" AND {prefix}productType = ?"
        params.append(product)
    return where,params

def get_kpis(date_from,date_to, product = None):
    where, params = order_filter(date_from, date_to, product, date_col=COMPLETED)
    row = _one(f"""
        SELECT
            count(*)                                                AS delivered,
            count(*) FILTER (WHERE deliveryStatus = 'Late')         AS late_orders,
            avg((deliveryStatus = 'On Time')::INT)                  AS on_time_pct,
            avg(quotePrice * (1 - penaltyPct))                      AS avg_order_value,
            avg(date_diff('day', creationDate, completionDate))     AS lead_days
        FROM orders_data
        WHERE status = 'DELIVERED' AND {where}
         """, params)

    q_where, q_params = order_filter(date_from, date_to, product)
    win_rate = _one(f"SELECT avg((status <> 'LOST')::INT) FROM orders_data WHERE {q_where}", q_params)[0]

    rev = _one(
        "SELECT sum(amount) FROM financial_ledger WHERE type='REVENUE' AND date between ? AND ?",
        [date_from,date_to])[0]

    d_where, d_params = order_filter(date_from, date_to, product, prefix="o.")
    design_days = _one(f"""
        SELECT avg(d.durationDays)
        FROM design_log d JOIN orders_data o ON d.orderId = o.id
        WHERE {d_where}
    """, d_params)[0]

    return {
        "delivered": row[0],
        "late_orders": row[1],
        "on_time_pct": row[2],
        "avg_order_value": row[3],
        "lead_days": row[4],
        "win_rate": win_rate,
        "revenue": rev,
        "design_days": design_days,
    }

# A trailing month covered by fewer days than this is treated as a stub and left out
# (the simulator ends on the 1st of a new month, e.g. 2027-01-01).
MIN_TRAILING_DAYS = 7


def data_range() -> tuple[date, date]:
    """First and last date that has data, computed from the data itself."""
    return _data_range(db.version())


@lru_cache(maxsize=4)
def _data_range(version: int) -> tuple[date, date]:
    # cached per data version: recomputed only after a CSV changes, not on every request
    lo, hi = _one("""
        SELECT min(d), max(d) FROM (
          SELECT creationDate AS d FROM orders_data
          UNION ALL SELECT completionDate FROM orders_data
          UNION ALL SELECT date FROM financial_ledger)""")
    if hi.day < MIN_TRAILING_DAYS:
        hi = hi.replace(day=1) - timedelta(days=1)  # drop the stub: back to the end of the previous month
    return lo, hi


def get_meta():
    date_min, date_max = data_range()
    products = [r[0] for r in _rows("SELECT DISTINCT productType FROM orders_data ORDER BY 1")]
    return {
        "date_min": date_min.isoformat(),
        "date_max": date_max.isoformat(),
        "partial_last_month": (date_max + timedelta(days=1)).day != 1,  # data stops mid-month
        "products": products,
    }


def _rows(sql, params=()):
    return con.cursor().execute(sql, list(params)).fetchall()


def get_product_mix(date_from, date_to, product=None):
    where, params = order_filter(date_from, date_to, product)
    # won orders only (LOST = quote rejected)
    return [{"name": n, "value": v} for n, v in _rows(f"""
        SELECT productType, count(*) FROM orders_data
        WHERE status <> 'LOST' AND {where} GROUP BY 1 ORDER BY 2 DESC""", params)]


def get_delivery_status(date_from, date_to, product=None):
    where, params = order_filter(date_from, date_to, product, date_col=COMPLETED)
    return [{"name": n, "value": v} for n, v in _rows(f"""
        SELECT deliveryStatus, count(*) FROM orders_data
        WHERE status = 'DELIVERED' AND {where} GROUP BY 1 ORDER BY 1 DESC""", params)]


def get_weekday(date_from, date_to, product=None):
    where, params = order_filter(date_from, date_to, product)
    counts = dict(_rows(f"""
        SELECT isodow(creationDate), count(*) FROM orders_data
        WHERE {where} GROUP BY 1""", params))
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return [{"name": d, "value": counts.get(i + 1, 0)} for i, d in enumerate(days)]


def get_stage_hours(date_from, date_to, product=None):
    where, params = order_filter(date_from, date_to, product, date_col=COMPLETED)
    row = _one(f"""
        SELECT avg(designHours), avg(millingHours), avg(joineryHours), avg(finishingHours)
        FROM orders_data WHERE status = 'DELIVERED' AND {where}""", params)
    stages = ["Design", "Milling", "Joinery", "Finishing"]
    return [{"name": s, "value": v} for s, v in zip(stages, row)]


def get_orders_trend(date_from, date_to, product=None):
    where, params = order_filter(date_from, date_to, product)
    created = dict(_rows(f"""
        SELECT strftime(creationDate, '%Y-%m'), count(*) FROM orders_data
        WHERE {where} GROUP BY 1""", params))
    c_where, c_params = order_filter(date_from, date_to, product, date_col=COMPLETED)
    completed = dict(_rows(f"""
        SELECT strftime(completionDate, '%Y-%m'), count(*) FROM orders_data
        WHERE status = 'DELIVERED' AND {c_where} GROUP BY 1""", c_params))
    return [{"month": m, "created": created.get(m, 0), "completed": completed.get(m, 0)}
            for m in sorted(created.keys() | completed.keys())]


def get_revenue_cost(date_from, date_to):
    # ledger has no product column -> date filter only
    data = {}
    for m, t, amt in _rows("""
        SELECT strftime(date, '%Y-%m'), type, sum(amount) FROM financial_ledger
        WHERE date BETWEEN ? AND ? GROUP BY 1, 2""", [date_from, date_to]):
        data.setdefault(m, {"revenue": 0, "cost": 0})[t.lower()] = amt
    return [{"month": m, **data[m]} for m in sorted(data)]


def get_profit_by_product(date_from, date_to, product=None):
    # ponytail: labour = hours x avg wage per role (approximate); per-person costing if needed
    where, params = order_filter(date_from, date_to, product, date_col=COMPLETED)
    return [{"name": n, "avg_profit": p, "orders": c} for n, p, c in _rows(f"""
        WITH w AS (SELECT role, avg(wage) AS wage FROM hr_roster GROUP BY role)
        SELECT productType,
          avg(quotePrice * (1 - penaltyPct) - materialCost
              - designHours * (SELECT wage FROM w WHERE role = 'designer')
              - (millingHours + joineryHours + finishingHours) * (SELECT wage FROM w WHERE role = 'maker')),
          count(*)
        FROM orders_data WHERE status = 'DELIVERED' AND {where}
        GROUP BY 1 ORDER BY 2 DESC""", params)]


def get_ontime_vs_resignations(date_from, date_to, product=None):
    c_where, c_params = order_filter(date_from, date_to, product, date_col=COMPLETED)
    ontime = dict(_rows(f"""
        SELECT strftime(completionDate, '%Y-%m'), avg((deliveryStatus = 'On Time')::INT)
        FROM orders_data WHERE status = 'DELIVERED' AND {c_where} GROUP BY 1""", c_params))
    resign = dict(_rows("""
        SELECT strftime(date, '%Y-%m'), count(*) FROM hr_events_log
        WHERE event = 'Resignation' AND date BETWEEN ? AND ? GROUP BY 1""", [date_from, date_to]))
    return [{"month": m, "on_time_pct": ontime.get(m), "resignations": resign.get(m, 0)}
            for m in sorted(ontime.keys() | resign.keys())]
