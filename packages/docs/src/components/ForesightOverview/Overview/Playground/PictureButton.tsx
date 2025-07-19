// import React from "react"
// import { useQuery } from "@tanstack/react-query"
// import useForesight from "@site/src/hooks/useForesight"

// type PictureButtonProps = {
//   image: ForesightImage
// }

// function PictureButton({ image }: PictureButtonProps) {
//   const { refetch, isFetching } = useQuery({
//     queryKey: ["image", image.url],
//     queryFn: async () => {
//       const response = await fetch(image.url)
//       if (!response.ok) throw new Error("Failed to fetch image")
//       return response.blob()
//     },
//     enabled: false, // Don't auto-fetch
//     staleTime: 1000 * 60 * 5, // Cache for 5 minutes
//   })

//   const { elementRef } = useForesight<HTMLButtonElement>({
//     callback: () => refetch(),
//     reactivateAfter: 10000,
//   })
//   const handleOnClick = () => {
//     refetch()
//   }

//   return (
//     <button ref={elementRef} onClick={handleOnClick} disabled={isFetching}>
//       {isFetching ? "Loading..." : "Fetch Image"}
//     </button>
//   )
// }

// export default PictureButton
