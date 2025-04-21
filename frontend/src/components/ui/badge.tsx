import { HTMLAttributes, forwardRef } from "react"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive"
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-ocean-600 text-white hover:bg-ocean-700",
      secondary: "bg-ocean-100 text-ocean-900 hover:bg-ocean-200",
      outline: "bg-transparent border border-ocean-200 text-ocean-800 hover:bg-ocean-50",
      destructive: "bg-red-500 text-white hover:bg-red-600",
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className || ""}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge } 