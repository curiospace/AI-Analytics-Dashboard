import type { EChartsCoreOption } from 'echarts/core'
import { monthLabel } from './format'
import { colors, fontMono } from './theme'

// Builds a chart option once per data array and reuses it on every later render.
export function memoByData<T extends object, R>(build: (data: T) => R): (data: T) => R {
  const cache = new WeakMap<T, R>()
  return (data) => {
    let option = cache.get(data)
    if (option === undefined) {
      option = build(data)
      cache.set(data, option)
    }
    return option
  }
}

export const axisText = { color: colors.muted, fontFamily: fontMono, fontSize: 11 } // --text-meta: the size floor

export const tooltip = {
  trigger: 'axis',
  backgroundColor: colors.panel,
  borderColor: colors.line,
  textStyle: { color: colors.ink, fontFamily: fontMono, fontSize: 12 },
}

// show at most `maxLabels` month labels, however many months there are (interval 2 = every 3rd)
export const autoInterval = (count: number, maxLabels: number) => Math.max(0, Math.ceil(count / maxLabels) - 1)

// x axis whose labels are months ("2025-03" -> "Mar 25"); labelInterval 2 = every 3rd label
export const monthAxis = (months: string[], labelInterval: number, boundaryGap = false, extra = {}) => ({
  type: 'category',
  boundaryGap,
  data: months.map(monthLabel),
  axisLabel: { ...axisText, interval: labelInterval, hideOverlap: true }, // narrow charts drop colliding labels
  axisLine: { lineStyle: { color: colors.line } },
  axisTick: { show: false },
  ...extra,
})

export const valueAxis = (formatter?: (v: number) => string, extra = {}) => ({
  type: 'value',
  axisLabel: { ...axisText, formatter },
  splitLine: { lineStyle: { color: colors.track } },
  ...extra,
})

export type LineSeries = { name: string; data: number[]; color: string; dashed?: boolean; area?: boolean }

export const lineSeries = (s: LineSeries) => ({
  name: s.name,
  type: 'line',
  data: s.data,
  showSymbol: s.data.length <= 1, // one point draws no line, so show it as a dot
  lineStyle: { width: s.dashed ? 1.75 : 2.5, type: s.dashed ? 'dashed' : 'solid', color: s.color },
  itemStyle: { color: s.color },
  ...(s.area && { areaStyle: { color: s.color, opacity: 0.08 } }),
})

type LineOptionInput = {
  months: string[]
  series: LineSeries[]
  maxLabels: number
  yFormatter?: (v: number) => string
  valueFormatter?: (v: unknown) => string
  gridLeft?: number
}

// a plain multi-line chart over months
export function lineOption({
  months,
  series,
  maxLabels,
  yFormatter,
  valueFormatter,
  gridLeft = 36,
}: LineOptionInput): EChartsCoreOption {
  return {
    grid: { left: gridLeft, right: 16, top: 16, bottom: 28 },
    tooltip: { ...tooltip, valueFormatter },
    xAxis: monthAxis(months, autoInterval(months.length, maxLabels)),
    yAxis: valueAxis(yFormatter),
    series: series.map(lineSeries),
  }
}
