import { useQuery } from "@tanstack/react-query"
import type { ForesightImage } from "."
import useForesight from "../../hooks/useForesight"
import { useEffect } from "react"
interface ForesightImageButtonProps {
  image: ForesightImage
  setSelectedImage: (image: Blob) => void
}

export function ForesightImageButton({ image, setSelectedImage }: ForesightImageButtonProps) {
  console.log("imagebutton")
  const { data, refetch } = useQuery({
    queryKey: ["image", image.url],
    queryFn: async () => {
      const response = await fetch(image.url)
      if (!response.ok) throw new Error("Failed to fetch image")
      return response.blob()
    },
    enabled: false, // Don't auto-fetch
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: () => refetch(),
    staleTime: 1000,
  })
  const handleOnClick = () => {
    refetch()
  }

  useEffect(() => {
    if (data) {
      setSelectedImage(data)
    }
  }, [data, setSelectedImage])
  return (
    <button
      ref={elementRef}
      onClick={handleOnClick}
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 text-left

      `}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{image.name}</h3>
        <p className="text-sm text-gray-600">{image.description}</p>
        <div className="text-xs text-gray-400">ID: {image.id}</div>
      </div>
    </button>
  )
}
