import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import { Link, type LinkProps } from "react-router-dom"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">, Omit<ForesightRegisterOptionsWithoutElement, "callback"> {
  children: React.ReactNode
  className?: string
  onPrefetch?: (to: string) => void
}

export const ForesightLink = ({
  children,
  className,
  onPrefetch,
  hitSlop,
  name,
  meta,
  reactivateAfter,
  ...linkProps
}: ForesightLinkProps) => {
  const { elementRef, isPredicted, isRegistered } = useForesight<HTMLAnchorElement>({
    callback: () => onPrefetch?.(linkProps.to.toString()),
    hitSlop,
    name,
    meta,
    reactivateAfter,
  })

  return (
    <Link
      {...linkProps}
      ref={elementRef}
      className={`${className ?? ""} ${isPredicted ? "outline-2 outline-amber-500" : ""}`}
      data-predicted={isPredicted}
      data-registered={isRegistered}
    >
      {children}
    </Link>
  )
}
