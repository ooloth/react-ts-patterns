import { use } from 'react'
import { DELAY_PRESETS } from './config'
import type { MutationOptions } from './config'
import { DebugContext } from './context'

// Custom hook — translates the current debug settings into the options object
// that store mutation functions expect.
export function useMutationOptions(): { mutationOptions: MutationOptions; setFailNext: (value: boolean) => void } {
  const { delayPreset, failNext, setFailNext } = use(DebugContext)
  return {
    mutationOptions: { delayMs: DELAY_PRESETS[delayPreset], shouldFail: failNext },
    setFailNext,
  }
}
