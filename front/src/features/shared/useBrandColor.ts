import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBrandColor, updateBrandColor, type BrandColorState } from '../../api/dashboard'
import { keys } from '../../api/queryKeys'

type UseBrandColorOptions = {
  enabled?: boolean
}

export function useBrandColor(options: UseBrandColorOptions = {}) {
  const { enabled = true } = options
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: keys.dashboard.brandColor,
    queryFn: getBrandColor,
    enabled,
    placeholderData: (previous) => previous,
  })

  const mutation = useMutation({
    mutationFn: updateBrandColor,
    onMutate: async (brandColor) => {
      await qc.cancelQueries({ queryKey: keys.dashboard.brandColor })
      const previous = qc.getQueryData<BrandColorState>(keys.dashboard.brandColor)
      if (previous) {
        const normalizedDefault = previous.default.toLowerCase()
        const effective = (brandColor ?? normalizedDefault).toLowerCase()
        qc.setQueryData<BrandColorState>(keys.dashboard.brandColor, {
          ...previous,
          current: brandColor,
          effective,
        })
      }
      return { previous }
    },
    onError: (_err, _brandColor, context) => {
      if (context?.previous) {
        qc.setQueryData(keys.dashboard.brandColor, context.previous)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.dashboard.brandColor }),
        qc.invalidateQueries({ queryKey: keys.dashboard.business }),
        qc.invalidateQueries({ queryKey: keys.auth.me }),
        qc.invalidateQueries({ queryKey: keys.qr.info }),
      ])
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
