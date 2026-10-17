// The message format shared by the UI and (later) the backend stream.

// A chart the agent asks for. It never contains made-up numbers: `rows` come from a query result.
export type ChartSpec = {
  type: 'line' | 'bar' | 'hbar' | 'donut'
  title: string
  x: string // column used for the categories / time axis
  y: string[] // numeric column(s) to plot
  format?: 'number' | 'currency' | 'percent'
  rows: Record<string, string | number | null>[]
  sql?: string // shown under "SQL" so any number can be checked
}

export type ToolStep = { label: string; done: boolean }

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  steps?: ToolStep[]
  chart?: ChartSpec
  pending?: boolean
  status?: string // what the agent is doing right now ("Writing a query"), until its answer text arrives
  error?: string // shown in red under the answer
}

// what an agent streams back while answering
export type AgentEvent =
  | { type: 'step'; label: string; done: boolean }
  | { type: 'text'; delta: string }
  | { type: 'chart'; spec: ChartSpec }
  | { type: 'error'; message: string }
  | { type: 'status'; text: string }
