# Data exploration notes (step 1)

Period: 2025-01-02 → 2027-01-01 (2 years, 730 days). 1,166 orders (CSV has 1,166 data rows, not 1,165).

## Findings
- **orders.status:** LOST 689 (59%), DELIVERED 460, in progress 17 (MILLING 12, FINISHING 3, JOINERY 1, DESIGN 1; all created Dec 2026).
- **LOST orders** have a quote but no acceptance/due/completion date → they are quotes the customer rejected, not production orders. Lost rate is ~54–62% for every product (no strong product signal).
- **Production orders = DELIVERED + in progress.** Only these have dueDate, hours worth analysing, design_log and inventory CONSUME rows.
- **Lateness:** 63 of 460 delivered are Late (13.7%), lateDays 1–7, every late order has penaltyPct 0.1 (10%), everything else 0. Late orders cluster in Oct–Nov 2025 (30) and Apr–May 2026 (23) — right after the resignation waves (Apr–Sep 2025, mid-2026). Good story for the resignation → on-time question.
- **Ledger:** types COST (1,571) and REVENUE (937). REVENUE = "Deposit" (477) + "Final payment" (460, penalty already applied in amount, e.g. "10% late penalty applied"). COST = Daily Overheads (730), Daily Wages (730), material Reorders (111). Total revenue 4.99M vs costs 4.78M → thin margin.
- **Revenue reconciliation:** delivered quotePrice sum 4.93M vs ledger revenue 4.99M (ledger includes deposits on in-progress orders).
- **Avg hours per delivered order:** design 14.9, milling 22.4, joinery 29.8, finishing 7.5 → joinery is the biggest labour stage (bottleneck candidate). Avg 13.7 days from creation to completion.
- **design_log:** 490 rows, 12 designers, durationDays mostly 3–4; 14 rows with 0 days (check). Most work done by D1 (191), D3 (148), D2 (48) — D1/D2 later resigned, D3 stays.
- **inventory_log:** 489 CONSUME (all linked to an order), 111 REORDER (orderId = "N/A"). 3 materials: Victorian Ash, American Walnut, Tasmanian Oak.
- **hr_roster:** 23 staff (designers D*, makers M*), 13 Resigned / 10 Active; wage 45 (high skill) or 30 (low) per hour. hr_events_log: 12 Resignation, 11 Hired, 96 Leave Start/End pairs.
- **customers_data:** one order per customer (no repeat customers) → customer lifetime value / repeat rate not meaningful; skip.
- **Integrity:** every design_log/inventory orderId exists in orders.

## Cleaning rules for the backend
- Parse dates as DATE; empty strings → NULL (completionDate, acceptanceDate, dueDate); inventory `orderId = 'N/A'` → NULL.
- Ignore customers_data (or parse `[101]` only if needed).
- Hr events are the only source of resignation/hire dates (roster has no dates).

## Metric definitions (proposed — confirm)
| Metric | Definition |
|---|---|
| Revenue | ledger REVENUE sum (cash view); per-order = quotePrice × (1 − penaltyPct) for DELIVERED |
| Costs | ledger COST sum (wages + overheads + material reorders) |
| Win rate | (DELIVERED + in progress) / all orders |
| On-time % | DELIVERED with deliveryStatus = 'On Time' / DELIVERED |
| Avg lead time | completionDate − creationDate for DELIVERED |
| Order profit (per product) | quotePrice × (1 − penaltyPct) − materialCost − Σ(stage hours × avg wage); labour is approximate |
| Date filter | quotes and win rate by creationDate; everything about DELIVERED orders (on-time, late, lead time, order value, stage hours, profit) by completionDate |
| Time axis | monthly (24 months, 2025-01 to 2026-12; 2027-01 is a 1-day stub → exclude or merge) |

## Open decisions for you
1. Revenue on dashboard: cash (ledger) or per-order? Recommend ledger for the Revenue-vs-Cost chart, per-order for profit by product.
2. Exclude the 2027-01-01 stub month and the 17 in-progress orders from on-time/lead-time metrics (recommended).
3. Treat LOST as "quote lost" (not "late/failed production") in all labels.
