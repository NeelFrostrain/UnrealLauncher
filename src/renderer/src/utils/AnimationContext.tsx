// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getSetting, setSetting } from './settings'

interface AnimationContextType {
  animationsEnabled: boolean
  toggleAnimations: () => void
}

const AnimationContext = createContext<AnimationContextType>({
  animationsEnabled: true,
  toggleAnimations: () => {}
})

export const useAnimations = (): AnimationContextType => useContext(AnimationContext)

export const AnimationProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = getSetting('animationsEnabled')
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return prefersReduced && saved === true ? false : saved
  })

  const toggleAnimations = useCallback((): void => {
    const next = !animationsEnabled
    setAnimationsEnabled(next)
    setSetting('animationsEnabled', next)
  }, [animationsEnabled])

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      <div
        id="animation-root"
        className={animationsEnabled ? '' : 'no-animations'}
      >
        {children}
      </div>
    </AnimationContext.Provider>
  )
}
