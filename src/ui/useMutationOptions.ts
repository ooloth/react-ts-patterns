import { use } from 'react'
import { DELAY_PRESETS, DebugContext } from '../domain/debug'
import type { MutationOptions } from '../api/todos'

// Custom hook — encapsulates reading DebugContext and deriving MutationOptions
// so components don't each repeat the same two-line pattern.
export function useMutationOptions(): { mutationOptions: MutationOptions; setFailNext: (value: boolean) => void } {
  const { delayPreset, failNext, setFailNext } = use(DebugContext)
  return {
    mutationOptions: { delayMs: DELAY_PRESETS[delayPreset], shouldFail: failNext },
    setFailNext,
  }
}
