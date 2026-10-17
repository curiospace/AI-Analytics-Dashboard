import type { ChartSpec } from '../../lib/chatTypes'
import { useDashboard } from '../../lib/dashboard'
import { secondaryButton } from '../buttons'
import { SpecView } from './SpecView'

// A chart the agent drew, in the chat. "Pin to dashboard" keeps a copy of it as a dashboard panel.
export function ChartCard({ spec }: { spec: ChartSpec }) {
  return (
    <div className="overflow-hidden rounded-panel border border-line">
      <div className="flex flex-col gap-0.5 px-4 pb-1.5 pt-3.5">
        <div className="text-sm font-bold">{spec.title}</div>
        <div className="eyebrow">{spec.rows.length} rows</div>
      </div>
      <SpecView
        spec={spec}
        height={spec.type === 'donut' ? 230 : 220}
        bodyClass="px-3 pb-2"
        barClass="border-t border-line px-3 py-2.5"
        actions={<PinButton spec={spec} />}
      />
    </div>
  )
}

function PinButton({ spec }: { spec: ChartSpec }) {
  const { pin, unpin, pinnedId } = useDashboard()
  const id = pinnedId(spec)
  return (
    <button
      type="button"
      aria-pressed={!!id}
      onClick={() => (id ? unpin(id) : pin(spec))}
      className={`${secondaryButton} ml-auto inline-flex items-center gap-1.5 aria-pressed:border-accent aria-pressed:text-accent`}
    >
      {id ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z" /></svg>
      )}
      {id ? 'Pinned' : 'Pin to dashboard'}
    </button>
  )
}
