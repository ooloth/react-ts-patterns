import { use } from 'react'
import { DELAY_PRESETS, DebugContext } from '../domain/debug'
import type { DelayPreset } from '../domain/debug'

const PRESET_LABELS: Record<DelayPreset, string> = {
  instant: 'Instant (300ms)',
  normal:  'Normal (1.5s)',
  slow:    'Slow (3s)',
}

export function DebugToolbar() {
  // use(context) — React 19 lets use() read context values, not just promises.
  // Unlike useContext, use() can be called conditionally.
  const { delayPreset, failNext, setDelayPreset, setFailNext } = use(DebugContext)

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-center gap-6 text-xs text-gray-500">
      <span className="font-medium text-gray-400 uppercase tracking-wide">Debug</span>
      <div className="flex items-center gap-2">
        <span>Delay:</span>
        {(Object.keys(DELAY_PRESETS) as DelayPreset[]).map(preset => (
          <button
            key={preset}
            onClick={() => setDelayPreset(preset)}
            className={`rounded px-2 py-0.5 ${delayPreset === preset ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-200'}`}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={failNext}
          onChange={e => setFailNext(e.target.checked)}
          className="h-3 w-3"
        />
        Fail next request
      </label>
    </div>
  )
}
