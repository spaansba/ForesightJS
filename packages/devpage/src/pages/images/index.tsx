import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ForesightImageButton } from "./ForesightImageButton"
import { Link } from "react-router-dom"

const IMAGES = [
  {
    id: "mountains",
    name: "Mountains",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
    description: "Beautiful mountain landscape",
  },
  {
    id: "ocean",
    name: "Ocean",
    url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=2070&auto=format&fit=crop",
    description: "Pristine ocean waves",
  },
  {
    id: "forest",
    name: "Forest",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop",
    description: "Dense forest path",
  },
  {
    id: "city",
    name: "City",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop",
    description: "Urban cityscape at night",
  },
]

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

export default function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const queryClient = useQueryClient()

  const {
    data: imageUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["image", selectedImage],
    queryFn: () => fetchImage(selectedImage!),
    enabled: !!selectedImage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleImageClick = (imageId: string) => {
    setSelectedImage(imageId)
  }

  const handleReset = () => {
    setSelectedImage(null)
    queryClient.clear()

    // Unregister all ForesightJS elements to reset button states
    // ForesightManager.instance.unregisterAll()

    // Force re-render of buttons to trigger re-registration
    setResetKey(prev => prev + 1)

    console.log("Cache cleared, ForesightJS buttons reset, and state reset")
  }

  const selectedImageData = IMAGES.find(img => img.id === selectedImage)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/mass"
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Mass Test
              </Link>
              <button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                🔄 Reset Cache
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ForesightJS + TanStack Query Image Gallery
          </h1>
          <p className="text-gray-600">
            Hover over buttons to trigger predictive image prefetching. Click to load and display
            the image.
          </p>
        </div>

        <div key={resetKey} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {IMAGES.map(image => (
            <ForesightImageButton
              key={image.id}
              imageId={image.id}
              imageUrl={image.url}
              name={image.name}
              description={image.description}
              onClick={() => handleImageClick(image.id)}
              isSelected={selectedImage === image.id}
            />
          ))}
        </div>

        {selectedImage && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{selectedImageData?.name}</h2>

            {isLoading && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading image...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64 bg-red-50 rounded">
                <span className="text-red-600">Failed to load image</span>
              </div>
            )}

            {imageUrl && !isLoading && (
              <div className="space-y-4">
                <img
                  src={imageUrl}
                  alt={selectedImageData?.name}
                  className="w-full h-96 object-cover rounded-lg shadow-md"
                />
                <p className="text-gray-600">{selectedImageData?.description}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ForesightJS predicts when you're about to hover over a button</li>
            <li>• TanStack Query prefetches the image data before you click</li>
            <li>• Images load instantly when clicked if already prefetched</li>
            <li>• Open DevTools Network tab to see prefetch requests</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
