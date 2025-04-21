import { HTMLAttributes, forwardRef } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border bg-white shadow-sm ${className || ""}`}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col space-y-1.5 p-6 ${className || ""}`}
        {...props}
      />
    )
  }
)
CardHeader.displayName = "CardHeader"

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-6 pt-0 ${className || ""}`}
        {...props}
      />
    )
  }
)
CardContent.displayName = "CardContent"

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-xl font-semibold leading-none tracking-tight ${className || ""}`}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

export { Card, CardHeader, CardContent, CardTitle } 