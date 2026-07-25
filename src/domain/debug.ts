import { createContext } from 'react'

// satisfies ensures the values are all numbers and the keys form a closed set,
// while keeping the literal types (e.g. 300, not number) for display.
export const DELAY_PRESETS = {
  instant: 300,
  normal: 1500,
  slow:   3000,
} satisfies Record<string, number>

export type DelayPreset = keyof typeof DELAY_PRESETS

export type DebugSettings = {
  delayPreset: DelayPreset
  failNext: boolean
}

export type DebugContextValue = DebugSettings & {
  setDelayPreset: (preset: DelayPreset) => void
  setFailNext: (value: boolean) => void
}

export const DebugContext = createContext<DebugContextValue>({
  delayPreset: 'normal',
  failNext: false,
  setDelayPreset: () => {},
  setFailNext: () => {},
})
