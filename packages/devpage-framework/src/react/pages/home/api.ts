import { queryOptions, type QueryClient } from "@tanstack/react-query"

type PageData = {
  title: string
  description: string
  stats: { label: string; value: string }[]
  fetchedAt: number
}

const fetchPageData = async (slug: string): Promise<PageData> => {
  const res = await fetch(`/api/${slug}.json`)

  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${slug} (${res.status})`)
  }

  const data = await res.json()

  return { ...data, fetchedAt: Date.now() }
}

export const pageQueryOptions = (slug: string) => {
  return queryOptions({
    queryKey: ["page", slug],
    queryFn: () => fetchPageData(slug),
  })
}

export const prefetchPage = (queryClient: QueryClient, slug: string) => {
  return queryClient.prefetchQuery(pageQueryOptions(slug))
}
