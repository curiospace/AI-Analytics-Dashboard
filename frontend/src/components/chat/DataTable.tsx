import type { ChartSpec } from '../../lib/chatTypes'
import { formatCell } from '../../lib/specOption'

export function DataTable({ spec }: { spec: ChartSpec }) {
  const { rows } = spec
  const columns = Object.keys(rows[0] ?? {})
  // numbers line up on the right, in equal-width digits, so a column can be compared at a glance
  const numeric = new Set(columns.filter((c) => rows.some((r) => typeof r[c] === 'number') && rows.every((r) => r[c] === null || typeof r[c] === 'number')))
  const align = (c: string) => (numeric.has(c) ? 'text-right tabular-nums' : '')

  return (
    // focusable so a keyboard can scroll a long table in every browser
    <div tabIndex={0} role="region" aria-label={`${spec.title}: data table`} className="max-h-64 overflow-auto rounded-lg border border-line">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-panel-2 font-mono uppercase text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className={`px-3 py-2 font-medium ${align(c)}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {columns.map((c) => (
                <td key={c} className={`px-3 py-1.5 font-mono ${align(c)}`}>{formatCell(spec, c, r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
