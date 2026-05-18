import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'

export type Skin = 'glass' | 'soft'
export type GlassTheme = 'light' | 'dark' | 'clear' | 'tinted'
export type SoftTheme = 'light' | 'dark'
export type Theme = GlassTheme | SoftTheme

interface GlassThemeContextType {
  skin: Skin
  setSkin: (skin: Skin) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => Theme
}

const GlassThemeContext = createContext<GlassThemeContextType | null>(null)

export function useGlassTheme() {
  const ctx = useContext(GlassThemeContext)
  if (!ctx) throw new Error('useGlassTheme must be used within GlassThemeProvider')
  return ctx
}

const SKIN_KEY = 'atomic-skin'
const THEME_KEY = 'atomic-theme'

const THEMES: Record<Skin, Theme[]> = {
  glass: ['light', 'dark', 'clear', 'tinted'],
  soft: ['light', 'dark'],
}

function sysDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveSkin(): Skin {
  const s = localStorage.getItem(SKIN_KEY)
  return s === 'soft' || s === 'glass' ? s : 'glass'
}

function resolveTheme(skin: Skin): Theme {
  const t = localStorage.getItem(THEME_KEY)
  if (t && THEMES[skin].includes(t as Theme)) return t as Theme
  return sysDark() ? 'dark' : 'light'
}

export function GlassThemeProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<Skin>(() => {
    if (typeof window === 'undefined') return 'glass'
    return resolveSkin()
  })

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return resolveTheme(resolveSkin())
  })

  const apply = useCallback((s: Skin, t: Theme) => {
    document.documentElement.setAttribute('data-skin', s)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  const setSkin = useCallback((s: Skin) => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme
    let t = currentTheme
    if (!THEMES[s].includes(t)) t = THEMES[s][0]
    localStorage.setItem(SKIN_KEY, s)
    localStorage.setItem(THEME_KEY, t)
    setSkinState(s)
    setThemeState(t)
    apply(s, t)
  }, [apply])

  const setTheme = useCallback((t: Theme) => {
    const s = document.documentElement.getAttribute('data-skin') as Skin || 'glass'
    if (!THEMES[s].includes(t)) return
    localStorage.setItem(THEME_KEY, t)
    setThemeState(t)
    apply(s, t)
  }, [apply])

  const toggleTheme = useCallback(() => {
    const s = document.documentElement.getAttribute('data-skin') as Skin || 'glass'
    const list = THEMES[s]
    const current = document.documentElement.getAttribute('data-theme') as Theme
    const next = list[(list.indexOf(current) + 1) % list.length]
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
    apply(s, next)
    return next
  }, [apply])

  // Initialize on mount
  useEffect(() => {
    const s = resolveSkin()
    const t = resolveTheme(s)
    setSkinState(s)
    setThemeState(t)
    apply(s, t)

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (!localStorage.getItem(THEME_KEY)) {
        const skin = resolveSkin()
        apply(skin, sysDark() ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [apply])

  return (
    <GlassThemeContext.Provider value={{ skin, setSkin, theme, setTheme, toggleTheme }}>
      {children}
    </GlassThemeContext.Provider>
  )
}
