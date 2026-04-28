"use client"

import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">, Omit<ForesightRegisterOptionsWithoutElement, "callback"> {
  children: React.ReactNode
  className?: string
}

export const ForesightLink = ({
  children,
  className,
  hitSlop,
  name,
  meta,
  reactivateAfter,
  ...linkProps
}: ForesightLinkProps) => {
  const router = useRouter()
  const { elementRef, isPredicted, isRegistered } = useForesight<HTMLAnchorElement>({
    callback: () => {
      router.prefetch(linkProps.href.toString())
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
      className={`${className ?? ""} ${isPredicted ? "outline-2 outline-amber-500" : ""}`}
    >
      {children}
    </Link>
  )
}
