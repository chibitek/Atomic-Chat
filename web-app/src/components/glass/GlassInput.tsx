import React from 'react'
import { cn } from '@/lib/utils'

interface GlassInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  leftActions?: React.ReactNode
  rightActions?: React.ReactNode
  minRows?: number
  maxRows?: number
}

export const GlassInput = React.forwardRef<HTMLTextAreaElement, GlassInputProps>(
  ({ className, leftActions, rightActions, minRows = 1, maxRows = 5, ...props }, ref) => {
    return (
      <div className={cn('glass-input-area flex items-end gap-2 p-3', className)}>
        {leftActions && (
          <div className="flex items-center gap-1 flex-shrink-0">{leftActions}</div>
        )}
        <textarea
          ref={ref}
          rows={minRows}
          className="glass-input flex-1 resize-none bg-transparent border-none outline-none text-[var(--glass-text)] placeholder:text-[var(--glass-text-secondary)]"
          style={{ minHeight: `${minRows * 24}px`, maxHeight: `${maxRows * 24}px` }}
          {...props}
        />
        {rightActions && (
          <div className="flex items-center gap-1 flex-shrink-0">{rightActions}</div>
        )}
      </div>
    )
  }
)
GlassInput.displayName = 'GlassInput'
