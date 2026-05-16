/**
 * useRealtimeThreads
 *
 * Subscribes to Supabase Realtime for thread changes (insert, update, delete)
 * and calls the provided callbacks.  Falls back silently when Supabase is
 * not configured.
 */

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeThreadCallbacks {
  onInsert?: (thread: Thread) => void
  onUpdate?: (thread: Thread) => void
  onDelete?: (threadId: string) => void
}

export function useRealtimeThreads(callbacks: RealtimeThreadCallbacks): void {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const channel: RealtimeChannel = supabase
      .channel('threads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload

          switch (eventType) {
            case 'INSERT': {
              const thread = rowToThread(newRow as Record<string, unknown>)
              callbacksRef.current.onInsert?.(thread)
              break
            }
            case 'UPDATE': {
              const thread = rowToThread(newRow as Record<string, unknown>)
              callbacksRef.current.onUpdate?.(thread)
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
          console.log('[useRealtimeThreads] Subscribed to thread changes')
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeThreads] Channel error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}

function rowToThread(row: Record<string, unknown>): Thread {
  const metadata = (row.metadata as Record<string, unknown>) ?? {}
  return {
    id: String(row.id),
    title: String(row.title ?? 'Untitled'),
    updated: new Date(String(row.updated_at)).getTime() / 1000,
    order: metadata.order as number | undefined,
    isFavorite: metadata.is_favorite as boolean | undefined,
    model: metadata.model as ThreadModel | undefined,
    assistants: (metadata.assistants as ThreadAssistantInfo[] | undefined) ?? [],
    metadata,
  } as Thread
}
