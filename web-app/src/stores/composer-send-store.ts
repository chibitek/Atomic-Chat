/**
 * useComposerSend
 *
 * Global store for pending composer sends.
 * The layout's glass composer sets a pending send here,
 * and ThreadDetail consumes it and calls processAndSendMessage.
 */

import { create } from 'zustand'

export type ComposerSendPayload = {
  text: string
  files?: Array<{ type: string; mediaType: string; url: string }>
}

type ComposerSendStore = {
  pending: Record<string, ComposerSendPayload>
  set: (threadId: string, payload: ComposerSendPayload) => void
  consume: (threadId: string) => ComposerSendPayload | undefined
}

export const useComposerSend = create<ComposerSendStore>()((set, get) => ({
  pending: {},
  set: (threadId, payload) => {
    set((state) => ({
      pending: { ...state.pending, [threadId]: payload },
    }))
  },
  consume: (threadId) => {
    const payload = get().pending[threadId]
    if (!payload) return undefined
    set((state) => {
      const next = { ...state.pending }
      delete next[threadId]
      return { pending: next }
    })
    return payload
  },
}))
