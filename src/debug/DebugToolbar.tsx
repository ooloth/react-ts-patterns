import { use, useId } from 'react'
import { DELAY_PRESETS } from './config'
import type { DelayPreset } from './config'
import { DebugContext } from './context'

const PRESET_LABELS: Record<DelayPreset, string> = {
  instant: 'Instant (300ms)',
  normal: 'Normal (1.5s)',
  slow: 'Slow (3s)',
}

export function DebugToolbar() {
  // use(context) — React 19 lets use() read context values, not just promises.
  // Unlike useContext, use() can be called conditionally.
  const { delayPreset, failNext, setDelayPreset, setFailNext } = use(DebugContext)
  const titleId = useId()
  const delayGroupId = useId()

  return (
    // <aside> makes the toolbar a complementary landmark — screen reader users
    // can navigate to it by landmark. aria-labelledby links it to the visible
    // "Debug" title rather than duplicating the name in an aria-label string.
    <aside
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-6 border-t border-line bg-surface px-4 py-2 text-xs text-muted"
    >
      <span id={titleId} className="font-medium uppercase tracking-wide text-faint">Debug</span>
      {/* role="group" + aria-labelledby is preferred over <fieldset>/<legend> here:
          these are action buttons (not form controls), and <fieldset> carries default
          browser styles that require resetting. */}
      <div role="group" aria-labelledby={delayGroupId} className="flex items-center gap-2">
        <span id={delayGroupId}>Delay:</span>
        {(Object.keys(DELAY_PRESETS) as DelayPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => setDelayPreset(preset)}
            aria-pressed={delayPreset === preset}
            className={`rounded px-2 py-0.5 transition-colors ${delayPreset === preset ? 'bg-surface-hover font-medium text-accent' : 'hover:bg-surface-hover hover:text-text'}`}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-1.5">
        <input
          type="checkbox"
          checked={failNext}
          onChange={(e) => setFailNext(e.target.checked)}
          className="h-3 w-3 accent-accent"
        />
        Fail next request
      </label>
    </aside>
  )
}
