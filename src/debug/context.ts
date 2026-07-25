import { createContext } from 'react'
import type { DelayPreset } from './config'

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
