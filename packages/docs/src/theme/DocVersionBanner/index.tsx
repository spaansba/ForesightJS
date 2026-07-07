import React from "react"
import DocVersionBanner from "@theme-original/DocVersionBanner"
import type DocVersionBannerType from "@theme/DocVersionBanner"
import type { WrapperProps } from "@docusaurus/types"
import { useLocation } from "@docusaurus/router"
import Admonition from "@theme/Admonition"

type Props = WrapperProps<typeof DocVersionBannerType>

/**
 * Renders the early-release notice on every page of the framework package
 * docs, above the doc content (same slot as version banners).
 */
export default function DocVersionBannerWrapper(props: Props): React.ReactNode {
  const { pathname } = useLocation()

  const pkg = pathname.startsWith("/docs/react/")
    ? "@foresightjs/react"
    : pathname.startsWith("/docs/vue/")
      ? "@foresightjs/vue"
      : pathname.startsWith("/docs/angular/")
        ? "@foresightjs/angular"
        : null

  return (
    <>
      <DocVersionBanner {...props} />
      {pkg && (
        <div className="margin-bottom--md">
          <Admonition type="info" title="Not yet stable">
            <code>{pkg}</code> is in beta and not yet stable. It works and is fully tested, but the
            API may still change.
          </Admonition>
        </div>
      )}
    </>
  )
}
