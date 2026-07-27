import { Suspense, startTransition, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { DebugContext } from './debug/context'
import { DELAY_PRESETS } from './debug/config'
import type { DelayPreset } from './debug/config'
import { fetchTodos } from './todos/store'
import type { TodosPromise } from './todos/store'
import { DebugToolbar } from './debug/DebugToolbar'
import { TodoList } from './todos/TodoList'

export default function App() {
  const [todosPromise, setTodosPromise] = useState<TodosPromise>(() => fetchTodos())
  const [delayPreset, setDelayPreset] = useState<DelayPreset>('instant')
  const [failNext, setFailNext] = useState(false)

  // React Compiler: no useCallback here, no React.memo on TodoList — the compiler
  // memoizes callbacks and components automatically, so neither is needed.
  const refresh = () =>
    startTransition(() => setTodosPromise(fetchTodos(DELAY_PRESETS[delayPreset])))

  // React 19: <Context value={...}> replaces <Context.Provider value={...}>.
  // The .Provider form still works but is no longer necessary.
  return (
    <DebugContext value={{ delayPreset, failNext, setDelayPreset, setFailNext }}>
      <main className="mx-auto max-w-xl p-8 pb-16">
        <h1 className="text-2xl font-semibold">Todos</h1>
        <p>Playground for trying out modern React and TypeScript idioms.</p>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <p role="alert" className="mt-4 text-red-600">
              Failed to load todos: {error instanceof Error ? error.message : String(error)}
            </p>
          )}
        >
          <Suspense fallback={<p className="mt-4 text-gray-400">Loading…</p>}>
            <TodoList todosPromise={todosPromise} onMutate={refresh} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <DebugToolbar />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            width: 'fit-content',
            minWidth: 'unset',
            animation: 'none',
            transition: 'none',
          },
        }}
      />
    </DebugContext>
  )
}
