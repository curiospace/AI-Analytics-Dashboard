import { KpiStrip } from './components/KpiStrip'
import { DashboardGrid } from './components/DashboardGrid'
import { FilterBar } from './components/FilterBar'
import { SignalsPanel } from './components/SignalsPanel'
import { AskButton } from './components/AskButton'
import { lazy, Suspense } from 'react'
import { Boundary } from './components/Boundary'
import { useChat } from './lib/chat'
import { useMediaQuery } from './lib/useMediaQuery'
import { useFilters } from './lib/filters'

// loaded the first time the chat opens, not with the dashboard
const ChatDrawer = lazy(() => import('./components/chat/ChatDrawer').then((m) => ({ default: m.ChatDrawer })))

export default function App() {
  const { meta, rangeLabel } = useFilters()
  const { open } = useChat()
  // on narrow screens the chat covers the page: the page behind it is taken out of reach for keyboard and screen readers
  const narrow = useMediaQuery('(max-width: 1023.98px)')
  const covered = open && narrow

  return (
    <div className="flex min-h-screen">
      {/* @container: the grids below respond to this column's width, so the same rules cover a phone,
          a tablet and a desktop with the chat open beside the page */}
      <main inert={covered} className="@container min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
          <div className="flex items-start gap-3">
            {/* one page, so no navigation: the brand mark sits with the title */}
            <div
              role="img"
              aria-label="Modern Furniture Co."
              className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-mark bg-ink text-sm font-bold text-white"
            >
              M
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Operations overview</h1>
              <p className="text-muted">
                {rangeLabel}
                {meta?.partial_last_month && ' · latest month is partial'}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            <FilterBar />
            <AskButton />
          </div>
        </header>

        <Boundary name="Key figures">
          <KpiStrip />
        </Boundary>

        <div className="mt-4">
          <Boundary name="Signals">
            <SignalsPanel />
          </Boundary>
        </div>

        {/* the charts and ranked panels, plus charts pinned from the chat, in the order the manager arranged */}
        <DashboardGrid />
      </main>
      {open && (
        <Boundary name="Ask the data">
          <Suspense
            fallback={
              <aside className="fixed inset-0 z-20 grid place-items-center border-l border-line bg-panel text-sm text-muted lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-drawer lg:flex-none">
                Opening the chat…
              </aside>
            }
          >
            <ChatDrawer />
          </Suspense>
        </Boundary>
      )}
    </div>
  )
}
