import type { EChartsCoreOption } from 'echarts/core'
import { autoInterval, axisText, tooltip, valueAxis } from './chartOptions'
import type { ChartSpec } from './chatTypes'
import { monthLabel, NONE, percent, usd, usdAxis } from './format'
import { colors, fontMono } from './theme'

// every series colour is at least 3:1 on white, and line styles alternate so colour is never the only cue
const palette = [colors.accent, colors.series, colors.ink, colors.series4]
const lineTypes = ['solid', 'dashed', 'solid', 'dotted']

const formats = {
  number: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 1 }),
  currency: (v: number) => usd(v),
  percent: (v: number) => percent(v),
}

// axis ticks stay short: $50K rather than the $50.0K a sentence would use
const axisFormats = { ...formats, currency: usdAxis, percent: (v: number) => `${Math.round(v * 100)}%` }

// the agent picks the format; anything unexpected falls back to plain numbers instead of crashing the card
const formatOf = (spec: ChartSpec) => (spec.format && spec.format in formats ? spec.format : 'number')

// Table cells are for reading exact values, so currency keeps whole dollars ($5,600) where the chart shows $5.6K.
const cellFormats = {
  ...formats,
  currency: (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
}

const isMonth = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}$/.test(v)
// years, months, quarters or ISO weeks along the axis: a time series, so its bars are not a ranking
const isPeriod = (v: unknown) => isMonth(v) || /^(\d{4}(-?Q[1-4])?|Q[1-4][ -]\d{4}|\d{4}-W\d{2})$/.test(String(v))

// Alarm Red marks a problem and nothing else: a slice or bar whose name says something went wrong.
// ponytail: a keyword list, fine for this data's categories; a column flag from the agent if it grows
const PROBLEM = /\b(late|lost|lose|losses|fail\w*|reject\w*|cancel\w*|overdue|resign\w*|penalt\w*|defect\w*)\b/i
const neutrals = [colors.series, colors.series4, colors.bar, colors.ink]
const valueLabel = { color: colors.ink, fontFamily: fontMono, fontSize: 11 }

// How one table cell reads: value columns in the chart's format, months as on the axis, other numbers rounded.
export function formatCell(spec: ChartSpec, column: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined) return NONE
  if (typeof value === 'number') return spec.y.includes(column) ? cellFormats[formatOf(spec)](value) : formats.number(value)
  return isMonth(value) ? monthLabel(value) : value
}

// Returns a reason the spec cannot be drawn, or null if it is fine. The UI shows a table instead when this is not null.
export function checkSpec(spec: ChartSpec): string | null {
  if (!['line', 'bar', 'hbar', 'donut'].includes(spec.type)) return `unknown chart type "${spec.type}"`
  if (!spec.rows.length) return 'the query returned no rows'
  if (spec.rows.length > 200) return 'too many rows to chart'
  if (!spec.y.length) return 'no value column was given'
  const columns = Object.keys(spec.rows[0])
  for (const c of [spec.x, ...spec.y]) if (!columns.includes(c)) return `column "${c}" is not in the data`
  for (const c of spec.y) if (spec.rows.some((r) => typeof r[c] !== 'number')) return `column "${c}" is not numeric`
  if (spec.type === 'donut' && (spec.y.length !== 1 || spec.rows.length > 8)) return 'a donut needs one value column and at most 8 slices'
  return null
}

