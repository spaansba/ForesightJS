import { useQueryClient } from "@tanstack/react-query"
import type { ForesightImage } from "."
import useForesight from "../../hooks/useForesight"

interface ForesightImageButtonProps {
  image: ForesightImage
  onImageClick: (image: ForesightImage, blob: Blob | null) => void
}

export function ForesightImageButton({ image, onImageClick }: ForesightImageButtonProps) {
  const queryClient = useQueryClient()

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: async () => {
      queryClient.prefetchQuery({
        queryKey: ["image", image.url],
        queryFn: async () => {
          const response = await fetch(image.url)
          await new Promise(resolve => setTimeout(resolve, 1000))
          if (!response.ok) throw new Error("Failed to fetch image")
          return response.blob()
        },
        staleTime: 1000 * 60 * 5,
      })
    },
    staleTime: 1000,
    name: image.name,
  })

  const handleOnClick = () => {
    // Get the cached blob data
    const cachedBlob = queryClient.getQueryData<Blob>(["image", image.url])
    onImageClick(image, cachedBlob || null)
  }

  return (
    <button
      ref={elementRef}
      onClick={handleOnClick}
      className="p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md"
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{image.name}</h3>
        <p className="text-sm text-gray-600">{image.description}</p>
        <div className="text-xs text-gray-400">ID: {image.id}</div>
      </div>
    </button>
  )
}
