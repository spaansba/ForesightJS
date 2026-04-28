"use client"

import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">, Omit<ForesightRegisterOptionsWithoutElement, "callback"> {
  children: React.ReactNode
  className?: string
  onForesightHit?: (href: string) => void
}

export const ForesightLink = ({
  children,
  className,
  hitSlop,
  name,
  meta,
  reactivateAfter,
  onForesightHit,
  ...linkProps
}: ForesightLinkProps) => {
  const router = useRouter()
  const { elementRef, isPredicted, isRegistered } = useForesight<HTMLAnchorElement>({
    callback: () => {
      const href = linkProps.href.toString()
      console.log("[foresight]", href)
      router.prefetch(href)
      onForesightHit?.(href)
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
      data-predicted={isPredicted}
      data-registered={isRegistered}
      className={`inline-flex items-center px-3 py-2 border border-gray-400 text-gray-800 bg-white hover:bg-gray-100 ${
        isPredicted ? "outline outline-2 outline-amber-500" : ""
      } ${className ?? ""}`}
    >
      {children}
    </Link>
  )
}
