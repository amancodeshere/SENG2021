import React, { ReactNode, createContext, useContext, useState } from "react"

// Create a simple context for the tooltip provider
const TooltipContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | undefined>(undefined)

interface TooltipProviderProps {
  children: ReactNode
}

function TooltipProvider({ children }: TooltipProviderProps) {
  const [open, setOpen] = useState(false)
  return <TooltipContext.Provider value={{ open, setOpen }}>{children}</TooltipContext.Provider>
}

function useTooltip() {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error("useTooltip must be used within a TooltipProvider")
  }
  return context
}

interface TooltipProps {
  children: ReactNode
}

function Tooltip({ children }: TooltipProps) {
  return <div className="relative inline-block">{children}</div>
}

interface TooltipTriggerProps {
  children: ReactNode
  asChild?: boolean
}

function TooltipTrigger({ children, asChild = false }: TooltipTriggerProps) {
  const { setOpen } = useTooltip()
  
  const child = asChild ? children : <button type="button">{children}</button>
  
  const trigger = React.cloneElement(child as React.ReactElement, {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  })
  
  return trigger
}

interface TooltipContentProps {
  children: ReactNode
}

function TooltipContent({ children }: TooltipContentProps) {
  const { open } = useTooltip()
  
  if (!open) return null
  
  return (
    <div className="absolute z-50 -translate-x-1/2 translate-y-2 left-1/2 bottom-full">
      <div className="bg-ocean-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
        {children}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ocean-800" />
      </div>
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 