# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Managers at Modern Furniture Co., a custom furniture manufacturer. They are non-technical: they do not write SQL and cannot read raw CSVs. They open the product to understand how the business is running (orders, delivery, costs, staff, stock) and to ask follow-up questions in plain English when a number surprises them. Their job is making operating decisions: where production is slowing down, whether staff changes are hurting delivery, which products earn their keep.

## Product Purpose

An AI analytics agent plus a supporting dashboard for Modern Furniture Co. The dashboard gives the standing picture (revenue and cost, on-time delivery, hours per production stage, profit by product, resignations against delivery). The chat agent answers questions the dashboard does not already show, returning a short explanation and a chart built from the company's own data.

It exists to let a manager get a trustworthy, data-backed answer to a business question without an analyst in the loop. It was built as the proof of concept for a university assessment ("AI Analytics A2": design, propose and build an Analytics Agent for Modern Furniture Co.), so success has two parts: the manager persona is genuinely served, and the work demonstrates clear business requirements, conceptual design, data integration and a working prototype.

## Positioning

Every number is traceable. The agent never types data into an answer or chart: figures come from a read-only SQL query run on the company's data, chart rows are copied from that query's stored result, and the SQL is one click away ("View SQL"). It states which definition it used when a metric could be read two ways, and it separates timing from cause (for example, "on-time fell after resignations", never "resignations caused"). A generic chatbot or a static dashboard cannot make both claims.

## Operating Context

- Used in a browser, at a desk, by one manager at a time; the chat opens beside the dashboard so the page narrows instead of being covered.
- The finished work is shown as a screen-recorded demo (at least 2 to 3 distinct business questions answered live) and a slide deck of at most 10 slides, submitted for marking. It must read clearly in a compressed video recording.
- Questions the brief names: "What was our biggest production bottleneck last quarter?", "Show me the impact of employee resignations on our on-time delivery rate.", "Which product type is the most profitable?". The brief's stated business challenges are demand forecasting, production efficiency, cost control and reputation management.
- Data comes from the Advanced Furniture Manufacturing Simulator, delivered as seven CSV files that may grow over time: new months or years must appear without code changes.
- Backend is Python (FastAPI + DuckDB); frontend is React, Vite, TypeScript, Tailwind and ECharts. The agent calls the Claude API with two tools, `run_sql` and `make_chart`, inside a locked-down, read-only copy of the data.

## Capabilities and Constraints

- Dashboard: KPI strip, signals panel (plain-English findings computed from the data), orders created vs delivered, revenue vs cost, on-time delivery vs resignations, hours per stage, profit per order by product, accepted orders by product. Quotes and win rate are dated by creation; everything about delivered orders is dated by completion, so the KPI cards, charts and chat count the same orders. Filters: a data-driven date range (all time, last 12 months, last 6 months, each year that exists, custom) and product.
- Chat agent: answers in streamed text, tool-step lines, and an inline chart (line, bar, horizontal bar, donut) with Table and View SQL views. Invalid chart requests fall back to a table instead of a blank box. Demo mode (a built-in few questions) runs when no API key is set.
- Terminology that must stay consistent: LOST means the customer rejected the quote (never produced), not a failed order. "Won" or "accepted" orders are status other than LOST. On-time % is of delivered orders only. A late order is 1 to 7 days late and pays a 10% penalty. The financial ledger has no product column, so revenue and cost cannot be split by product.
- Built: pinning agent charts to the dashboard (as dated snapshots), and moving and resizing the dashboard's panels directly (drag, or arrow keys), saved in the browser along with the chat.
- Undecided: whether partial trailing months are marked on charts; pinned charts that refresh with new data; CSV upload for the agent; a quarterly or yearly grain for very long ranges.
- The Case Study document the brief refers to is not in the repository.

## Brand Commitments

The business is named Modern Furniture Co. (from the assessment brief; a fictional client). No logo, voice guide or other brand assets exist.

## Evidence on Hand

- Real simulator data in `DataA2-1/DataA2/`: orders_data (1,166 rows), customers_data, design_log, financial_ledger, inventory_log, hr_roster, hr_events_log, covering 2025-01-02 to 2026-12-31 (plus a 1-day leftover on 2027-01-01 that the backend deliberately ignores).
- `AI Analytics A2.pdf`: the assessment brief, marking rubric and required deliverables.
- `DATA_NOTES.md`: findings and metric definitions from exploring the data.
- Not on hand and must not be fabricated: customer testimonials, real customers, benchmarks, pricing, peer feedback results, or any figure not produced by the data.

## Product Principles

- Trust over fluency: a number the manager cannot trace is worse than no number. Prefer showing the query and the definition to sounding confident.
- Answer first, plainly: lead with the finding in a few sentences a busy manager can act on; charts and tables support it.
- Honest about limits: say when data cannot answer a question, when a sample is small, and when a pattern is only a timing relationship.
- Nothing is hard-coded about the data: time ranges, products and findings come from the data, so new months and years just appear.
- The dashboard and the chat are one product: the same definitions, numbers and chart language in both.

## Accessibility & Inclusion

WCAG AA, best effort: sufficient text and chart contrast, full keyboard use, real labels on controls and icon buttons, reduced motion respected, and never colour alone to carry meaning. No formal audit or stricter standard is required.
