import { useQuery } from '@tanstack/react-query'
import { getPublicBusiness } from '../api/public'
import { keys } from '../api/queryKeys'
import { PublicBusinessRenderer } from '../features/public-page/PublicBusinessRenderer'
import { PublicPageSkeleton } from '../features/public-page/PublicPageSkeleton'
import { TenantNotFound } from './TenantGate'

type TenantPublicPageProps = {
  subdomain: string
}

export default function TenantPublicPage({ subdomain }: TenantPublicPageProps) {
  const { data: business, isLoading, isError } = useQuery({
    queryKey: keys.public(subdomain),
    queryFn: () => getPublicBusiness(subdomain),
    retry: false,
  })

  if (isLoading) {
    return <PublicPageSkeleton />
  }

  if (isError || !business) {
    return <TenantNotFound />
  }

  return <PublicBusinessRenderer business={business} />
}
