export type Filters = { from?: string; to?: string; productType?: string }

// Errors say what happened and what to do, in words a manager understands; the raw status stays in brackets.
export function describeHttpError(status: number): string {
  if (status === 422) return 'The server rejected these filter values. Try a different range.'
  // 502-504 come from the proxy in front of the backend: it could not reach the data server at all
  if (status >= 502 && status <= 504) return `Can't reach the data server (${status}). Check that the backend is running, then try again.`
  if (status >= 500) return `The data server hit a problem (${status}). Try again in a moment.`
  return `The request failed (${status}).`
}

export const OFFLINE = "Can't reach the data server. Check that the backend is running, then try again."

export async function getJson<T>(path: string, params: Filters = {}): Promise<T> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
  let res: Response
  try {
    res = await fetch(`/api/${path}${qs.size ? `?${qs}` : ''}`)
  } catch {
    throw new Error(OFFLINE)
  }
  if (!res.ok) throw new Error(describeHttpError(res.status))
  return res.json()
}
