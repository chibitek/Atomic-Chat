/**
 * Desktop Layout — Liquid Glass 3-panel shell
 *
 * Based on Open Design desktop.html handoff.
 * Floating glass toolbar + sidebar + chat + inspector.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useThreads } from '@/hooks/useThreads'
import { useModelProvider } from '@/hooks/useModelProvider'
import { useMessages } from '@/hooks/useMessages'
import { useAppState } from '@/hooks/useAppState'
import { useChatSessions } from '@/stores/chat-session-store'
import { useComposerSend } from '@/stores/composer-send-store'
import { TEMPORARY_CHAT_ID } from '@/constants/chat'

export function DesktopLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  // Token speed / session status
  const tokenSpeed = useAppState((state) => state.tokenSpeed)
  const sessions = useChatSessions((state) => state.sessions)
  const sessionStatus = currentThreadId ? sessions[currentThreadId]?.status : undefined
  const isStreaming = sessionStatus === 'streaming' || sessionStatus === 'submitted'

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
  }

  const handleThreadClick = (threadId: string) => {
    setCurrentThreadId(threadId)
    navigate({ to: '/threads/$threadId', params: { threadId } })
  }

  const handleModelSelect = (providerName: string, modelId: string) => {
    selectModelProvider(providerName, modelId)
    setModelOpen(false)
  }

  // Group threads by date
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

  const currentThread = currentThreadId ? threads[currentThreadId] : undefined
  const threadMessages = currentThreadId ? getMessages(currentThreadId) : []

  // Flatten all models from all providers
  const allModels = useMemo(() => {
    const models: Array<{ id: string; name: string; provider: string; providerLabel: string }> = []
    providers.forEach((provider) => {
      provider.models.forEach((model) => {
        models.push({
          id: model.id,
          name: model.name || model.id,
          provider: provider.provider,
          providerLabel: provider.provider,
        })
      })
    })
    return models
  }, [providers])

  const currentModelLabel = selectedModel?.name || selectedModel?.id || 'Select Model'
  const currentProviderLabel = selectedProvider || ''

  return (
    <div className="win">
      {/* Floating Glass Toolbar */}
      <header className="titlebar">
        <button
          className="icon-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <span className="titlebar-title">Atomic Chat</span>
        <div className="titlebar-actions">
          <button className="icon-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button className="icon-btn" aria-label="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button className="icon-btn" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 3-Panel Shell */}
      <div className="shell">
        {/* Sidebar */}
        <aside className={cn('sidebar', sidebarCollapsed && 'collapsed')}>
          <div className="sb-head">
            <button className="new-chat" onClick={handleNewChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Chat
            </button>
          </div>
          <div className="search-wrap">
            <div className="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="thread-scroll">
            {Object.entries(groupedThreads).map(([label, groupThreads]) => (
              <div key={label}>
                <div className="group-label">{label}</div>
                {groupThreads.map((thread) => (
                  <button
                    key={thread.id}
                    className={cn('thread', currentThreadId === thread.id && 'active')}
                    onClick={() => handleThreadClick(thread.id)}
                  >
                    <div className="t-main">
                      <div className="t-title">{thread.title || 'Untitled'}</div>
                      <div className="t-sub">
                        {getMessages(thread.id).length} messages
                        {thread.model?.id && ` · ${thread.model.id}`}
                      </div>
                    </div>
                    {thread.isFavorite && (
                      <div className="sync">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
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
          <div className="sb-foot">
            <button className="acct">
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--accent-rgb),0.2)] flex items-center justify-center text-[var(--fg)] text-xs font-bold">
                EG
              </div>
              <div className="flex-1 min-w-0">
                <div className="a-name">Erick Grau</div>
                <div className="a-sub">
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--success))]"></span>
                  Online
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat">
          <div className="chat-head">
            <div className="flex-1 min-w-0">
              <div className="chat-title">{currentThread?.title || 'New Chat'}</div>
              <div className="chat-sub">
                {threadMessages.length} messages
                {currentThread?.model?.id && ` · ${currentThread.model.id}`}
              </div>
            </div>
            <div className="relative">
              <button className="model-btn" onClick={() => setModelOpen(!modelOpen)}>
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs">
                  {currentModelLabel.slice(0, 2).toUpperCase()}
                </span>
                <span>{currentModelLabel}</span>
                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {modelOpen && (
                <div className="model-pop open">
                  <div className="mp-search">
                    <input type="text" placeholder="Search models..." autoFocus />
                  </div>
                  <div className="mp-list">
                    {providers.map((provider) => (
                      <div key={provider.provider}>
                        <div className="mp-group">{provider.provider}</div>
                        {provider.models.map((model) => (
                          <button
                            key={model.id}
                            className={cn(
                              'mp-item',
                              selectedModel?.id === model.id && selectedProvider === provider.provider && 'sel'
                            )}
                            onClick={() => handleModelSelect(provider.provider, model.id)}
                          >
                            <div className="m-ic">{(model.name || model.id).slice(0, 2).toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <div className="m-name">{model.name || model.id}</div>
                              <div className="m-meta">{provider.provider}</div>
                            </div>
                            <svg className="mp-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    ))}
                    {allModels.length === 0 && (
                      <div className="p-4 text-center text-sm text-[var(--fg-3)]">
                        No models configured. Go to Settings to add providers.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="msgs">
            {children || (
              <div className="msg-wrap">
                <div className="msg">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold flex-none">
                    C4
                  </div>
                  <div className="m-body">
                    <div className="m-name">Claude 4</div>
                    <div className="m-text">
                      <p>Hello! I'm Claude 4, ready to help you with anything you need. How can I assist you today?</p>
                    </div>
                    <div className="m-time">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      10:30 AM
                    </div>
                  </div>
                </div>

                <div className="msg msg-user">
                  <div className="m-body">
                    <div className="m-text">Can you help me design a new feature for our app?</div>
                    <div className="m-time">
                      10:31 AM
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <DesktopComposer threadId={currentThreadId} />
        </main>

        {/* Right Inspector */}
        <aside className="context">
          <div className="ctx-head">
            <span className="ctx-title">Context</span>
            <button className="icon-btn" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="ctx-body">
            <div className="ctx-section">
              <div className="ctx-label">Model</div>
              <div className="flex items-center gap-2 py-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold">
                  {currentModelLabel.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="text-sm font-medium">{currentModelLabel}</div>
                  <div className="text-xs text-[var(--fg-2)]">{selectedProvider || 'No provider'}</div>
                </div>
              </div>
            </div>
            <div className="ctx-section">
              <div className="ctx-label">Parameters</div>
              <div className="space-y-3 py-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Temperature</span>
                    <span className="text-[var(--fg-2)]">
                      {selectedModel?.settings?.temperature?.controller_props?.value ?? 0.7}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue={String(selectedModel?.settings?.temperature?.controller_props?.value ?? 0.7)}
                    className="w-full"
                    aria-label="Temperature"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Max Tokens</span>
                    <span className="text-[var(--fg-2)]">
                      {selectedModel?.settings?.ctx_len?.controller_props?.value ?? 4096}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    defaultValue={String(selectedModel?.settings?.ctx_len?.controller_props?.value ?? 4096)}
                    className="w-full"
                    aria-label="Max tokens"
                  />
                </div>
              </div>
            </div>
            <div className="ctx-section">
              <div className="ctx-label">Token Usage</div>
              <div className="py-2">
                <div className="flex justify-between text-sm">
                  <span>Messages</span>
                  <span>{threadMessages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Thread ID</span>
                  <span className="font-mono text-xs">{currentThreadId?.slice(0, 8) || '—'}</span>
                </div>
                {tokenSpeed && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Speed</span>
                      <span>{tokenSpeed.tokenSpeed.toFixed(1)} tok/s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tokens</span>
                      <span>{tokenSpeed.tokenCount}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm font-medium mt-1 pt-1 border-t border-[rgba(var(--border-rgb),var(--border-o))]">
                  <span>Status</span>
                  <span className={isStreaming ? 'text-[rgb(var(--accent-rgb))]' : ''}>
                    {isStreaming ? 'Streaming…' : currentThreadId ? 'Ready' : 'No thread'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/**
 * DesktopComposer — Glass composer that stores pending sends for ThreadDetail
 */
function DesktopComposer({ threadId }: { threadId?: string }) {
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const setPending = useComposerSend((s) => s.set)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`
    }
  }, [inputValue])

  const handleSend = () => {
    if (!inputValue.trim() || !threadId) return
    setPending(threadId, { text: inputValue.trim() })
    setInputValue('')
  }

  return (
    <div className="composer">
      <div className="composer-inner">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            placeholder={threadId ? 'Ask anything...' : 'Select a thread to start chatting'}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={!threadId}
          />
          <div className="composer-bar">
            <button className="icon-btn" aria-label="Attach">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button className="icon-btn" aria-label="Voice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            <button className="icon-btn" aria-label="Tools">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </button>
            <button className="icon-btn" aria-label="Vision">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              className="send-btn"
              aria-label="Send"
              onClick={handleSend}
              disabled={!inputValue.trim() || !threadId}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2 11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="composer-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}
