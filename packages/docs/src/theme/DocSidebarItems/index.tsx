import React from "react"
import DocSidebarItems from "@theme-original/DocSidebarItems"
import type DocSidebarItemsType from "@theme/DocSidebarItems"
import type { WrapperProps } from "@docusaurus/types"
import FrameworkSelector from "@site/src/components/FrameworkSelector"

type Props = WrapperProps<typeof DocSidebarItemsType>

/**
 * Wraps the sidebar items to render the framework selector as the first item
 * of the top-level menu. DocSidebarItems is used by both the desktop sidebar
 * and the mobile drawer, so the selector shows up in both. The level check
 * keeps it out of nested categories.
 */
export default function DocSidebarItemsWrapper(props: Props): React.ReactNode {
  return (
    <>
      {props.level === 1 && (
        <li style={{ listStyle: "none" }}>
          <FrameworkSelector />
        </li>
      )}
      <DocSidebarItems {...props} />
    </>
  )
}
