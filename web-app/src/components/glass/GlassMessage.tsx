import React from 'react'
import { cn } from '@/lib/utils'

interface GlassMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'user' | 'assistant'
  sender?: string
  avatar?: React.ReactNode
  children: React.ReactNode
}

export const GlassMessage = React.forwardRef<HTMLDivElement, GlassMessageProps>(
  ({ className, variant, sender, avatar, children, ...props }, ref) => {
    const isUser = variant === 'user'

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 max-w-[80%]',
          isUser ? 'flex-row-reverse self-end' : 'flex-row self-start',
          className
        )}
        {...props}
      >
        {/* Avatar */}
        {avatar && (
          <div className="flex-shrink-0 mt-1">
            {avatar}
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          'glass-message relative',
          isUser ? 'glass-message-user' : 'glass-message-assistant'
        )}>
          {/* Sender label */}
          {sender && !isUser && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[var(--glass-text-secondary)]">
                {sender}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="text-[var(--glass-text)]">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
GlassMessage.displayName = 'GlassMessage'
