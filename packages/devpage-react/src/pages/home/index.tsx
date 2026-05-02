import { useMemo, useState } from "react"
import { useForesights } from "@foresightjs/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { pageQueryOptions, prefetchPage } from "./api"
import { ForesightImageButton } from "./ForesightImageButton"
import { IMAGES, type ForesightImage } from "./imageTypes"
import { useReactivateAfter } from "../../stores/ButtonStateStore"

const PAGES = [
  { slug: "about", label: "About" },
  { slug: "contact", label: "Contact" },
  { slug: "pricing", label: "Pricing" },
] as const

const PageContent = ({ slug }: { slug: string }) => {
  const { data, isLoading, isFetching } = useQuery(pageQueryOptions(slug))

  if (isLoading) {
    return (
      <section className="border border-gray-300 bg-white p-6 space-y-3">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        </div>
        <p className="text-xs text-gray-400 font-mono">Loading data...</p>
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="border border-gray-300 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{data.title}</h2>
        {isFetching && <span className="text-xs text-gray-400">refetching...</span>}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{data.description}</p>
      <div className="grid grid-cols-3 gap-4">
        {data.stats.map(stat => (
          <div key={stat.label} className="border border-gray-200 p-3 space-y-1">
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className="text-sm font-medium text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 font-mono">
        fetched at {new Date(data.fetchedAt).toLocaleTimeString()}
      </p>
    </section>
  )
}

const ImageSection = () => {
  const [selectedImage, setSelectedImage] = useState<ForesightImage | null>(null)

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Images</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {IMAGES.map(image => (
          <ForesightImageButton key={image.id} image={image} setSelectedImage={setSelectedImage} />
        ))}
      </div>
      {selectedImage && (
        <div className="border border-gray-300 bg-white p-6 space-y-4">
          <h3 className="text-base font-semibold">{selectedImage.name}</h3>
          {selectedImage.blob ? (
            <img
              src={URL.createObjectURL(selectedImage.blob)}
              alt={selectedImage.name}
              className="w-full h-96 object-cover"
            />
          ) : (
            <div className="w-full h-96 bg-red-50 border border-red-300 flex items-center justify-center">
              <p className="text-red-700 text-sm">Failed to load image</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

const PageButtons = ({
  activePage,
  onSelect,
}: {
  activePage: string | null
  onSelect: (slug: string) => void
}) => {
  const queryClient = useQueryClient()
  const reactivateAfter = useReactivateAfter()

  const options = useMemo(
    () =>
      PAGES.map(({ slug }) => ({
        callback: () => prefetchPage(queryClient, slug),
        name: slug,
        hitSlop: 20 as const,
        reactivateAfter,
      })),
    [queryClient, reactivateAfter]
  )

  const results = useForesights<HTMLButtonElement>(options)

  return (
    <nav className="flex gap-3">
      {PAGES.map(({ slug, label }, i) => {
        const { elementRef, isPredicted } = results[i]
        const isActive = activePage === slug

        return (
          <button
            key={slug}
            ref={elementRef}
            onClick={() => onSelect(slug)}
            className={`px-5 py-3 border text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-400 text-gray-800 hover:bg-gray-100"
            } ${isPredicted ? "outline-1 outline-amber-500" : ""}`}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}

const Home = () => {
  const [activePage, setActivePage] = useState<string | null>(null)

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">Data prefetching</h1>
        <PageButtons activePage={activePage} onSelect={setActivePage} />
        {activePage && <PageContent slug={activePage} />}
      </section>

      <ImageSection />
    </main>
  )
}

export default Home
