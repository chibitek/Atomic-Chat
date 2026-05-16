/**
 * useRealtimeMessages
 *
 * Subscribes to Supabase Realtime for message changes in a specific thread.
 * Falls back silently when Supabase is not configured.
 */

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ThreadMessage } from '@janhq/core'

export interface RealtimeMessageCallbacks {
  onInsert?: (message: ThreadMessage) => void
  onUpdate?: (message: ThreadMessage) => void
  onDelete?: (messageId: string) => void
}

export function useRealtimeMessages(
  threadId: string | undefined,
  callbacks: RealtimeMessageCallbacks
): void {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!isSupabaseConfigured || !threadId) return

    const channel: RealtimeChannel = supabase
      .channel(`messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload

          switch (eventType) {
            case 'INSERT': {
              const message = rowToMessage(newRow as Record<string, unknown>)
              callbacksRef.current.onInsert?.(message)
              break
            }
            case 'UPDATE': {
              const message = rowToMessage(newRow as Record<string, unknown>)
              callbacksRef.current.onUpdate?.(message)
              break
            }
            case 'DELETE': {
              const id = (oldRow as Record<string, unknown>)?.id as string
              if (id) callbacksRef.current.onDelete?.(id)
              break
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            `[useRealtimeMessages] Subscribed to messages for thread ${threadId}`
          )
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeMessages] Channel error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId])
}

function rowToMessage(row: Record<string, unknown>): ThreadMessage {
  return {
    id: String(row.id),
    thread_id: String(row.thread_id),
    role: String(row.role) as ThreadMessage['role'],
    content: row.content as ThreadMessage['content'],
    status: (row.status as ThreadMessage['status']) ?? 'ready',
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created: new Date(String(row.created_at)).getTime(),
    object: 'thread.message',
    created_at: new Date(String(row.created_at)).getTime(),
    completed_at: new Date(String(row.created_at)).getTime(),
  } as unknown as ThreadMessage
}
