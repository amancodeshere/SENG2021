import { HTMLAttributes, forwardRef } from "react"

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`animate-pulse rounded-md bg-ocean-100/50 ${className || ""}`}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton } 