import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ForesightImage } from "."
import useForesight from "../../hooks/useForesight"

interface ForesightImageButtonProps {
  image: ForesightImage
  setSelectedImage: React.Dispatch<React.SetStateAction<ForesightImage | null>>
}

const imageQueryOptions = (url: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["image", url],
    queryFn: async () => {
      const response = await fetch(url)
      const blob = await response.blob()
      await new Promise(resolve => setTimeout(resolve, 500))
      return blob
    },
    staleTime: 2000,
    enabled: enabled,
  })

export function ForesightImageButton({ image, setSelectedImage }: ForesightImageButtonProps) {
  const queryClient = useQueryClient()
  const { data, isFetching, isStale, isRefetching } = useQuery(imageQueryOptions(image.url, false))

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: async () => {
      await queryClient.prefetchQuery(imageQueryOptions(image.url, true))
    },
    reactivateAfter: 2000,
    name: image.name,
  })

  const handleOnClick = async () => {
    const result = await queryClient.ensureQueryData(imageQueryOptions(image.url, true))
    if (result) {
      setSelectedImage({
        ...image,
        blob: result,
      })
    }
  }

  const getStatusDisplay = () => {
    if (isRefetching) {
      return <div className="text-xs text-purple-500">Data is refetching</div>
    }
    if (isFetching) {
      return <div className="text-xs text-blue-500">Data is fetching</div>
    }
    if (isStale) {
      return <div className="text-xs text-orange-500">Data is stale</div>
    }
    if (data) {
      return <div className="text-xs text-green-500">Data is fetched</div>
    }
    return null
  }

  return (
    <>
      <button
        ref={elementRef}
        onClick={handleOnClick}
        className="p-4 rounded-lg border-2 transition-all duration-200 h-50 text-left hover:shadow-md cursor-pointer"
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{image.name}</h3>
          <p className="text-sm text-gray-600">{image.description}</p>
          <div className="text-xs text-gray-400">ID: {image.id}</div>
          {getStatusDisplay()}
        </div>
      </button>
      <button
        className="size-5 bg-amber-900"
        onClick={() => {
          console.log({ data, isFetching, isRefetching, isStale })
        }}
      ></button>
    </>
  )
}
