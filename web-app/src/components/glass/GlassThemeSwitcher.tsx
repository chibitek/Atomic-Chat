import { useGlassTheme, type Skin, type Theme } from './GlassThemeProvider'
import { cn } from '@/lib/utils'

const skins: { id: Skin; label: string }[] = [
  { id: 'glass', label: 'Liquid Glass' },
  { id: 'soft', label: 'Soft Mono' },
]

const glassThemes: { id: Theme; label: string; swatch: string }[] = [
  { id: 'light', label: 'Light', swatch: 'bg-gradient-to-br from-white to-blue-100' },
  { id: 'dark', label: 'Dark', swatch: 'bg-gradient-to-br from-slate-700 to-slate-900' },
  { id: 'clear', label: 'Clear', swatch: 'bg-gradient-to-br from-blue-500 to-teal-500' },
  { id: 'tinted', label: 'Tinted', swatch: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
]

const softThemes: { id: Theme; label: string; swatch: string }[] = [
  { id: 'light', label: 'Light', swatch: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'dark', label: 'Dark', swatch: 'bg-gradient-to-br from-gray-700 to-gray-900' },
]

export function GlassThemeSwitcher({ className }: { className?: string }) {
  const { skin, setSkin, theme, setTheme } = useGlassTheme()
  const themes = skin === 'glass' ? glassThemes : softThemes

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Skin selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-[var(--fg)]">Skin</span>
        <div className="flex gap-2">
          {skins.map((s) => (
            <button
              key={s.id}
              onClick={() => setSkin(s.id)}
              className={cn(
                'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                'border border-[rgba(var(--border-rgb),var(--border-o))]',
                skin === s.id
                  ? 'bg-[rgba(var(--accent-rgb),0.16)] text-[var(--fg)] border-[rgba(var(--accent-rgb),0.34)]'
                  : 'bg-[rgba(var(--glass-rgb),var(--glass-o-thin))] text-[var(--fg-2)] hover:bg-[rgba(var(--glass-rgb),var(--glass-o-hover))]'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-[var(--fg)]">Theme</span>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
                'border border-[rgba(var(--border-rgb),var(--border-o))]',
                theme === t.id
                  ? 'bg-[rgba(var(--accent-rgb),0.16)] text-[var(--fg)] border-[rgba(var(--accent-rgb),0.34)]'
                  : 'bg-[rgba(var(--glass-rgb),var(--glass-o-thin))] text-[var(--fg-2)] hover:bg-[rgba(var(--glass-rgb),var(--glass-o-hover))]'
              )}
            >
              <span className={cn('w-4 h-4 rounded-full', t.swatch)} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
