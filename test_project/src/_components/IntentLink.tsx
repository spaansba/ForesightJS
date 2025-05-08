"use client"
import type { LinkProps } from "next/link"
import Link from "next/link"
import React, { useRef } from "react"
import { useRouter } from "next/navigation"
import useIntent from "./useIntent"

type IntentPrefetch = "intent"

interface IntentLinkProps extends Omit<LinkProps, "prefetch"> {
  children: React.ReactNode
  prefetch?: boolean | null | IntentPrefetch
  className?: string
}

function IntentLink({ children, prefetch, className, ...props }: IntentLinkProps) {
  if (prefetch !== "intent") {
    return (
      <Link {...props} prefetch={prefetch}>
        {children}
      </Link>
    )
  } else {
    return (
      <Intent {...props} className={className}>
        {children}
      </Intent>
    )
  }
}

function Intent({ children, className, ...props }: IntentLinkProps) {
  const LinkRef = useRef<HTMLAnchorElement>(null)

  const router = useRouter()
  useIntent(() => {
    router.prefetch(props.href.toString())
    console.log("here", props.href)
  }, LinkRef)
  return (
    <Link {...props} prefetch={false} ref={LinkRef} className={className}>
      {children}
    </Link>
  )
}

export default IntentLink
