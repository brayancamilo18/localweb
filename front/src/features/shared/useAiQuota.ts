import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAiQuota, type AiQuota } from '../../api/ai'

const QUOTA_KEY = ['ai', 'quota'] as const

export function useAiQuota() {
  return useQuery<AiQuota>({
    queryKey: QUOTA_KEY,
    queryFn: getAiQuota,
    staleTime: 30_000,
    retry: false,
  })
}

export function useInvalidateAiQuota() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: QUOTA_KEY })
}
