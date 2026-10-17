---
name: Modern Furniture Co. Analytics
description: A flat, ledger-precise analytics dashboard and chat agent where every number ties back to its query.
colors:
  bg: "#f3f4f6"
  panel: "#ffffff"
  panel-2: "#f7f8fa"
  line: "#e3e6eb"
  line-strong: "#d5d9e0"
  control-line: "#868e9a"
  track: "#eef0f3"
  ink: "#0e1621"
  muted: "#5b6573"
  snow: "#e3e7ee"
  night-line: "#243040"
  accent: "#2b59ff"
  accent-deep: "#1c40e7"
  accent-light: "#8fb0ff"
  alert: "#d92d3a"
  alert-light: "#ff8d96"
  ok: "#1f8a4c"
  series: "#7a8494"
  series-4: "#5c7ac4"
  bar: "#c9ced6"
typography:
  display:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-chat:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  action:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.08em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  small:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  bar: "4px"
  sm: "8px"
  mark: "9px"
  control: "10px"
  md: "12px"
  panel: "14px"
  bubble: "16px"
spacing:
  sm: "10px"
  md: "16px"
  lg: "20px"
  gutter-phone: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "36px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.panel}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.track}"
  icon-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    size: "44px"
  icon-button-hover:
    backgroundColor: "{colors.track}"
  filter-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  brand-mark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.mark}"
    size: "32px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  panel-signals:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.snow}"
    rounded: "{rounded.panel}"
    padding: "20px"
  kpi-card:
    backgroundColor: "{colors.panel}"
    typography: "{typography.headline}"
    rounded: "{rounded.panel}"
    padding: "18px 20px"
  rank-track:
    backgroundColor: "{colors.track}"
    rounded: "{rounded.bar}"
    height: "8px"
  chat-bubble-user:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.body-chat}"
    rounded: "{rounded.bubble}"
    padding: "12px 16px"
  chat-column:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    width: "440px"
  composer:
    backgroundColor: "{colors.panel}"
    typography: "{typography.body-chat}"
    rounded: "{rounded.panel}"
    padding: "6px 6px 6px 16px"
---

# Design System: Modern Furniture Co. Analytics

## Overview

**Creative North Star: "The Operations Ledger"**

The system behaves like a well-kept ledger: ruled, exact and accountable. Every figure sits on a clean white page inside a hairline rule, and nothing on the page is allowed to be louder than the numbers it carries. Colour is a pen, not paint. Signal Blue records the main line of the story (the primary series, the leading item, the one action that matters). Alarm Red is the correction pen, used only where something went wrong. Everything else is graphite and paper.

The mood is calm, exact and accountable. The canvas is a cool, barely tinted grey with white panels resting on it, and depth comes only from tone and 1px rules, never from shadows. A single dark ink strip (Signals) is where the system speaks in sentences. Type pairs a sturdy grotesque for reading with a monospace for anything measured or machine-produced, so a reader can tell at a glance what is prose and what is a reading off the instrument. It is a single page with no navigation chrome: a small ink brand mark sits beside the title, and the data gets the full width.

Motion follows the same discipline. When a filter changes, the ledger re-writes itself: lines morph from the old values to the new ones so the reader sees what moved, stale numbers dim while fresh ones load, and nothing replays an entrance for show. The layout narrows gracefully when the chat column opens beside it, and it is never covered on a desktop.

Confirmed rejection: vivid gradient-heavy "AI dashboard" styling (neon gradients, glowing cards, gradient fills). The owner rejected an early version as looking vibe-coded, and the system exists in deliberate contrast to it.

**Key Characteristics:**
- Flat white panels on a cool grey page, separated by 1px hairlines; zero shadows.
- One accent (Signal Blue) and one warning (Alarm Red), each with a single job.
- Hanken Grotesk for reading, IBM Plex Mono for measured values, labels and system output.
- A single dark ink strip for plain-English findings computed from the data.
- Charts drawn like annotations that morph, not redraw, when the data changes.
- One page, no navigation; layout driven by the width of the content column, not the window.

## Colors

A near-monochrome graphite-and-paper palette with exactly two signal colours, each reserved for one meaning.

