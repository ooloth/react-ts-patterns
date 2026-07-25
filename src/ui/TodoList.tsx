import { use, useOptimistic, useTransition } from 'react'
import { deleteTodo, parseTodo, toggleTodo } from '../api/todos'
import type { RawTodo, Todo, TodoId } from '../domain/schema'
import { AddTodoForm } from './AddTodoForm'

type Props = {
  todosPromise: Promise<RawTodo[]>
  onMutate: () => void
}

type OptimisticAction =
  | { type: 'add'; todo: Todo }
  | { type: 'toggle'; id: TodoId }
  | { type: 'delete'; id: TodoId }

function applyOptimistic(todos: Todo[], action: OptimisticAction): Todo[] {
  switch (action.type) {
    case 'add':
      return [...todos, action.todo]
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
  const [optimisticTodos, addOptimistic] = useOptimistic(todos, applyOptimistic)
  // isPending is true while a toggle or delete transition is in flight.
  // useTransition covers only the transitions started here — the add transition
  // is internal to useActionState and not included, but add is already optimistic
  // so there's nothing meaningful to indicate there.
  const [isPending, startTransition] = useTransition()

  // Wraps addOptimistic so AddTodoForm doesn't need to know about OptimisticAction.
  const handleAdd = (todo: Todo) => addOptimistic({ type: 'add', todo })

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
    <>
      <AddTodoForm onAdd={handleAdd} onMutate={onMutate} />
      {isPending && <p className="mt-2 text-xs text-gray-400">Updating…</p>}
      <ul className="mt-4 divide-y divide-gray-200">
        {optimisticTodos.map(todo => (
          <li key={todo.id} className="flex items-center gap-3 py-3">
            <input
              type="checkbox"
              checked={todo.status === 'completed'}
              onChange={() => handleToggle(todo.id)}
              className="h-4 w-4 cursor-pointer"
            />
            <span className={`flex-1 ${todo.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
              {todo.title}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
