/**
 * Supabase Messages Service
 *
 * Persists chat messages to Supabase PostgreSQL with RLS.
 * Falls back silently when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { MessagesService } from './types'
import { TEMPORARY_CHAT_ID } from '@/constants/chat'
import type { ThreadMessage } from '@janhq/core'

export class SupabaseMessagesService implements MessagesService {
  async fetchMessages(threadId: string): Promise<ThreadMessage[]> {
    if (threadId === TEMPORARY_CHAT_ID) return []
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[SupabaseMessagesService] fetchMessages error:', error)
      return []
    }

    return (data ?? []).map((row) => this.rowToMessage(row))
  }

  async createMessage(message: ThreadMessage): Promise<ThreadMessage> {
    if (message.thread_id === TEMPORARY_CHAT_ID) return message
    if (!isSupabaseConfigured) return message

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
      return message
    }

    return this.rowToMessage(data)
  }

  async modifyMessage(message: ThreadMessage): Promise<ThreadMessage> {
    if (message.thread_id === TEMPORARY_CHAT_ID) return message
    if (!isSupabaseConfigured) return message

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
      return message
    }

    return this.rowToMessage(data)
  }

  async deleteMessage(threadId: string, messageId: string): Promise<void> {
    if (threadId === TEMPORARY_CHAT_ID) return
    if (!isSupabaseConfigured) return

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('[SupabaseMessagesService] deleteMessage error:', error)
    }
  }

  private rowToMessage(row: Record<string, unknown>): ThreadMessage {
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
}
