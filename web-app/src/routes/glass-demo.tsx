import { createFileRoute } from '@tanstack/react-router'
import {
  GlassSidebar,
  GlassToolbar,
  GlassMessage,
  GlassInput,
  GlassThemeSwitcher,
} from '@/components/glass'
import { IconSend, IconPaperclip, IconMicrophone, IconTool, IconEye } from '@tabler/icons-react'

export const Route = createFileRoute('/_layout/glass-demo' as any)({
  component: GlassDemo,
})

function GlassDemo() {
  return (
    <div className="h-svh w-full flex flex-col glass-surface overflow-hidden">
      {/* Toolbar */}
      <GlassToolbar className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-950 dark:bg-white flex items-center justify-center">
            <img src="/images/transparent-logo.png" className="w-6 h-6 invert dark:invert-0" />
          </div>
          <span className="font-semibold text-[var(--glass-text)]">Atomic Chat</span>
        </div>
        <div className="flex-1" />
        <GlassThemeSwitcher />
      </GlassToolbar>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <GlassSidebar className="flex-shrink-0">
          <div className="p-4">
            <button className="glass glass-sm w-full py-2 px-4 rounded-xl text-[var(--glass-text)] font-medium mb-4">
              + New Chat
            </button>
            <div className="space-y-2">
              <div className="glass glass-sm p-3 rounded-xl">
                <div className="text-sm font-medium text-[var(--glass-text)]">Getting Started</div>
                <div className="text-xs text-[var(--glass-text-secondary)]">2 messages</div>
              </div>
              <div className="glass glass-sm p-3 rounded-xl glass-active">
                <div className="text-sm font-medium text-[var(--glass-text)]">Code Review</div>
                <div className="text-xs text-[var(--glass-text-secondary)]">12 messages</div>
              </div>
              <div className="glass glass-sm p-3 rounded-xl">
                <div className="text-sm font-medium text-[var(--glass-text)]">Project Planning</div>
                <div className="text-xs text-[var(--glass-text-secondary)]">8 messages</div>
              </div>
            </div>
          </div>
        </GlassSidebar>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <GlassMessage
              variant="assistant"
              sender="Claude 4"
              avatar={
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold">
                  C4
                </div>
              }
            >
              <p>Hello! I'm Claude 4, ready to help you with anything you need. How can I assist you today?</p>
            </GlassMessage>

            <GlassMessage
              variant="user"
              avatar={
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold">
                  You
                </div>
              }
            >
              <p>Can you help me design a new feature for our app?</p>
            </GlassMessage>

            <GlassMessage
              variant="assistant"
              sender="Claude 4"
              avatar={
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold">
                  C4
                </div>
              }
            >
              <p>Absolutely! I'd love to help. What kind of feature are you thinking about? For example:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>A new user interface component</li>
                <li>A backend service or API</li>
                <li>An integration with another platform</li>
                <li>An AI-powered automation</li>
              </ul>
            </GlassMessage>
          </div>

          {/* Input */}
          <GlassInput
            placeholder="Ask anything..."
            leftActions={
              <>
                <button className="glass-icon-btn"><IconPaperclip size={20} /></button>
                <button className="glass-icon-btn"><IconMicrophone size={20} /></button>
              </>
            }
            rightActions={
              <>
                <button className="glass-icon-btn"><IconTool size={20} /></button>
                <button className="glass-icon-btn"><IconEye size={20} /></button>
                <button className="glass glass-primary w-10 h-10 rounded-full flex items-center justify-center">
                  <IconSend size={18} />
                </button>
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
