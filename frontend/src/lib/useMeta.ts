import { useQuery } from '@tanstack/react-query'
import { getJson } from './api'
import type { Meta } from './types'

// what exists in the data right now: first and last date, products. Refetched on window focus.
export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: () => getJson<Meta>('meta') })
}
