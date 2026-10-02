"use client"

import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">, Omit<ForesightRegisterOptionsWithoutElement, "callback"> {
  children: React.ReactNode
  className?: string
  onPrefetch?: (href: string | undefined) => void
}

export const ForesightLink = ({
  children,
  className,
  hitSlop,
  name,
  meta,
  onPrefetch,
  reactivateAfter,
  ...linkProps
}: ForesightLinkProps) => {
  const router = useRouter()
  const { elementRef, isRegistered } = useForesight<HTMLAnchorElement>({
    callback: state => {
      router.prefetch(linkProps.href.toString())
      onPrefetch?.(state.meta.href)
    },
    hitSlop,
    name,
    meta,
    reactivateAfter,
  })

  return (
    <Link
      {...linkProps}
      ref={elementRef}
      prefetch={false}
      data-registered={isRegistered}
      className={className ?? ""}
    >
      {children}
    </Link>
  )
}
