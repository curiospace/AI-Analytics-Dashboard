import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useChat } from '../../lib/chat'
import { useFilters } from '../../lib/filters'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { MessageView } from './MessageView'

const starters = [
  { q: 'What is our biggest production bottleneck?', tag: 'HOURS · ORDERS' },
  { q: 'Did resignations hurt on-time delivery?', tag: 'HR EVENTS · ORDERS' },
  { q: 'Which product type is most profitable?', tag: 'ORDERS · WAGES' },
  { q: 'How do revenue and cost compare?', tag: 'LEDGER' },
]

const MAX_LENGTH = 4000 // the backend rejects longer messages
const iconButton = 'grid h-11 w-11 place-items-center rounded-control text-muted transition-colors duration-150 hover:bg-track'

export function ChatDrawer() {
  const { setOpen, messages, busy, demo, send, reset } = useChat()
  const { rangeLabel, product } = useFilters()
  // below 1024px the chat covers the page, so it behaves as a modal dialog there
  const narrow = useMediaQuery('(max-width: 1023.98px)')
  const [draft, setDraft] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // focus the question box on open (the chat provider returns focus to the opener on close)
  useEffect(() => {
    input.current?.focus()
  }, [])

  // while the chat covers the page, the page behind it must not scroll
  useEffect(() => {
    if (!narrow) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [narrow])

  // keep the newest message in view as the answer streams in. Scroll only the message list:
  // scrollIntoView would also scroll the page, yanking the dashboard each time an answer arrives
  useEffect(() => {
    const list = scroller.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || busy) return
    void send(draft)
    setDraft('')
  }

  // screen readers hear each answer once, when it is finished, not every streamed word
  const last = messages[messages.length - 1]
  const announcement =
    last?.role !== 'assistant'
      ? ''
      : last.pending
        ? 'Working on your question.'
        : `${last.error ?? last.text}${last.chart ? ' A chart is shown below the answer.' : ''}`

  return (
    <aside
      className="fixed inset-0 z-20 flex animate-fade-in flex-col border-l border-line bg-panel motion-safe:animate-drawer-in lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-drawer lg:flex-none"
      role={narrow ? 'dialog' : 'complementary'}
      aria-modal={narrow || undefined}
      aria-labelledby="chat-title"
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-mark bg-ink text-white" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
          </div>
          <div>
            <h2 id="chat-title" className="text-base font-bold leading-tight">Ask the data</h2>
            <div className="eyebrow">7 tables · simulator data</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="New chat" className={iconButton} onClick={reset}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" aria-label="Close chat" className={iconButton} onClick={() => setOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2.5 border-b border-line bg-panel-2 px-5 py-2.5 font-mono text-meta text-muted">
        <span className="font-medium text-accent">CONTEXT</span>
        <span className="[overflow-wrap:anywhere]">Overview · {rangeLabel} · {product || 'All products'}</span>
      </div>

      {/* relative: the list is the containing block of the steps' sr-only labels, so it clips them. Without it
          they escape to their spot deep in the conversation and stretch the page below the dashboard */}
      <div ref={scroller} className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-5 pt-3">
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold leading-tight tracking-tight">What do you want to know?</div>
              <p className="text-chat leading-relaxed text-muted">Ask in plain English. I'll query the data, show the numbers, and draw a chart when it helps.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="eyebrow" id="starters-title">Try asking</div>
              {starters.map((s) => (
                <button
                  key={s.q}
                  type="button"
                  onClick={() => void send(s.q)}
                  disabled={busy}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5 text-left transition-colors duration-150 hover:bg-panel-2 disabled:opacity-40"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-chat font-semibold">{s.q}</span>
                    <span className="eyebrow">{s.tag}</span>
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-accent" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageView key={m.id} message={m} />)
        )}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2.5 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3.5">
        <div className="flex items-center gap-2 rounded-panel border border-control-line py-1.5 pl-4 pr-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <input
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder={messages.length ? 'Ask a follow-up' : 'Ask about orders, costs, staff…'}
            aria-label="Ask a question"
            aria-describedby="chat-hint"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-chat"
          />
          <button
            type="submit"
            aria-label={busy ? 'Answering, please wait' : 'Send'}
            disabled={busy || !draft.trim()}
            className="grid h-11 w-11 flex-none place-items-center rounded-control bg-accent text-white transition-opacity duration-150 disabled:opacity-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
        <p id="chat-hint" className="text-xs leading-snug text-muted">
          {draft.length > MAX_LENGTH - 500 && <span className="text-ink">{(MAX_LENGTH - draft.length).toLocaleString('en-US')} characters left. </span>}
          {demo
            ? 'Demo mode: no API key is set, so answers come from a few built-in questions. Press Esc to close.'
            : 'Answers come from SQL run on your data. Open View SQL to check any number. Press Esc to close.'}
        </p>
      </form>
    </aside>
  )
}
