import { useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ForesightManager } from "js.foresight"

interface ForesightImageButtonProps {
  imageId: string
  imageUrl: string
  name: string
  description: string
  onClick: () => void
  isSelected: boolean
}

async function fetchImage(url: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

export function ForesightImageButton({
  imageId,
  imageUrl,
  name,
  description,
  onClick,
  isSelected
}: ForesightImageButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!buttonRef.current) return

    const { unregister } = ForesightManager.instance.register({
      element: buttonRef.current,
      callback: async () => {
        // Check if image is already cached
        const cachedData = queryClient.getQueryData(["image", imageId])
        if (cachedData) {
          console.log(`Image ${imageId} already cached, skipping prefetch`)
          return
        }

        console.log(`Prefetching image: ${imageId}`)
        
        try {
          // Prefetch the image
          await queryClient.prefetchQuery({
            queryKey: ["image", imageId],
            queryFn: () => fetchImage(imageUrl),
            staleTime: 5 * 60 * 1000, // 5 minutes
          })
          
          console.log(`Successfully prefetched image: ${imageId}`)
        } catch (error) {
          console.error(`Failed to prefetch image ${imageId}:`, error)
        }
      },
      hitSlop: {
        top: 15,
        bottom: 15,
        left: 15,
        right: 15,
      },
      name: `image-button-${imageId}`,
    })

    return unregister
  }, [imageId, imageUrl, queryClient])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 text-left
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="text-xs text-gray-400">
          ID: {imageId}
        </div>
      </div>
    </button>
  )
}