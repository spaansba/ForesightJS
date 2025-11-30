import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ForesightImage } from "."
import useForesight from "../../hooks/useForesight"
interface ForesightImageButtonProps {
  image: ForesightImage
  setSelectedImage: React.Dispatch<React.SetStateAction<ForesightImage | null>>
}
const STALE_TIME = 3000
const imageQueryOptions = (
  image: ForesightImage,
  enabled: boolean,
  dataUpdatedCount: number | undefined
) =>
  queryOptions({
    queryKey: ["image", image],
    queryFn: async () => {
      if (!dataUpdatedCount) {
        dataUpdatedCount = 0
      }
      const isEven = dataUpdatedCount % 2 === 0
      const response = await fetch(isEven ? image.url : image.secondUrl)
      const blob = await response.blob()
      await new Promise(resolve => setTimeout(resolve, 400))
      return { blob, fromUrl: isEven ? "first" : "second" }
    },
    staleTime: STALE_TIME,
    enabled: enabled,
  })

export function ForesightImageButton({ image, setSelectedImage }: ForesightImageButtonProps) {
  const queryClient = useQueryClient()
  const { data, isFetching, isStale, isRefetching } = useQuery(imageQueryOptions(image, false, 0))

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: async () => {
      await queryClient.prefetchQuery(
        imageQueryOptions(image, true, queryClient.getQueryState(["image", image])?.dataUpdateCount)
      )
    },
    reactivateAfter: STALE_TIME,
    name: image.name,
  })

  const handleOnClick = async () => {
    const result = await queryClient.fetchQuery(
      imageQueryOptions(image, true, queryClient.getQueryState(["image", image])?.dataUpdateCount)
    )

    setSelectedImage({
      ...image,
      blob: result.blob,
    })
  }

  return (
    <>
      <button
        ref={elementRef}
        onClick={handleOnClick}
        className="p-4 rounded-lg border-2 transition-all duration-200 h-60 text-left hover:shadow-md cursor-pointer"
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{image.name}</h3>
          <div className="text-xs text-gray-400">ID: {image.id}</div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Fetching:</span>
              <span className={isFetching ? "text-blue-500" : "text-gray-400"}>
                {isFetching.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Refetching:</span>
              <span className={isRefetching ? "text-purple-500" : "text-gray-400"}>
                {isRefetching.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stale:</span>
              <span className={isStale ? "text-orange-500" : "text-gray-400"}>
                {isStale.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Has Data:</span>
              <span className={data ? "text-green-500" : "text-gray-400"}>
                {(!!data).toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>From URL:</span>
              <span className={data ? "text-indigo-500" : "text-gray-400"}>
                {data?.fromUrl || "none"}
              </span>
            </div>
          </div>
        </div>
      </button>
    </>
  )
}
