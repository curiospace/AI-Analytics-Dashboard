import { getJson, type Filters } from './api'
import type { AgentEvent, ChatMessage } from './chatTypes'
import { bottleneck, margin, onTimeDip, profitGap } from './signals'
import type { NameValue, OnTimeRow, ProfitRow, RevenueRow } from './types'

export type ChatContext = { filters: Filters; rangeLabel: string; product: string }

// DEMO agent: answers a few known questions from the dashboard's own endpoints.
// It streams the same events the real backend (Claude + run_sql + make_chart) will stream, so only this function changes later.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function* typeOut(text: string): AsyncGenerator<AgentEvent> {
  for (const word of text.split(' ')) {
    yield { type: 'text', delta: word + ' ' }
    await sleep(25)
  }
}

export async function* mockAgent(question: string, ctx: ChatContext): AsyncGenerator<AgentEvent> {
  const q = question.toLowerCase()

  if (/resign|on-?time|late/.test(q)) {
    yield { type: 'step', label: 'run_sql · orders_data, hr_events_log', done: false }
    const rows = await getJson<OnTimeRow[]>('ontime-vs-resignations', ctx.filters)
    yield { type: 'step', label: 'run_sql · orders_data, hr_events_log', done: true }
    yield { type: 'step', label: 'make_chart · line', done: true }
    const signal = onTimeDip(rows)
    yield* typeOut(`${signal?.text ?? 'There is no delivery data for this selection.'} That is a pattern in timing, not proof of cause.`)
    yield {
      type: 'chart',
      spec: {
        type: 'line',
        title: 'On-time delivery by month',
        x: 'month',
        y: ['on_time_pct'],
        format: 'percent',
        rows: rows.filter((r) => r.on_time_pct !== null).map((r) => ({ month: r.month, on_time_pct: r.on_time_pct })),
        sql: '-- demo: GET /api/ontime-vs-resignations',
      },
    }
  } else if (/profit/.test(q)) {
    yield { type: 'step', label: 'run_sql · orders_data, hr_roster', done: true }
    const rows = await getJson<ProfitRow[]>('profit-by-product', ctx.filters)
    yield { type: 'step', label: 'make_chart · horizontal bars', done: true }
    yield* typeOut(profitGap(rows)?.text ?? 'Only one product is selected, so there is nothing to compare.')
    yield {
      type: 'chart',
      spec: {
        type: 'hbar',
        title: 'Profit per order by product',
        x: 'product',
        y: ['avg_profit'],
        format: 'currency',
        rows: rows.map((r) => ({ product: r.name, avg_profit: r.avg_profit })),
        sql: '-- demo: GET /api/profit-by-product',
      },
    }
  } else if (/bottleneck|hours|stage|production/.test(q)) {
    yield { type: 'step', label: 'run_sql · orders_data', done: true }
    const rows = await getJson<NameValue[]>('stage-hours', ctx.filters)
    yield { type: 'step', label: 'make_chart · horizontal bars', done: true }
    yield* typeOut(bottleneck(rows)?.text ?? 'There are no delivered orders for this selection.')
    yield {
      type: 'chart',
      spec: {
        type: 'hbar',
        title: 'Average hours per order by stage',
        x: 'stage',
        y: ['hours'],
        rows: [...rows].sort((a, b) => b.value - a.value).map((r) => ({ stage: r.name, hours: r.value })),
        sql: '-- demo: GET /api/stage-hours',
      },
    }
  } else if (/revenue|cost|margin|money/.test(q)) {
    yield { type: 'step', label: 'run_sql · financial_ledger', done: true }
    const rows = await getJson<RevenueRow[]>('revenue-cost', ctx.filters)
    yield { type: 'step', label: 'make_chart · line', done: true }
    yield* typeOut(margin(rows, false)?.text ?? 'There is no ledger data for this selection.')
    yield {
      type: 'chart',
      spec: {
        type: 'line',
        title: 'Revenue and cost by month',
        x: 'month',
        y: ['revenue', 'cost'],
        format: 'currency',
        rows: rows.map((r) => ({ month: r.month, revenue: r.revenue, cost: r.cost })),
        sql: '-- demo: GET /api/revenue-cost',
      },
    }
  } else {
    yield* typeOut('This is a demo, so I can only answer a few questions for now. Try asking about resignations, profit, production hours, or revenue and cost.')
  }
}

export type ChatStatus = { configured: boolean; model: string }

// The real agent: sends the chat to the backend and yields the events it streams back.
// The stream is "data: {json}" lines separated by blank lines (server-sent events).
const MAX_MESSAGE = 4000 // the backend's per-message limit (ChatMessage.text in main.py)

export async function* realAgent(
  question: string,
  ctx: ChatContext,
  history: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<AgentEvent> {
  const messages = [
    ...history.filter((m) => m.text.trim() && !m.error && !m.pending).map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE) })),
    { role: 'user', text: question },
  ].slice(-20)

  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context: { from: ctx.filters.from, to: ctx.filters.to, product: ctx.product || undefined } }),
      signal,
    })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new Error("Can't reach the assistant. Check that the backend is running, then try again.")
  }
  if (res.status === 422) throw new Error('That question could not be sent. Keep it under 4,000 characters and try again.')
  if (!res.ok || !res.body) throw new Error(`The assistant is unavailable right now (${res.status}). Try again in a moment.`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>
    try {
      chunk = await reader.read()
    } catch (e) {
      if (signal?.aborted) throw e
      throw new Error('The connection dropped before the answer finished. Try asking again.')
    }
    if (chunk.done) break
    buffer += decoder.decode(chunk.value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? '' // the last piece may be half-received: keep it for the next read
    for (const block of blocks) {
      const line = block.split('\n').find((l) => l.startsWith('data: '))
      if (line) yield JSON.parse(line.slice(6)) as AgentEvent
    }
  }
}
