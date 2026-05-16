import React from 'react'
import { cn } from '@/lib/utils'

interface GlassSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right'
  width?: string
  collapsible?: boolean
  collapsed?: boolean
  children: React.ReactNode
}

export const GlassSidebar = React.forwardRef<HTMLDivElement, GlassSidebarProps>(
  ({ className, side = 'left', width = '280px', collapsible, collapsed, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-sidebar flex flex-col h-full',
          side === 'right' && 'border-l',
          side === 'left' && 'border-r',
          collapsible && collapsed && 'w-[60px]',
          className
        )}
        style={{ width: collapsible && collapsed ? undefined : width }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassSidebar.displayName = 'GlassSidebar'
