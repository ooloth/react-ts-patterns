import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { fetchTodos } from './api/todos'
import { TodoList } from './ui/TodoList'

// The promise is created outside the component so it isn't re-created on every
// render — that would cause an infinite suspend loop.
const todosPromise = fetchTodos()

export default function App() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Todos</h1>
      <ErrorBoundary fallbackRender={({ error }) => (
        <p className="mt-4 text-red-600">
          Failed to load todos: {error instanceof Error ? error.message : String(error)}
        </p>
      )}>
        <Suspense fallback={<p className="mt-4 text-gray-400">Loading…</p>}>
          <TodoList todosPromise={todosPromise} />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
