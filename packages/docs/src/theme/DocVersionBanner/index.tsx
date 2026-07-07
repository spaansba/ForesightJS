import React from "react"
import DocVersionBanner from "@theme-original/DocVersionBanner"
import type DocVersionBannerType from "@theme/DocVersionBanner"
import type { WrapperProps } from "@docusaurus/types"

type Props = WrapperProps<typeof DocVersionBannerType>

export default function DocVersionBannerWrapper(props: Props): React.ReactNode {
  return <DocVersionBanner {...props} />
}
