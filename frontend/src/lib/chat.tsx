import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mockAgent, realAgent, type ChatStatus } from './agent'
import { getJson } from './api'
import type { ChatMessage, ToolStep } from './chatTypes'
import { useFilters } from './filters'

type ChatValue = {
  open: boolean
  setOpen: (open: boolean) => void
  messages: ChatMessage[]
  busy: boolean
  demo: boolean // true while the backend has no API key
  send: (text: string) => Promise<void>
  reset: () => void
}

const ChatContext = createContext<ChatValue | null>(null)

// The chat is kept in this browser, so a reload does not lose it; "New chat" clears it.
// ponytail: localStorage, one user per browser; shared or per-user history needs a backend table and a login
const CHAT_KEY = 'mfc.chat.v1'

function loadChat(): ChatMessage[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_KEY) ?? '[]')
    if (!Array.isArray(saved)) return []
    // an answer cut off by a reload is dropped rather than shown as forever "thinking"
    return saved.filter((m) => typeof m?.id === 'string' && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && !m.pending)
  } catch {
    return []
  }
}

// replace a step with the same label (running -> done), otherwise add it
const upsertStep = (steps: ToolStep[], step: ToolStep) =>
  steps.some((s) => s.label === step.label) ? steps.map((s) => (s.label === step.label ? step : s)) : [...steps, step]

export function ChatProvider({ children }: { children: ReactNode }) {
  const { filters, rangeLabel, product } = useFilters()
  const [open, setOpenState] = useState(false)
  // Remember what opened the chat before anything changes: on narrow screens the page behind becomes inert
  // in the same update, which drops focus to <body> before the drawer could see where it came from.
  const opener = useRef<HTMLElement | null>(null)
  const setOpen = useCallback((next: boolean) => {
    if (next) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpenState(next)
  }, [])
  // after closing (and after the page is interactive again) put focus back where the user was
  useEffect(() => {
    if (!open) opener.current?.focus()
  }, [open])
  const [messages, setMessages] = useState<ChatMessage[]>(loadChat)
  const [busy, setBusy] = useState(false)
  // save once an answer has finished, not on every streamed word
  useEffect(() => {
    if (busy) return
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)))
    } catch {
      // private mode or full storage: the chat still works, it just is not remembered
    }
  }, [messages, busy])
  const messagesRef = useRef(messages) // the latest chat, readable inside send without re-creating it
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  const status = useQuery({ queryKey: ['chat-status'], queryFn: () => getJson<ChatStatus>('chat/status') })
  const controller = useRef<AbortController | null>(null) // cancels the answer in progress (New chat)
  const sending = useRef(false) // set immediately, unlike the busy state, so two quick sends cannot both start

  // Ctrl/Cmd + K toggles the chat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || sending.current) return
      sending.current = true
      const ctrl = new AbortController()
      controller.current = ctrl
      const history = messagesRef.current
      const id = crypto.randomUUID()
      setMessages((ms) => [
        ...ms,
        { id: `${id}-user`, role: 'user', text: question },
        { id, role: 'assistant', text: '', steps: [], pending: true },
      ])
      setBusy(true)
      const patch = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((ms) => ms.map((m) => (m.id === id ? fn(m) : m)))

      try {
        // ask the backend each time, so adding the key takes effect without reloading
        const configured = await getJson<ChatStatus>('chat/status').then((r) => r.configured, () => false)
        const events = configured ? realAgent(question, { filters, rangeLabel, product }, history, ctrl.signal) : mockAgent(question, { filters, rangeLabel, product })
        for await (const ev of events) {
          if (ctrl.signal.aborted) break
          if (ev.type === 'step') patch((m) => ({ ...m, steps: upsertStep(m.steps ?? [], { label: ev.label, done: ev.done }) }))
          else if (ev.type === 'text') patch((m) => ({ ...m, text: m.text + ev.delta, status: undefined }))
          else if (ev.type === 'status') patch((m) => ({ ...m, status: ev.text }))
          else if (ev.type === 'chart') patch((m) => ({ ...m, chart: ev.spec }))
          else patch((m) => ({ ...m, error: ev.message }))
        }
      } catch (e) {
        if (!ctrl.signal.aborted) patch((m) => ({ ...m, error: e instanceof Error ? e.message : 'Something went wrong. Try asking again.' }))
      } finally {
        // an answer that ended with nothing in it says so, instead of leaving a blank reply
        patch((m) => ({ ...m, pending: false, status: undefined, error: m.error ?? (!m.text.trim() && !m.chart ? 'No answer came back. Try asking again.' : undefined) }))
        sending.current = false
        setBusy(false)
      }
    },
    [filters, rangeLabel, product],
  )

  const reset = useCallback(() => {
    controller.current?.abort()
    setMessages([])
  }, [])

  return <ChatContext.Provider value={{ open, setOpen, messages, busy, demo: status.data?.configured === false, send, reset }}>{children}</ChatContext.Provider>
}

export function useChat() {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat must be used inside <ChatProvider>')
  return value
}
