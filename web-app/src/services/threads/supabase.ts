/**
 * Supabase Threads Service
 *
 * Persists threads to Supabase PostgreSQL with RLS — but only when Supabase is
 * configured AND a user is signed in. Without a session, RLS rejects every
 * request, so each call delegates to the local DefaultThreadsService instead.
 * That keeps threads persisted locally rather than silently dropped (DL-5).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ThreadsService } from './types'
import { DefaultThreadsService } from './default'
import { TEMPORARY_CHAT_ID } from '@/constants/chat'

/** Parse a timestamp column into epoch seconds, guarding null/invalid values (DL-7). */
function toEpochSeconds(value: unknown): number {
  const ms = new Date(String(value ?? '')).getTime()
  return Number.isFinite(ms) ? ms / 1000 : Date.now() / 1000
}

export class SupabaseThreadsService implements ThreadsService {
  private local = new DefaultThreadsService()
  private hasSession = false
  /** Resolves once the initial getSession() check has completed. */
  private sessionReady: Promise<void> = Promise.resolve()

  constructor() {
    if (isSupabaseConfigured) {
      this.sessionReady = supabase.auth.getSession().then(({ data }) => {
        this.hasSession = !!data.session
      })
      supabase.auth.onAuthStateChange((_event, session) => {
        this.hasSession = !!session
      })
    }
  }

  /**
   * Use Supabase only when configured AND a user is signed in. Awaits the
   * initial getSession() so a cold-start call cannot race ahead of it and
   * wrongly route a signed-in user's request to local storage.
   */
  private async useCloud(): Promise<boolean> {
    if (!isSupabaseConfigured) return false
    await this.sessionReady
    return this.hasSession
  }

  async fetchThreads(): Promise<Thread[]> {
    if (!(await this.useCloud())) return this.local.fetchThreads()

    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[SupabaseThreadsService] fetchThreads error:', error)
      return this.local.fetchThreads()
    }

    return (data ?? []).map((row) => this.rowToThread(row))
  }

  async createThread(thread: Thread): Promise<Thread> {
    if (thread.id === TEMPORARY_CHAT_ID) return thread
    if (!(await this.useCloud())) return this.local.createThread(thread)

    // user_id is auto-filled by the column DEFAULT auth.uid() (DL-1).
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
      return this.local.createThread(thread)
    }

    return this.rowToThread(data)
  }

  async updateThread(thread: Thread): Promise<void> {
    if (thread.id === TEMPORARY_CHAT_ID) return
    if (!(await this.useCloud())) return this.local.updateThread(thread)

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
    if (!(await this.useCloud())) return this.local.deleteThread(threadId)

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
      updated: toEpochSeconds(row.updated_at),
      order: metadata.order as number | undefined,
      isFavorite: metadata.is_favorite as boolean | undefined,
      model: metadata.model as ThreadModel | undefined,
      assistants: (metadata.assistants as { id: string; name: string }[] | undefined) ?? [],
      metadata,
    } as Thread
  }
}
