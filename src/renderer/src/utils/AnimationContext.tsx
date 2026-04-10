import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
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
  const [animationsEnabled, setAnimationsEnabled] = useState(() => getSetting('animationsEnabled'))

  const toggleAnimations = useCallback((): void => {
    const next = !animationsEnabled
    setAnimationsEnabled(next)
    setSetting('animationsEnabled', next)
  }, [animationsEnabled])

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      {/* MotionConfig with reducedMotion="always" disables all framer-motion animations */}
      <MotionConfig
        reducedMotion={animationsEnabled ? 'never' : 'always'}
        transition={animationsEnabled ? undefined : { duration: 0 }}
      >
        {/* CSS class on root disables CSS transitions/animations too */}
        <div
          id="animation-root"
          style={animationsEnabled ? undefined : {
            // Kill all CSS transitions and animations
          }}
          className={animationsEnabled ? '' : 'no-animations'}
        >
          {children}
        </div>
      </MotionConfig>
    </AnimationContext.Provider>
  )
}
