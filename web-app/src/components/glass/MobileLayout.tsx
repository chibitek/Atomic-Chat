/**
 * Mobile Layout — iOS Liquid Glass
 *
 * Based on Open Design mobile-ios.html handoff.
 * Glass navbar + messages + composer + bottom sheets.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { useThreads } from '@/hooks/useThreads'
import { useModelProvider } from '@/hooks/useModelProvider'
import { useMessages } from '@/hooks/useMessages'
import { useComposerSend } from '@/stores/composer-send-store'
import { TEMPORARY_CHAT_ID } from '@/constants/chat'

export function MobileLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Real data hooks
  const threads = useThreads((state) => state.threads)
  const currentThreadId = useThreads((state) => state.currentThreadId)
  const setCurrentThreadId = useThreads((state) => state.setCurrentThreadId)
  const createThread = useThreads((state) => state.createThread)
  const getFilteredThreads = useThreads((state) => state.getFilteredThreads)
  const getMessages = useMessages((state) => state.getMessages)

  const providers = useModelProvider((state) => state.providers)
  const selectedModel = useModelProvider((state) => state.selectedModel)
  const selectedProvider = useModelProvider((state) => state.selectedProvider)
  const selectModelProvider = useModelProvider((state) => state.selectModelProvider)

  const filteredThreads = useMemo(() => {
    return getFilteredThreads(searchQuery)
  }, [getFilteredThreads, searchQuery, threads])

  const handleNewChat = async () => {
    const model = selectedModel
      ? { id: selectedModel.id, provider: selectedProvider }
      : undefined
    const thread = await createThread(model, 'New Chat')
    setCurrentThreadId(thread.id)
    navigate({ to: '/threads/$threadId', params: { threadId: thread.id } })
    setActiveSheet(null)
  }

  const handleThreadClick = (threadId: string) => {
    setCurrentThreadId(threadId)
    navigate({ to: '/threads/$threadId', params: { threadId } })
    setActiveSheet(null)
  }

  const handleModelSelect = (providerName: string, modelId: string) => {
    selectModelProvider(providerName, modelId)
    setActiveSheet(null)
  }

  const currentThread = currentThreadId ? threads[currentThreadId] : undefined
  const threadMessages = currentThreadId ? getMessages(currentThreadId) : []

  const currentModelLabel = selectedModel?.name || selectedModel?.id || 'Select Model'

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages, children])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 96)}px`
    }
  }, [inputValue])

  const handleSend = () => {
    if (!inputValue.trim() || !currentThreadId) return
    const setPending = useComposerSend.getState().set
    setPending(currentThreadId, { text: inputValue.trim() })
    setInputValue('')
  }

  const closeSheet = () => setActiveSheet(null)

  // Group threads by date for mobile sheet
  const groupedThreads = useMemo(() => {
    const groups: Record<string, Thread[]> = {}
    const now = new Date()
    const today = now.toDateString()
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString()

    filteredThreads.forEach((thread) => {
      const date = new Date(thread.updated * 1000).toDateString()
      let label = date
      if (date === today) label = 'Today'
      else if (date === yesterday) label = 'Yesterday'
      else label = new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

      if (!groups[label]) groups[label] = []
      groups[label].push(thread)
    })

    return groups
  }, [filteredThreads])

  return (
    <div className="mobile-layout">
      {/* Ambient backdrop */}
      <div className="mobile-backdrop" aria-hidden="true" />

      {/* Status bar */}
      <div className="mobile-statusbar">
        <span id="clock">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="mobile-sb-icons" aria-hidden="true">
          <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
            <rect x="0" y="6" width="3" height="5" rx="1" />
            <rect x="5" y="4" width="3" height="7" rx="1" />
            <rect x="10" y="2" width="3" height="9" rx="1" />
            <rect x="15" y="0" width="3" height="11" rx="1" />
          </svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
            <path d="M8 2.2c2 0 3.8.8 5.1 2L14.5 2.8A9.4 9.4 0 0 0 8 0a9.4 9.4 0 0 0-6.5 2.8L3 4.2A7.3 7.3 0 0 1 8 2.2Zm0 3.5c1 0 2 .4 2.7 1.1l1.4-1.4A6 6 0 0 0 8 3.6a6 6 0 0 0-4.1 1.8l1.4 1.4A3.8 3.8 0 0 1 8 5.7Zm0 3.4 2-2a2.8 2.8 0 0 0-4 0l2 2Z" />
          </svg>
          <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
            <rect x="1" y="1.5" width="21" height="9" rx="2.6" stroke="currentColor" opacity="0.4" />
            <rect x="3" y="3.5" width="15" height="5" rx="1.4" fill="currentColor" />
            <path d="M23.5 4.5v3a2 2 0 0 0 0-3Z" fill="currentColor" opacity="0.5" />
          </svg>
        </span>
      </div>

      {/* Screen */}
      <div className="mobile-screen">
        {/* Glass navbar */}
        <nav className="mobile-navbar">
          <button
            className="mobile-nav-ic"
            onClick={() => setActiveSheet('threads')}
            aria-label="Threads"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>

          <div className="mobile-nav-model">
            <button
              className="mobile-nm-pill"
              onClick={() => setActiveSheet('model')}
              aria-label="Switch model"
            >
              <span>{selectedProvider === 'llamacpp' || selectedProvider === 'mlx' ? '🏠' : '☁️'}</span>
              <span>{currentModelLabel}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <span className="mobile-nm-sub">
              <span className="mobile-dot mobile-dot-live" /> {currentThread?.title || 'New Chat'}
            </span>
          </div>

          <button
            className="mobile-nav-ic"
            onClick={() => setActiveSheet('context')}
            aria-label="Thread context"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
          </button>
        </nav>

        {/* Messages */}
        <div className="mobile-msgs">
          {children || (
            <>
              {threadMessages.length === 0 && (
                <div className="mobile-pull-hint">Start a new conversation</div>
              )}
              {threadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('mobile-msg', msg.role === 'user' ? 'mobile-msg-user' : 'mobile-msg-ai')}
                >
                  {msg.role === 'assistant' && (
                    <div className="mobile-ai-name">
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-[0.6rem] font-bold">
                        AI
                      </span>
                      Assistant
                    </div>
                  )}
                  <div className="mobile-bubble">
                    {typeof msg.content === 'string'
                      ? msg.content
                      : msg.content?.map?.((c: any) => c.text?.value || '').join('') || ''}
                  </div>
                  <div className="mobile-stamp">
                    {msg.role === 'user' && (
                      <>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </>
                    )}
                    {msg.role === 'assistant' && (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="mobile-composer">
          <div className="mobile-ic-row">
            <div className="mobile-ic-tools">
              <button className="mobile-nav-ic" aria-label="Attach">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
              </button>
            </div>
            <div className="mobile-ic-input">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Message…"
                aria-label="Message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <button
                className="mobile-ic-send"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 19V5m-7 7 7-7 7 7" />
                </svg>
              </button>
            </div>
            <button className="mobile-ic-mic" aria-label="Voice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheets */}
      <div className={cn('mobile-scrim', activeSheet && 'open')} onClick={closeSheet} />

      {/* Threads Sheet */}
      <div className={cn('mobile-sheet', activeSheet === 'threads' && 'open')}>
        <div className="mobile-grabber" />
        <div className="mobile-sheet-head">
          <h3>Threads</h3>
          <button className="mobile-nav-ic" onClick={closeSheet} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mobile-sheet-body">
          <div className="mobile-sheet-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="mobile-srow" onClick={handleNewChat}>
            <div className="mobile-s-ic">+</div>
            <div className="flex-1 min-w-0">
              <div className="mobile-s-name">New Chat</div>
            </div>
          </button>
          {Object.entries(groupedThreads).map(([label, groupThreads]) => (
            <div key={label}>
              <div className="mobile-sgroup">{label}</div>
              {groupThreads.map((thread) => (
                <button
                  key={thread.id}
                  className={cn('mobile-srow', currentThreadId === thread.id && 'sel')}
                  onClick={() => handleThreadClick(thread.id)}
                >
                  <div className="mobile-s-ic">💬</div>
                  <div className="flex-1 min-w-0">
                    <div className="mobile-s-name">{thread.title || 'Untitled'}</div>
                    <div className="mobile-s-meta">
                      {getMessages(thread.id).length} messages
                      {thread.model?.id && ` · ${thread.model.id}`}
                    </div>
                  </div>
                  {currentThreadId === thread.id && (
                    <svg className="mobile-s-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filteredThreads.length === 0 && (
            <div className="p-4 text-center text-sm text-[var(--fg-3)]">
              No threads yet. Start a new chat!
            </div>
          )}
        </div>
      </div>

      {/* Model Sheet */}
      <div className={cn('mobile-sheet', activeSheet === 'model' && 'open')}>
        <div className="mobile-grabber" />
        <div className="mobile-sheet-head">
          <h3>Select Model</h3>
          <button className="mobile-nav-ic" onClick={closeSheet} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mobile-sheet-body">
          {providers.map((provider) => (
            <div key={provider.provider}>
              <div className="mobile-sgroup">{provider.provider}</div>
              {provider.models.map((model) => (
                <button
                  key={model.id}
                  className={cn(
                    'mobile-srow',
                    selectedModel?.id === model.id && selectedProvider === provider.provider && 'sel'
                  )}
                  onClick={() => handleModelSelect(provider.provider, model.id)}
                >
                  <div className="mobile-s-ic">{(model.name || model.id).slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="mobile-s-name">{model.name || model.id}</div>
                    <div className="mobile-s-meta">{provider.provider}</div>
                  </div>
                  {selectedModel?.id === model.id && selectedProvider === provider.provider && (
                    <svg className="mobile-s-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}
          {providers.length === 0 && (
            <div className="p-4 text-center text-sm text-[var(--fg-3)]">
              No models configured. Go to Settings to add providers.
            </div>
          )}
        </div>
      </div>
            <svg className="mobile-s-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
          <button className="mobile-srow">
            <div className="mobile-s-ic">GPT</div>
            <div className="flex-1 min-w-0">
              <div className="mobile-s-name">GPT-5</div>
              <div className="mobile-s-meta">OpenAI · Latest</div>
            </div>
            <div className="mobile-caps">
              <span className="mobile-cap">☁️</span>
            </div>
          </button>
          <div className="mobile-sgroup">Local</div>
          <button className="mobile-srow">
            <div className="mobile-s-ic">🍎</div>
            <div className="flex-1 min-w-0">
              <div className="mobile-s-name">MLX Llama 3</div>
              <div className="mobile-s-meta">On-device · 8B</div>
            </div>
            <div className="mobile-caps">
              <span className="mobile-cap">🏠</span>
              <span className="mobile-cap">🍎</span>
            </div>
          </button>
        </div>
      </div>

      {/* Context Sheet */}
      <div className={cn('mobile-sheet', activeSheet === 'context' && 'open')}>
        <div className="mobile-grabber" />
        <div className="mobile-sheet-head">
          <h3>Context</h3>
          <button className="mobile-nav-ic" onClick={closeSheet} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mobile-sheet-body">
          <div className="mobile-ctx-grid">
            <div className="mobile-ctx-tile">
              <div className="mobile-ctx-label">Model</div>
              <div className="flex items-center gap-2 py-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold">C4</span>
                <div>
                  <div className="text-sm font-medium">Claude 4 Sonnet</div>
                  <div className="text-xs text-[var(--fg-2)]">Anthropic</div>
                </div>
              </div>
            </div>
            <div className="mobile-ctx-tile">
              <div className="mobile-ctx-label">Parameters</div>
              <div className="space-y-3 py-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Temperature</span>
                    <span className="text-[var(--fg-2)]">0.7</span>
                  </div>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full" aria-label="Temperature" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Max Tokens</span>
                    <span className="text-[var(--fg-2)]">4,096</span>
                  </div>
                  <input type="range" min="256" max="8192" step="256" defaultValue="4096" className="w-full" aria-label="Max tokens" />
                </div>
              </div>
            </div>
            <div className="mobile-ctx-tile">
              <div className="mobile-ctx-label">Token Usage</div>
              <div className="py-2 space-y-1">
                <div className="mobile-ctx-row">
                  <span>Input</span>
                  <span>1,234</span>
                </div>
                <div className="mobile-ctx-row">
                  <span>Output</span>
                  <span>5,678</span>
                </div>
                <div className="mobile-ctx-row font-medium pt-1 border-t border-[rgba(var(--border-rgb),var(--border-o))]">
                  <span>Total</span>
                  <span>6,912</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
