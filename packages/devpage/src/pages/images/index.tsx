import { useState } from "react"
import { ForesightDevtools } from "js.foresight-devtools"
import { ForesightImageButton } from "./ForesightImageButton"
import { SimpleNavigation } from "../../components/SimpleNavigation"
export type ForesightImage = {
  id: string
  name: string
  url: string
  secondUrl: string
  blob?: Blob
}

const IMAGES: ForesightImage[] = [
  {
    id: "mountains",
    name: "Mountains",
    url: "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
  {
    id: "ocean",
    name: "Ocean",
    url: "https://images.pexels.com/photos/416676/pexels-photo-416676.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
  {
    id: "forest",
    name: "Forest",
    url: "https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
  {
    id: "city",
    name: "City",
    url: "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    secondUrl:
      "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  },
]

export default function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState<ForesightImage | null>(null)
  ForesightDevtools.initialize()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      <SimpleNavigation />
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {IMAGES.map(image => (
            <ForesightImageButton
              key={image.id}
              image={image}
              setSelectedImage={setSelectedImage}
            />
          ))}
        </div>
        {selectedImage && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">{selectedImage.name}</h2>
              {selectedImage.blob ? (
                <img
                  src={URL.createObjectURL(selectedImage.blob)}
                  alt={selectedImage.name}
                  className="w-full h-96 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-96 bg-red-100 rounded-lg shadow-md flex items-center justify-center">
                  <p className="text-red-600">Failed to load image</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