export function specToOption(spec: ChartSpec): EChartsCoreOption {
  const fmt = formats[formatOf(spec)]
  const months = spec.rows.every((r) => isMonth(r[spec.x]))
  const labels = spec.rows.map((r) => (months ? monthLabel(String(r[spec.x])) : String(r[spec.x])))
  const valueFormatter = (v: unknown) => fmt(Number(v))

  if (spec.type === 'donut') return donutOption(spec, labels, valueFormatter)

  const horizontal = spec.type === 'hbar'
  const multi = spec.y.length > 1
  const line = spec.type === 'line'
  // one series of up to 12 bars prints its values; a ranking (not a time series) shows its leader in Signal Blue
  const printed = !line && !multi && spec.rows.length <= 12
  const ranked = !line && !multi && !spec.rows.every((r) => isPeriod(r[spec.x]))
  // a measure where more is worse ("lost_pct", "late_orders", "penalties"): its leader is the biggest problem, so red
  const worseIsMore = PROBLEM.test(spec.y[0].replace(/_/g, ' '))
  const top = Math.max(...spec.rows.map((r) => Number(r[spec.y[0]])))
  // room for the longest category name beside horizontal bars (11px mono is about 6.7px a character)
  const longest = Math.max(...labels.map((l) => l.length))
  // Two series on very different scales (on-time % 0-100 beside resignations 0-3) would flatten the small one:
  // it gets its own axis on the right instead, in plain numbers.
  const peak = (col: string) => Math.max(...spec.rows.map((r) => Math.abs(Number(r[col])) || 0))
  const peaks = spec.y.map(peak)
  const small = peaks.indexOf(Math.min(...peaks))
  const dual = !horizontal && spec.y.length === 2 && peaks[small] > 0 && Math.max(...peaks) / peaks[small] > 5
  const categoryAxis = {
    type: 'category',
    data: labels,
    inverse: horizontal, // first row on top
    boundaryGap: spec.type !== 'line',
    axisLabel: { ...axisText, hideOverlap: true, ...(months && !horizontal ? { interval: autoInterval(labels.length, 6) } : {}) },
    axisLine: { lineStyle: { color: colors.line } },
    axisTick: { show: false },
  }
  const numberAxis = valueAxis(axisFormats[formatOf(spec)])
  const rightAxis = valueAxis(formats.number, { position: 'right', splitLine: { show: false } })

  return {
    grid: {
      left: horizontal ? Math.min(180, 20 + longest * 6.7) : 52,
      right: horizontal && printed ? 64 : dual ? 44 : 16,
      top: multi ? 32 : printed && !horizontal ? 24 : 12,
      bottom: 28,
    },
    tooltip: { ...tooltip, valueFormatter },
    legend: multi
      ? { top: 0, icon: 'roundRect', itemWidth: 14, itemHeight: 4, textStyle: { color: colors.muted, fontFamily: fontMono, fontSize: 11 } }
      : undefined,
    xAxis: horizontal ? numberAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : dual ? [numberAxis, rightAxis] : numberAxis,
    series: spec.y.map((col, i) => ({
      name: seriesName(col),
      ...(dual && i === small && { yAxisIndex: 1, tooltip: { valueFormatter: (v: unknown) => formats.number(Number(v)) } }),
      type: line ? 'line' : 'bar',
      color: palette[i % palette.length],
      data: spec.rows.map((r, j) =>
        ranked ? { value: r[col], itemStyle: { color: barColor(labels[j], Number(r[col]) === top, worseIsMore) } } : r[col],
      ),
      ...(line
        ? {
            showSymbol: spec.rows.length <= 1,
            lineStyle: { width: 2.5, type: lineTypes[i % lineTypes.length] },
            ...(!multi && { areaStyle: { color: colors.accent, opacity: 0.08 } }), // the dashboard's main-series fill
          }
        : {
            barMaxWidth: 34,
            itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
            label: { show: printed, position: horizontal ? 'right' : 'top', formatter: (p: { value: unknown }) => fmt(Number(p.value)), ...valueLabel },
          }),
    })),
  }
}

// "ontime_pct" -> "ontime %": column names read as words in the legend and tooltip
const seriesName = (col: string) => col.replace(/_/g, ' ').replace(/\bpct\b/i, '%')

// First-in-Rank: the leader is Signal Blue, a problem is Alarm Red, everything else is Bar Grey with its value printed
const barColor = (name: string, leader: boolean, worseIsMore: boolean) =>
  PROBLEM.test(name) ? colors.alert : leader ? (worseIsMore ? colors.alert : colors.accent) : colors.bar

// A donut reads as one big number: the largest slice's share sits in the hole, the other slices are labelled
// outside with their share, largest first and clockwise from the top.
function donutOption(spec: ChartSpec, labels: string[], valueFormatter: (v: unknown) => string): EChartsCoreOption {
  const slices = spec.rows
    .map((r, i) => ({ name: labels[i], value: Number(r[spec.y[0]]) }))
    .sort((a, b) => b.value - a.value)
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const lead = slices.findIndex((s) => !PROBLEM.test(s.name)) // the largest slice that is not a problem gets the accent
  let n = 0
  const color = (s: { name: string }, i: number) => (PROBLEM.test(s.name) ? colors.alert : i === lead ? colors.accent : neutrals[n++ % neutrals.length])
  const share = (v: number) => (total > 0 ? `${((v / total) * 100).toFixed(1)}%` : NONE)

  return {
    tooltip: { ...tooltip, trigger: 'item', valueFormatter },
    series: [
      {
        type: 'pie',
        radius: ['54%', '78%'],
        startAngle: 90,
        percentPrecision: 1,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: colors.panel, borderWidth: 3 },
        label: { show: true, position: 'outside', formatter: '{b}\n{d}%', lineHeight: 15, ...valueLabel, color: colors.muted },
        labelLine: { length: 8, length2: 10, lineStyle: { color: colors.line } },
        emphasis: { scale: false },
        data: slices.map((s, i) => ({
          ...s,
          itemStyle: { color: color(s, i) },
          // the biggest slice is named in the hole instead of outside
          ...(i === 0 && {
            label: {
              position: 'center',
              formatter: `{v|${share(s.value)}}\n{n|${s.name}}`,
              rich: {
                v: { fontFamily: "'Hanken Grotesk', system-ui, sans-serif", fontSize: 28, fontWeight: 700, color: colors.ink, lineHeight: 34 },
                n: { fontFamily: fontMono, fontSize: 11, color: colors.muted, lineHeight: 16, width: 96, overflow: 'truncate', align: 'center' },
              },
            },
            labelLine: { show: false },
          }),
        })),
      },
    ],
  }
}
