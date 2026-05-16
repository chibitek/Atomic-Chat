import React from 'react'
import { cn } from '@/lib/utils'

interface GlassToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  floating?: boolean
  children: React.ReactNode
}

export const GlassToolbar = React.forwardRef<HTMLDivElement, GlassToolbarProps>(
  ({ className, floating = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-toolbar flex items-center gap-2 px-4 py-2',
          floating && 'glass-floating mx-4 mt-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassToolbar.displayName = 'GlassToolbar'
