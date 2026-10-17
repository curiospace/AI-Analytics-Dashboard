from datetime import date

import pytest

import db
import metrics

db.refresh()

RANGES = [(date(2026, 1, 1), date(2026, 12, 31)), (date(2025, 7, 1), date(2025, 12, 31))]


@pytest.mark.parametrize("lo,hi", RANGES)
@pytest.mark.parametrize("product", [None, "Sideboard"])
def test_kpi_cards_count_the_same_delivered_orders_as_the_charts(lo, hi, product):
    k = metrics.get_kpis(lo, hi, product)
    trend = metrics.get_orders_trend(lo, hi, product)
    status = {s["name"]: s["value"] for s in metrics.get_delivery_status(lo, hi, product)}

    assert k["delivered"] == sum(m["completed"] for m in trend) == sum(status.values())
    assert k["late_orders"] == status.get("Late", 0)
    assert k["on_time_pct"] == pytest.approx(status.get("On Time", 0) / k["delivered"])
