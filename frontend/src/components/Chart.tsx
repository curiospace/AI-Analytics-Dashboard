import { useContext, useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { MIN_CHART_HEIGHT, TileFillContext } from '../lib/tileFill'

echarts.use([LineChart, BarChart, PieChart, GridComponent, LegendComponent, MarkPointComponent, TooltipComponent, CanvasRenderer])

// `label` is what a screen reader hears instead of the canvas: state the takeaway, not "a chart".
type ChartProps = { option: EChartsCoreOption; label: string; height?: number }

export function Chart({ option, label, height = 280 }: ChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)
  const drawn = useRef(false)
  const fill = useContext(TileFillContext)

  // create the chart once, keep it sized to its box, destroy it on unmount
  useEffect(() => {
    const instance = echarts.init(box.current!)
    chart.current = instance
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(box.current!)
    return () => {
      observer.disconnect()
      instance.dispose()
    }
  }, [])

  // The first draw writes each line in, left to right; every later change (a new filter) morphs the
  // existing marks to the new values, so the reader sees what changed instead of a blank redraw.
  useEffect(() => {
    if (!chart.current) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    chart.current.setOption(
      {
        animation: !still,
        animationDuration: 600,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 400,
        animationEasingUpdate: 'cubicOut',
        ...option,
      },
      { notMerge: !drawn.current },
    )
    drawn.current = true
  }, [option])

  // in a panel the manager resized, the chart takes the panel's spare height (its parents are flex columns)
  const size = fill ? { flex: '1 1 0', minHeight: MIN_CHART_HEIGHT } : { height }
  return <div ref={box} style={size} className="w-full" role="img" aria-label={label} />
}
