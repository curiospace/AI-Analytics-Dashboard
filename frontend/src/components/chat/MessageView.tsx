import type { ChatMessage } from '../../lib/chatTypes'
import { ChartCard } from './ChartCard'

export function MessageView({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="max-w-[80%] animate-fade-in self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-chat leading-snug text-white [overflow-wrap:anywhere]">
        {message.text}
      </div>
    )
  }

  // shown while the answer is in progress and no text is streaming: the latest status, or "Thinking" at the very start
  const working = message.pending ? (message.status ?? (!message.text && !message.steps?.length ? 'Thinking' : undefined)) : undefined

  return (
    <div className="flex animate-fade-in flex-col gap-3">
      {message.steps && message.steps.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-lg bg-bg px-3 py-2.5 font-mono text-meta text-muted">
          {message.steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2 [overflow-wrap:anywhere]">
              <span className="sr-only">{s.done ? 'Done: ' : 'Running: '}</span>
              {s.done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ok" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              ) : (
                <span className="m-0.5 h-2.5 w-2.5 rounded-full bg-accent motion-safe:animate-pulse" aria-hidden="true" />
              )}
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {message.text && <p className="whitespace-pre-wrap text-chat leading-relaxed [overflow-wrap:anywhere]">{withBold(message.text)}</p>}
      {working && (
        // the silent stretches (the model thinking, writing a query) say what is happening instead of looking stuck
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 flex-none rounded-full bg-accent motion-safe:animate-pulse" aria-hidden="true" />
          {working}…
        </p>
      )}
      {message.error && <p role="alert" className="text-chat leading-relaxed text-alert [overflow-wrap:anywhere]">{message.error}</p>}
      {message.chart && <ChartCard spec={message.chart} />}
    </div>
  )
}

// The agent is told to write plain text, but a stray **bold** should still read as bold, not as asterisks.
// Built as React elements, never as HTML, so an answer can never inject markup.
function withBold(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> : part,
  )
}
