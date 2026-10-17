import { autoInterval, memoByData, monthAxis, tooltip, valueAxis } from '../lib/chartOptions'
import { monthLabel } from '../lib/format'
import { colors, fontMono } from '../lib/theme'
import type { OnTimeRow } from '../lib/types'
import { useApi } from '../lib/useApi'
import { Chart } from './Chart'
import { Legend } from './Legend'
import { Panel } from './Panel'
import { PanelState } from './PanelState'
import { onTimeDip } from '../lib/signals'

// two stacked charts sharing one x axis: on-time % line on top, resignation bars below
const buildOption = memoByData((rows: OnTimeRow[]) => {
  const months = rows.map((r) => r.month)
  const interval = autoInterval(months.length, 8)
  const pct = rows.map((r) => (r.on_time_pct === null ? null : Math.round(r.on_time_pct * 100)))
  // mark the months where on-time fell under 50%
  const lows = pct.flatMap((v, i) => (v !== null && v < 50 ? [{ coord: [i, v], value: v, name: monthLabel(months[i]) }] : []))

  return {
    grid: [
      { left: 44, right: 16, top: 16, height: 170 },
      { left: 44, right: 16, top: 224, height: 36 },
    ],
    tooltip,
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    xAxis: [
      monthAxis(months, interval, true, { gridIndex: 0, axisLabel: { show: false } }),
      monthAxis(months, interval, true, { gridIndex: 1 }),
    ],
    yAxis: [
      valueAxis((v) => `${v}%`, { gridIndex: 0, min: 0, max: 100, interval: 50 }),
      valueAxis(undefined, { gridIndex: 1, min: 0, max: 3, show: false, splitLine: { show: false } }),
    ],
    series: [
      {
        name: 'On-time',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: pct,
        showSymbol: pct.filter((v) => v !== null).length <= 1, // one month draws no line: show a dot
        lineStyle: { width: 2.5, color: colors.accent },
        itemStyle: { color: colors.accent },
        tooltip: { valueFormatter: (v: unknown) => `${v}%` },
        markPoint: {
          symbol: 'circle',
          symbolSize: 10,
          itemStyle: { color: colors.panel, borderColor: colors.alert, borderWidth: 2 },
          label: {
            show: true,
            // two short lines under the point stay clear of a neighbouring marker even on a phone
            position: 'bottom',
            distance: 6,
            color: colors.alert,
            fontFamily: fontMono,
            fontSize: 11,
            lineHeight: 13,
            formatter: (p: { name?: string; value?: unknown }) => `${p.name}\n${p.value}%`,
          },
          data: lows,
        },
      },
      {
        name: 'Resignations',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: rows.map((r) => r.resignations),
        barWidth: 8,
        itemStyle: { color: colors.alert, borderRadius: [2, 2, 0, 0] },
      },
    ],
  }
})

export function OnTimePanel() {
  const query = useApi<OnTimeRow[]>('ontime-vs-resignations')
  const isEmpty = (d: OnTimeRow[]) => d.every((r) => r.on_time_pct === null)
  const drawn = query.data !== undefined && !isEmpty(query.data)

  return (
    <Panel
      title="On-time delivery vs resignations"
      right={drawn && <Legend items={[{ label: 'On-time %', color: colors.accent }, { label: 'Resignations', color: colors.alert }]} />}
    >
      <PanelState
        query={query}
        what="on-time delivery"
        isEmpty={isEmpty}
        empty="No orders were delivered in this range."
      >
        {(data) => {
          const resigned = data.reduce((sum, r) => sum + r.resignations, 0)
          const label = `On-time delivery by month, with resignations below. ${onTimeDip(data)?.text ?? ''} ${resigned} resignation${resigned === 1 ? '' : 's'} in this range.`
          return (
            <>
              <Chart option={buildOption(data)} height={280} label={label} />
              <p className="text-sm text-muted">Ringed points: months under 50% on time.</p>
            </>
          )
        }}
      </PanelState>
    </Panel>
  )
}
