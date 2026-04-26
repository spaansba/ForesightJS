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

  const { elementRef, state } = useForesight<HTMLButtonElement>({
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

  const isPredicted = state?.isPredicted ?? false

  return (
    <button
      ref={elementRef}
      onClick={handleOnClick}
      className={`p-4 border bg-white text-left h-60 cursor-pointer ${
        isPredicted ? "border-amber-500 outline outline-2 outline-amber-500" : "border-gray-300"
      }`}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{image.name}</h3>
        <div className="text-xs text-gray-500">id: {image.id}</div>
        <dl className="text-xs font-mono divide-y divide-gray-200 border-y border-gray-200">
          <Row label="fetching" value={isFetching.toString()} on={isFetching} />
          <Row label="refetching" value={isRefetching.toString()} on={isRefetching} />
          <Row label="stale" value={isStale.toString()} on={isStale} />
          <Row label="hasData" value={(!!data).toString()} on={!!data} />
          <Row label="fromUrl" value={data?.fromUrl ?? "none"} on={!!data} />
        </dl>
        <dl className="text-xs font-mono divide-y divide-gray-200 border-y border-gray-200">
          <Row label="hits" value={state?.hitCount ?? 0} />
          <Row
            label="predicted"
            value={state?.isPredicted ? "yes" : "no"}
            on={state?.isPredicted}
          />
          <Row
            label="cb running"
            value={state?.isCallbackRunning ? "yes" : "no"}
            on={state?.isCallbackRunning}
          />
          <Row label="status" value={state?.status ?? "—"} />
        </dl>
        <details className="text-xs font-mono">
          <summary className="cursor-pointer text-gray-500 select-none">full state</summary>
          <pre className="mt-1 overflow-auto max-h-40 text-[10px] text-gray-700">
            {state ? JSON.stringify(state, null, 2) : "null"}
          </pre>
        </details>
      </div>
    </button>
  )
}

function Row({ label, value, on }: { label: string; value: React.ReactNode; on?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <dt className="text-gray-500">{label}</dt>
      <dd className={on ? "text-gray-900" : "text-gray-400"}>{value}</dd>
    </div>
  )
}