### Primary
- **Signal Blue** (#2b59ff): the main series in every chart, the leading bar in a ranked list, the single primary action ("Ask the data", Send), the focus outline, and the chat "CONTEXT" tag. 5.28:1 on white, so it works as text, as a fill under white text, and as a focus ring.
- **Signal Blue Deep** (#1c40e7): the hover state of Signal Blue fills only. White on it is 7.15:1.
- **Signal Blue on Ink** (#8fb0ff): the lightened blue for neutral tags on the dark Signals strip (8.5:1 on ink).
- **Fourth Series** (#5c7ac4): the fourth line in a multi-series chat chart, always paired with a dotted line style. 4.17:1 on white.

### Secondary
- **Alarm Red** (#d92d3a): problems only. Late orders, months where on-time delivery collapsed, the worst item in a profit ranking, resignation counts, error messages and failed-load notices. 4.79:1 on white.
- **Alarm Red on Ink** (#ff8d96): the lightened red for problem tags on the Signals strip (8.2:1 on ink).

### Tertiary
- **Ok Green** (#1f8a4c): the completed-step tick in the chat's tool-step list. Icons only (4.38:1 on white passes the 3:1 icon threshold, not body text).

### Neutral
- **Ink** (#0e1621): primary text, titles, the brand mark, the user's chat bubble, and the Signals strip background. 18.2:1 on white.
- **Graphite** (#5b6573): secondary text, labels, axis ticks, captions, placeholders, loading and empty-state messages. 5.9:1 on white and 5.4:1 on the page grey.
- **Pewter Series** (#7a8494): the comparison series in charts, always drawn dashed. 3.78:1 on white.
- **Bar Grey** (#c9ced6): non-leading bars in ranked lists (each bar's value is printed beside it, so the fill carries no meaning on its own).
- **Paper** (#ffffff): panels, cards, the chat column, controls.
- **Cool Page** (#f3f4f6): the page background behind panels; also the chat's tool-step and SQL wells.
- **Faint Paper** (#f7f8fa): the chat context bar, table headers and quiet hover fills.
- **Hairline** (#e3e6eb): every panel border and divider. Decorative containment only, never the boundary of a control.
- **Firm Hairline** (#d5d9e0): chart baselines and other rules that need a little more weight.
- **Control Line** (#868e9a): the border of every interactive control (filter fields, the composer, secondary buttons). 3.31:1 on white and 3.01:1 on the page, so a control's edge is visible to low-vision users.
- **Track** (#eef0f3): ranked-bar tracks, chart gridlines and hover fills.
- **Snow** (#e3e7ee) and **Night Rule** (#243040): text and dividers on the Signals strip.

### Named Rules
**The Alarm Means Something Rule.** Alarm Red appears only where something went wrong. It is never decoration, never a brand colour, never a second accent. If a screen has no problem to report, it has no red.

**The First-in-Rank Rule.** In a ranked list only the leader gets Signal Blue. Everything else is Bar Grey, and only the worst item may turn red when ranking profit or performance, and only when there is more than one item.

**The One Dark Strip Rule.** Ink as a surface is reserved for the Signals findings. One dark strip per screen, at most.

**The Edge-You-Can-See Rule.** Containers may use the faint Hairline; anything you can click, type into or choose from uses Control Line (3:1). The two must never be swapped.

## Typography

**Display Font:** Hanken Grotesk (with system-ui, sans-serif)
**Body Font:** Hanken Grotesk (with system-ui, sans-serif)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, monospace)

**Character:** A sturdy, slightly warm grotesque carries every sentence and headline; Plex Mono is the ledger column, with labels, ticks, values and anything the system produced. The pairing reads as "a person explains, the instrument measures".

### Hierarchy
- **Display** (700, 1.875rem/30px, line-height 1.2, -0.025em): the page title ("Operations overview"). One per page.
- **Headline** (700, 1.875rem/30px, line-height 1, -0.025em; 24px when the content column is narrower than 42rem): KPI figures. Signal Blue for the headline good-news metric (on-time delivery), Alarm Red for a problem count (late orders, only when above zero), otherwise Ink. A missing value is shown as an en dash, never as zero.
- **Title** (700, 1rem/16px, line-height 1.5): panel and card titles, the chat header.
- **Body** (400, 0.875rem/14px, line-height 1.43): captions, legends, list labels, KPI sub-lines, loading, empty and error messages.
- **Body Chat** (400, 0.9375rem/15px, line-height 1.625): chat answers, questions, composer and starter questions; read as prose, so one step larger. The composer and filter values rise to 16px on phones so iOS never zooms into a field.
- **Action** (600, 0.875rem/14px): button labels.
- **Label** (400, 11px, 0.08em tracking, UPPERCASE, IBM Plex Mono): KPI labels, panel units ("AVG H / ORDER"), Signals tags, "TRY ASKING", row counts, the chat subtitle. 11px (`--text-meta`) is the size floor for the whole product: nothing renders smaller, because the work is judged in a compressed screen recording. Tool steps and the chat context bar use the same 11px mono without the uppercase.
- **Data** (400, 0.8125rem/13px, IBM Plex Mono, tabular numerals): values beside ranked bars. Secondary button labels use the same 13px size in Hanken Grotesk at 500. Chart axis ticks use the mono face at the 11px floor.
- **Small** (400, 0.75rem/12px, line-height 1.33): the chat footnote (the demo-mode note under the composer) and a chart card's fallback reason; in IBM Plex Mono for chat table cells and the SQL view, where rows must fit the 440px column.

### Named Rules
**The Mono Means Measured Rule.** IBM Plex Mono is for things that are measured or machine-produced: labels, ticks, values, tool steps, SQL. Never set prose or headlines in mono.

**The Big Number Rule.** A KPI figure is the largest text inside its card and sits directly under its mono label, with a one-line plain-English sub-line under it. Nothing else in the card competes with it.

## Layout

A single page: one main column and, when opened, a 440px chat column (`--container-drawer`, the `w-drawer` class) docked to its right. There is no navigation rail; with only one page, navigation would be decoration. The brand mark (a 32px ink tile) sits beside the page title instead; the same tile, with the M drawn as a stroke so it reads at 16px, is the browser-tab icon (`frontend/public/favicon.svg`).

The main column is a container: its grids respond to the column's own width, not the window's. So one set of rules covers a phone, a tablet and a desktop with the chat open (which narrows the column by 440px).
- **Gutter:** 16px on phones, 24px from 640px, 36px from 1024px.
- **Header:** title and range on the left; filters and the primary action on the right. On phones the filters fill their row and "Ask the data" spans the full width.
- **KPI row:** 2 columns, 3 from a 42rem column, 6 from a 64rem column; six cards always divide evenly, never leaving an orphan.
- **Signals:** 1, then 2, then 4 columns at the same thresholds as the panels below.
- **Panel grid (everything below Signals):** one grid of the built-in panels and any charts pinned from the chat, in the order the manager arranged. 1 column, 2 from a 42rem column, 3 from a 64rem column. Each panel has a width in thirds (narrow, wide, full; by default orders 2/3 beside revenue 1/3, on-time full, the three ranked panels a third each). Panels never move to fill gaps; instead the last panel of a row that cannot be completed widens to fill it (`fillRows` in `lib/layout.ts`, tested by `npm test`), so at two columns revenue and the last ranked panel take the full row. Panels in a row stretch to equal height; a panel the manager made taller keeps that height as a minimum, and its chart grows to fill it (never below 160px). Columns are minmax(0, …) so a chart can always shrink below its canvas width.

Rows are separated by 16px; panels pad 20px (KPI cards 18 × 20px, 16px on narrow columns); ranked rows sit 14px apart; small control gaps are 10px. Below 1024px the chat becomes a full-screen dialog (see Components).

### Named Rules
**The Narrow-Gracefully Rule.** Nothing may set a width that stops the main column from shrinking. The page makes room for the chat; on a desktop the chat never covers the page.

**The No-Orphan Rule.** No row is left with a hole at any width: six KPIs go 2 / 3 / 6, and in the panel grid the last panel of an unfinished row widens to fill it, whatever order and widths the manager chose.

## Elevation & Depth

This system is flat. There are no shadows anywhere, at rest or on hover. Depth is conveyed by tone in three layers (Cool Page → Paper panel → Ink strip) and by 1px borders. Wells (tool steps, SQL) sink by switching to Cool Page inside a Paper panel; hover states shift a fill to Track instead of lifting.

### Named Rules
**The No-Shadow Rule.** Surfaces are flat. If something needs to stand apart, change its tone or give it a rule. Never add a shadow, glow or blur.

## Shapes

Corners are softly rounded and consistent by the size of the object: panels and cards 14px, controls (buttons, filter fields, icon buttons) 10px, the brand mark 9px, starter-question cards 12px, small buttons and wells 8px, bar tracks 4px. The user's chat bubble is 16px with its bottom-right corner nearly square, so it points at the sender. Borders are always 1px. Ranked bars are 8px strokes with rounded ends; data points and problem markers are small circles. There are no angular cuts or decorative shapes.

## Components

### Buttons
Precise and quiet: one solid blue action per view, and everything else stays out of the way.
- **Shape:** gently rounded (10px). Primary and icon buttons hold a 44px minimum height.
- **Primary:** Signal Blue fill, white 14px/600 label, 18px horizontal padding, optional 16px leading icon. Hover fades to Signal Blue Deep (150ms). One per view ("Ask the data", the composer Send).
- **Secondary:** Paper fill, Ink label, 1px Control Line border, 8px radius, 36px tall (44px on touch screens), 12px padding; hover fades to Track. Used for chart-card actions (Table, View SQL) and every "Try again".
- **Icon button:** 44 × 44px, transparent, Graphite icon, hover fades to Track, always with an accessible label.
- **Disabled:** 40% opacity (Send with an empty composer, starter questions while an answer is streaming).

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** Paper on the Cool Page canvas; the Signals strip is Ink with Snow text.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px Hairline on every Paper panel; none on the Ink strip.
- **Internal Padding:** 20px. A title row (Title type left, a mono unit label or legend right) sits 16px above the content.
- **States:** every data panel has four: loading ("Loading production hours…" in Graphite), error (Alarm Red explanation plus a "Try again" secondary button), empty (a Graphite sentence saying why, e.g. "No delivered orders in this range, so profit can't be estimated."), and loaded. While a filter change loads, the previous content stays visible at 50% opacity. A panel that crashes is replaced by the same card with an error and "Try again"; the rest of the page keeps working. The KPI strip, which has no card of its own, shows its loading and error messages inside a plain panel. An unreachable backend (no connection, or a 502–504 from the proxy) says "Can't reach the data server", not that the server failed.

### Inputs / Fields
- **Style:** filter fields are 44px Paper pills with a 10px radius and a Control Line border; a Graphite inline label ("Range", "Product") precedes the value in Ink at 600. The chat composer is a 14px-radius field with a Control Line border, holding the text input and a Signal Blue Send button.
- **Focus:** a 2px Signal Blue outline, offset 2px, on every keyboard-focused control. Framed controls (filter fields, composer) draw it on the frame and turn the inner outline off.
- **Error:** errors are Alarm Red text beside or below what failed, never a red-filled box. An impossible custom range (start after end) explains itself under the filters.
- **Browser surfaces:** text selection is Signal Blue at 20% under Ink text, the text caret is Signal Blue, and scrollbars use the Bar colour on a transparent track. Nothing is left on browser defaults.

### KPI Card
The headline row. A Paper card with a mono Label, a Headline figure and a 14px Graphite sub-line that explains the number in words ("397 of 458 delivered"; "No deliveries in this range" when there are none).

### Signals Strip
The one dark surface: an Ink panel titled "Signals" in Snow. Findings lay out in a grid, each under a Night Rule top border, with a mono uppercase tag (lightened blue for neutral findings, lightened red for problems) over one or two sentences of Snow body text. Findings are computed from the data, never typed; when data fails to load the strip says so rather than "nothing notable".

### Ranked Bars
A label (112px, truncated with the full name on hover), an 8px Track bar whose fill is proportional to the maximum, and a right-aligned mono value with tabular numerals. The leader fills Signal Blue, the rest Bar Grey, and on performance rankings the worst fills Alarm Red. Bars slide to new lengths when filters change.

### Charts (signature)
Charts are drawn like annotations on a ledger page:
- **Lines:** the main series is a 2.5px Signal Blue line without point markers (a single data point shows as a dot), with an optional flat 8% Signal Blue area fill; comparison series are 1.75px dashed Pewter. In chat charts, series alternate solid, dashed, solid and dotted so colour is never the only cue.
- **Axes:** 11px mono Graphite tick labels, Track gridlines, a hairline baseline, no tick marks; month labels are thinned to a readable count and any label that would collide is dropped.
- **Problem points:** a white circle with a 2px Alarm Red ring and a two-line mono red label beneath it ("Nov 25 / 18%"). Problem counts are small Alarm Red bars in a strip beneath the line.
- **Donuts (agent charts):** a 54–78% ring with 3px Paper separators, slices largest first and clockwise from the top. The largest slice's share sits in the hole as a 28px Hanken figure over its mono name ("86.7% / On Time"); the other slices carry outside mono labels with their share. The largest slice that is not a problem is Signal Blue; a slice whose name says something went wrong (late, lost, rejected, resigned…) is Alarm Red; the rest step through Pewter, Fourth Series and Bar Grey.
- **Bars (agent charts):** 4px-rounded bars up to 34px thick with their values printed in 11px mono when there are 12 or fewer. A ranking (categories, not periods) follows First-in-Rank: the leader Signal Blue, a problem Alarm Red, the rest Bar Grey. When the measure itself is one where more is worse (its column names a problem: lost, late, penalty…), the leader is the biggest problem and is Alarm Red. Bars over time (months, quarters, years) are all Signal Blue. A single agent line gets the dashboard's 8% area fill. When two series differ in scale by more than 5× (on-time % beside resignations), the smaller one moves to its own right-hand axis in plain numbers, so neither is flattened; legend names drop underscores ("ontime %").
- **Tooltips:** Paper with a Hairline border and Ink mono text.
- **Legends:** small inline line swatches (solid or dashed) in Graphite 14px text at the panel's top right, shown only while the lines they name are drawn (never beside an empty, loading or error message).
- **Accessibility:** every chart canvas carries a spoken summary built from the data ("On-time delivery fell to 18% in November 2025, after 5 resignations in the previous 4 months…").
- **Months and money in words:** sentences (Signals, spoken chart summaries, demo answers) name months in full, "November 2025", because "Nov 25" in a sentence reads as a day; the short "Nov 25" is for axes, markers and tables. Compact money keeps three significant digits with zeros ($4.98M, $10.6K, $214K, $5.60K) so figures compared in one sentence share a precision; zero is "$0"; axis ticks drop to the shortest form ($50K).

### Chat Column
- **Placement:** docked as a 440px column at 1024px and wider (the page narrows beside it); below that, a full-screen modal dialog with the page behind it inert and unscrollable. Focus moves to the composer on open and returns to the opener on close; Esc closes.
- **Header:** an Ink sparkle tile and the Title "Ask the data", with New chat and Close icon buttons.
- **Context bar:** a Faint Paper bar showing the active filters in mono, with a Signal Blue "CONTEXT" tag.
- **Messages:** user questions are Ink bubbles aligned right; answers are plain text with no bubble. Tool steps sit in a Cool Page well as mono lines, with an Ok Green tick when done and a pulsing Signal Blue dot while running. While the answer is being worked out and no text is streaming, a Graphite line with a pulsing Signal Blue dot says what is happening ("Writing a query…", "Reading the results…", "Drawing a chart…"); it disappears when the text starts. Charts arrive after the answer text, so an answer reads steps, text, chart. Each finished answer is announced once to screen readers. A stray Markdown **bold** from the agent renders as semibold rather than showing asterisks; nothing else is interpreted as markup.
- **Chart cards:** each answer chart sits in a Hairline-bordered card with Title, row count, the chart, and secondary buttons (Table, View SQL, and Pin to dashboard at the right; see Pinned Chart). An invalid chart falls back to a table with a red reason. The table formats values as the chart does (percent as 86.4%, months as "Nov 25"), but keeps whole dollars ($5,600) where the chart abbreviates; number columns are right-aligned with tabular numerals. The table and the SQL view scroll inside the card and are keyboard-focusable regions.

### Pinned Chart
A chart pinned from the chat becomes a dashboard panel. The chat card's "Pin to dashboard" secondary button (pushpin icon) turns into a pressed "Pinned" toggle in Signal Blue (tick icon); pressing it again unpins. A new pin goes first in the panel grid, next to the chat, and fades in (180ms). The panel is the usual Paper card: the chart's title, a mono "PINNED" label and a remove icon button at the right, the chart with Table and View SQL, and a Graphite note: "Snapshot from the chat on October 7, 2026. The filters above do not change it." A pin is the answer's rows as they were, so it never pretends to follow the filters.

### Moving and Resizing Panels
There is no edit mode: every panel can be moved and resized at any time, and the rest of the grid makes room.
- **Move:** press on a panel's title bar (it shows a grab cursor) or on the grip, a small six-dot pill centred on the panel's top edge that appears on hover, and drag. A press becomes a drag only after 5px, so clicks still work. The card follows the pointer at 95% opacity with a 2px Signal Blue outline, above everything; its slot stays behind as a dashed Control Line box on Track. Entering another panel puts the dragged one in its place, and the panels that move glide there (240ms, ease-arrive). On release the card glides into its slot. Dragging near the top or bottom of the window scrolls the page.
- **Resize:** drag the right edge for width (snaps to a third, two-thirds or the full row; not offered in the one-column layout), the bottom edge for height (snaps to 8px, at least 220px), or the corner (a small diagonal mark that appears on hover) for both. The panel shows a Signal Blue outline while resizing, shows exactly the chosen width until it is let go, and then the row fills.
- **Without a mouse:** the grip and the corner are buttons. On the grip, arrow keys move the panel one place earlier or later; on the corner, left and right change the width and up and down change the height by 40px. Focus stays on the control, and each change is announced ("Profit per order moved to position 3 of 8.", "Revenue vs cost is wide, 560 pixels tall."). On touch screens the grip and corner are always visible and larger.
- **Help and reset:** one Graphite line under the grid says how it works; "Reset layout" (secondary) appears beside it only once something has been moved or resized, and restores the default order, widths and heights while keeping pins.
- **Motion:** only reorders and width changes animate; data loading, filters and height drags reflow instantly. Reduced motion turns all of it off.

### Motion
Motion explains change; it never performs.
- **Ease:** one curve for everything that arrives, `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Charts:** draw in once, left to right, on first load (600ms); on every later data change, marks morph to the new values (400ms) instead of redrawing.
- **Updating:** stale panel content dims to 50% while new data loads (200ms).
- **Ranked bars:** slide to new lengths (300ms).
- **Chat:** the column slides in from the right (260ms) and closes instantly; new messages fade in (180ms).
- **Feedback:** hover colours fade over 150ms.
- **Reduced motion:** charts update without animation, bars jump, the chat only fades in; opacity and colour feedback stay because they carry meaning.

## Do's and Don'ts

### Do:
- **Do** keep every surface flat: tone (#f3f4f6 → #ffffff → #0e1621) and 1px rules carry all depth.
- **Do** give each screen exactly one solid Signal Blue (#2b59ff) action.
- **Do** reserve Alarm Red (#d92d3a) for things that went wrong, so red always means a problem.
- **Do** border every interactive control with Control Line (#868e9a) and every container with Hairline (#e3e6eb).
- **Do** set measured values, labels, ticks and system output in IBM Plex Mono, and sentences in Hanken Grotesk.
- **Do** pair every chart colour with a second cue (solid, dashed or dotted lines, labels on marked points, legends, printed values), so colour never carries meaning alone.
- **Do** give every chart a spoken summary and every data panel its loading, error, empty and updating states.
- **Do** let charts morph between data states, and respect reduced motion.
- **Do** size grids by the content column (container queries), so the page reflows the same way for a phone and for an open chat.

### Don't:
- **Don't** use vivid gradients, neon glows or gradient-filled cards. This look was explicitly rejected.
- **Don't** add shadows, blurs or glows to any surface, at rest or on hover.
- **Don't** use Alarm Red decoratively or as a second brand colour.
- **Don't** add a second dark surface; the Ink strip is reserved for Signals.
- **Don't** put Ok Green (#1f8a4c) on small text; it is for icons only.
- **Don't** set prose or headlines in monospace, or measured values in the grotesque.
- **Don't** add navigation for pages that do not exist.
- **Don't** replay a chart's entrance animation on a data update, or animate anything for show.
- **Don't** float the chat over the dashboard on desktop widths.
