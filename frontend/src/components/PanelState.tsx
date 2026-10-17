import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'

type PanelStateProps<T> = {
  query: Pick<UseQueryResult<T, Error>, 'data' | 'error' | 'isPending' | 'isPlaceholderData' | 'refetch'>
  what: string // e.g. "the orders trend": used in the loading and error messages
  isEmpty?: (data: T) => boolean
  empty?: string
  children: (data: T) => ReactNode
}

// The loading, error (with retry) and empty states every data panel shares, so none of them is ever blank or broken.
export function PanelState<T>({ query, what, isEmpty, empty, children }: PanelStateProps<T>) {
  if (query.isPending) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading {what}…
      </p>
    )
  }
  if (query.error && query.data === undefined) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2.5">
        <p className="text-sm text-alert">
          Couldn't load {what}. {query.error.message}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="min-h-9 rounded-lg pointer-coarse:min-h-11 border border-control-line bg-panel px-3 text-data font-medium transition-colors duration-150 hover:bg-track"
        >
          Try again
        </button>
      </div>
    )
  }
  const data = query.data as T
  if (isEmpty?.(data)) return <p className="text-sm text-muted">{empty ?? 'No data for this selection. Try a wider date range.'}</p>
  // while a filter change loads, the previous numbers stay visible but dimmed, so they read as "about to change"
  return (
    <div className={`flex min-h-0 flex-1 flex-col transition-opacity duration-200 ${query.isPlaceholderData ? 'opacity-50' : ''}`} aria-busy={query.isPlaceholderData}>
      {children(data)}
    </div>
  )
}
