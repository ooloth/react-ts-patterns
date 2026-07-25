import { startTransition, use, useOptimistic } from 'react'
import { deleteTodo, parseTodo, toggleTodo } from '../api/todos'
import type { RawTodo, Todo, TodoId } from '../domain/schema'

type Props = {
  todosPromise: Promise<RawTodo[]>
  onMutate: () => void
}

// Discriminated union keeps each optimistic action's payload unambiguous.
type OptimisticAction =
  | { type: 'toggle'; id: TodoId }
  | { type: 'delete'; id: TodoId }

function applyOptimistic(todos: Todo[], action: OptimisticAction): Todo[] {
  switch (action.type) {
    case 'toggle':
      return todos.map(t =>
        t.id === action.id
          ? { ...t, status: t.status === 'active' ? 'completed' : 'active' }
          : t
      )
    case 'delete':
      return todos.filter(t => t.id !== action.id)
  }
}

export function TodoList({ todosPromise, onMutate }: Props) {
  const todos: Todo[] = use(todosPromise).map(parseTodo)

  // useOptimistic returns a derived list that reflects in-flight changes.
  // While a transition is pending, optimisticTodos shows the expected result.
  // When the transition completes (or fails), React replaces it with the real
  // todos — rolling back automatically on error.
  const [optimisticTodos, addOptimistic] = useOptimistic(todos, applyOptimistic)

  // startTransition is explicit here (no form action wrapping it) because
  // these are button-click mutations, not form submissions. The transition
  // marks the async work as non-urgent and is what makes useOptimistic work —
  // the optimistic update applies immediately, the await runs in the background.
  const handleToggle = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'toggle', id })
      try {
        await toggleTodo(id)
        onMutate()
      } catch {
        // Optimistic update rolls back automatically when the transition ends.
      }
    })
  }

  const handleDelete = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'delete', id })
      try {
        await deleteTodo(id)
        onMutate()
      } catch {
        // Optimistic update rolls back automatically when the transition ends.
      }
    })
  }

  return (
    <ul className="mt-4 divide-y divide-gray-200">
      {optimisticTodos.map(todo => (
        <li key={todo.id} className="flex items-center gap-3 py-3">
          <button
            onClick={() => handleToggle(todo.id)}
            className="flex-1 text-left"
          >
            <span className={todo.status === 'completed' ? 'line-through text-gray-400' : ''}>
              {todo.title}
            </span>
          </button>
          <button
            onClick={() => handleDelete(todo.id)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
