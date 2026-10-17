import { useChat } from '../lib/chat'

export function AskButton() {
  const { open, setOpen } = useChat()
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-pressed={open}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control sm:w-auto bg-accent px-4.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-deep"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
      Ask the data
    </button>
  )
}
