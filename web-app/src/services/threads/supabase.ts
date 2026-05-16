/**
 * Supabase Threads Service
 *
 * Persists threads to Supabase PostgreSQL with RLS.
 * Falls back silently when Supabase is not configured so the app still
 * works in local-only mode.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ThreadsService } from './types'
import { TEMPORARY_CHAT_ID } from '@/constants/chat'

export class SupabaseThreadsService implements ThreadsService {
  async fetchThreads(): Promise<Thread[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[SupabaseThreadsService] fetchThreads error:', error)
      return []
    }

    return (data ?? []).map((row) => this.rowToThread(row))
  }

  async createThread(thread: Thread): Promise<Thread> {
    if (thread.id === TEMPORARY_CHAT_ID) return thread
    if (!isSupabaseConfigured) return thread

    const { data, error } = await supabase
      .from('threads')
      .insert({
        id: thread.id,
        title: thread.title,
        updated_at: new Date().toISOString(),
        metadata: {
          ...thread.metadata,
          order: thread.order,
          is_favorite: thread.isFavorite,
          model: thread.model,
          assistants: thread.assistants,
        },
      })
      .select()
      .single()

    if (error) {
      console.error('[SupabaseThreadsService] createThread error:', error)
      return thread
    }

    return this.rowToThread(data)
  }

  async updateThread(thread: Thread): Promise<void> {
    if (thread.id === TEMPORARY_CHAT_ID) return
    if (!isSupabaseConfigured) return

    const { error } = await supabase
      .from('threads')
      .update({
        title: thread.title,
        updated_at: new Date().toISOString(),
        metadata: {
          ...thread.metadata,
          order: thread.order,
          is_favorite: thread.isFavorite,
          model: thread.model,
          assistants: thread.assistants,
        },
      })
      .eq('id', thread.id)

    if (error) {
      console.error('[SupabaseThreadsService] updateThread error:', error)
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    if (threadId === TEMPORARY_CHAT_ID) return
    if (!isSupabaseConfigured) return

    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', threadId)

    if (error) {
      console.error('[SupabaseThreadsService] deleteThread error:', error)
    }
  }

  private rowToThread(row: Record<string, unknown>): Thread {
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
}
