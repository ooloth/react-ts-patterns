// satisfies ensures the values are all numbers and the keys form a closed set,
// while keeping the literal types (e.g. 300, not number) for display.
export const DELAY_PRESETS = {
  instant: 300,
  normal:  1500,
  slow:    3000,
} satisfies Record<string, number>

export type DelayPreset = keyof typeof DELAY_PRESETS

export type MutationOptions = {
  delayMs: number
  shouldFail: boolean
}

export const DEFAULT_MUTATION_OPTIONS: MutationOptions = {
  delayMs: DELAY_PRESETS.normal,
  shouldFail: false,
}
