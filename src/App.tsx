import { Suspense, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { fetchTodos } from './api/todos'
import { AddTodoForm } from './ui/AddTodoForm'
import { TodoList } from './ui/TodoList'

export default function App() {
  // Storing the promise in state lets us replace it after a mutation, which
  // causes TodoList to re-suspend and refetch. useState(() => fetchTodos())
  // uses the initialiser form so fetchTodos() runs once, not on every render.
  const [todosPromise, setTodosPromise] = useState(() => fetchTodos())

  const refresh = () => setTodosPromise(fetchTodos())

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Todos</h1>
      <AddTodoForm onSuccess={refresh} />
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
