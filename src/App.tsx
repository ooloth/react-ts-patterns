import { Suspense, startTransition, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { fetchTodos } from './api/todos'
import { TodoList } from './ui/TodoList'

export default function App() {
  const [todosPromise, setTodosPromise] = useState(() => fetchTodos())

  // Wrapping in startTransition prevents Suspense from showing its fallback
  // during the re-fetch — React keeps the current list visible until the new
  // data is ready, then swaps it in. Without this, every mutation causes a
  // full loading flash even though we already have content to show.
  const refresh = () => startTransition(() => setTodosPromise(fetchTodos()))

  return (
    <>
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">Todos</h1>
        <ErrorBoundary fallbackRender={({ error }) => (
          <p className="mt-4 text-red-600">
            Failed to load todos: {error instanceof Error ? error.message : String(error)}
          </p>
        )}>
          <Suspense fallback={<p className="mt-4 text-gray-400">Loading…</p>}>
            <TodoList todosPromise={todosPromise} onMutate={refresh} />
          </Suspense>
        </ErrorBoundary>
      </main>
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
    </>
  )
}
