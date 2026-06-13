export type ForesightImage = {
  id: string
  name: string
  url: string
  secondUrl: string
  blob?: Blob
}

export const IMAGES: ForesightImage[] = [
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
