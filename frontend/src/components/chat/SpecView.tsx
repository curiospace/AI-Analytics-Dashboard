import { useMemo, useState, type ReactNode } from 'react'
import type { ChartSpec } from '../../lib/chatTypes'
import { checkSpec, specToOption } from '../../lib/specOption'
import { secondaryButton } from '../buttons'
import { Chart } from '../Chart'
import { DataTable } from './DataTable'

type SpecViewProps = {
  spec: ChartSpec
  height: number
  actions?: ReactNode // extra buttons after Table and View SQL (the chat adds "Pin to dashboard")
  bodyClass?: string
  barClass?: string
}

// An agent chart with its evidence one click away. A spec that cannot be drawn shows its data as a table
// instead of a blank box. Used in the chat and, for pinned charts, on the dashboard.
export function SpecView({ spec, height, actions, bodyClass = '', barClass = '' }: SpecViewProps) {
  const [view, setView] = useState<'chart' | 'table' | 'sql'>('chart')
  const problem = useMemo(() => checkSpec(spec), [spec])
  const option = useMemo(() => (problem ? null : specToOption(spec)), [spec, problem])
  const shown = problem ? 'table' : view

  return (
    <>
      <div className={bodyClass}>
        {problem && <p className="pb-2 text-xs text-alert">Could not draw this chart ({problem}). Showing the data instead.</p>}
        {shown === 'chart' && option && <Chart option={option} height={height} label={`${spec.title}. ${spec.rows.length} rows. Use the Table button to read the values.`} />}
        {shown === 'table' && <DataTable spec={spec} />}
        {shown === 'sql' && <pre tabIndex={0} aria-label={`SQL for ${spec.title}`} className="overflow-auto rounded-lg bg-bg p-3 font-mono text-xs">{spec.sql}</pre>}
      </div>
      <div className={`flex flex-wrap items-center gap-2 ${barClass}`}>
        {!problem && (
          <button type="button" className={secondaryButton} onClick={() => setView(view === 'table' ? 'chart' : 'table')}>
            {view === 'table' ? 'Chart' : 'Table'}
          </button>
        )}
        {spec.sql && (
          <button type="button" className={secondaryButton} onClick={() => setView(view === 'sql' ? 'chart' : 'sql')}>
            {view === 'sql' ? 'Chart' : 'View SQL'}
          </button>
        )}
        {actions}
      </div>
    </>
  )
}
