/**
 * Supabase Messages Service
 *
 * Persists chat messages to Supabase PostgreSQL with RLS — but only when
 * Supabase is configured AND a user is signed in. Without a session, RLS
 * rejects every request, so each call delegates to the local
 * DefaultMessagesService instead of silently dropping the message (DL-5).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { MessagesService } from './types'
import { DefaultMessagesService } from './default'
import { TEMPORARY_CHAT_ID } from '@/constants/chat'
import type { ThreadMessage } from '@janhq/core'

/** Parse a timestamp column into epoch ms, guarding null/invalid values (DL-7). */
function toEpochMs(value: unknown): number {
  const ms = new Date(String(value ?? '')).getTime()
  return Number.isFinite(ms) ? ms : Date.now()
}

export class SupabaseMessagesService implements MessagesService {
  private local = new DefaultMessagesService()
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

  async fetchMessages(threadId: string): Promise<ThreadMessage[]> {
    if (threadId === TEMPORARY_CHAT_ID) return []
    if (!(await this.useCloud())) return this.local.fetchMessages(threadId)

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[SupabaseMessagesService] fetchMessages error:', error)
      return this.local.fetchMessages(threadId)
    }

    return (data ?? []).map((row) => this.rowToMessage(row))
  }

  async createMessage(message: ThreadMessage): Promise<ThreadMessage> {
    if (message.thread_id === TEMPORARY_CHAT_ID) return message
    if (!(await this.useCloud())) return this.local.createMessage(message)

    // user_id is auto-filled by the column DEFAULT auth.uid() (DL-2).
    // content is stored in a JSONB column (DL-3).
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: message.id,
        thread_id: message.thread_id,
        role: message.role,
        content: message.content,
        status: message.status,
        metadata: message.metadata ?? {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[SupabaseMessagesService] createMessage error:', error)
      return this.local.createMessage(message)
    }

    return this.rowToMessage(data)
  }

  async modifyMessage(message: ThreadMessage): Promise<ThreadMessage> {
    if (message.thread_id === TEMPORARY_CHAT_ID) return message
    if (!(await this.useCloud())) return this.local.modifyMessage(message)

    const { data, error } = await supabase
      .from('messages')
      .update({
        content: message.content,
        status: message.status,
        metadata: message.metadata ?? {},
      })
      .eq('id', message.id)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseMessagesService] modifyMessage error:', error)
      return this.local.modifyMessage(message)
    }

    return this.rowToMessage(data)
  }

  async deleteMessage(threadId: string, messageId: string): Promise<void> {
    if (threadId === TEMPORARY_CHAT_ID) return
    if (!(await this.useCloud())) return this.local.deleteMessage(threadId, messageId)

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('[SupabaseMessagesService] deleteMessage error:', error)
    }
  }

  private rowToMessage(row: Record<string, unknown>): ThreadMessage {
    const created = toEpochMs(row.created_at)
    return {
      id: String(row.id),
      thread_id: String(row.thread_id),
      role: String(row.role) as ThreadMessage['role'],
      content: row.content as ThreadMessage['content'],
      status: (row.status as ThreadMessage['status']) ?? 'ready',
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      created,
      object: 'thread.message',
      created_at: created,
      completed_at: created,
    } as unknown as ThreadMessage
  }
}
