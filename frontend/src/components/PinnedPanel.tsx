import { useDashboard, type Pin } from '../lib/dashboard'
import { iconButton } from './buttons'
import { SpecView } from './chat/SpecView'
import { Panel } from './Panel'

const pinnedOn = (iso: string) => new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

// A chart pinned from the chat. It is the answer's rows as they were when pinned, so it says so:
// the date range and product filters above do not change it.
export function PinnedPanel({ pin }: { pin: Pin }) {
  const { unpin } = useDashboard()
  return (
    <Panel
      title={pin.spec.title}
      right={
        <div className="flex items-center gap-1">
          <span className="eyebrow">Pinned</span>
          <button type="button" aria-label={`Remove "${pin.spec.title}" from the dashboard`} className={iconButton} onClick={() => unpin(pin.id)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      }
    >
      <SpecView spec={pin.spec} height={pin.spec.type === 'donut' ? 260 : 250} bodyClass="flex min-h-0 flex-1 flex-col" />
      <p className="text-sm text-muted">Snapshot from the chat on {pinnedOn(pin.pinnedAt)}. The filters above do not change it.</p>
    </Panel>
  )
}
