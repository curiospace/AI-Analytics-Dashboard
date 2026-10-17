import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getJson } from './api'
import { useFilters } from './filters'

// the filters are part of the query key, so changing a filter refetches every panel
export function useApi<T>(path: string) {
  const { filters } = useFilters()
  return useQuery({
    queryKey: [path, filters],
    queryFn: () => getJson<T>(path, filters),
    placeholderData: keepPreviousData, // keep showing the old data while new data loads
  })
}
