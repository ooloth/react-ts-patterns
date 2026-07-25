import { startTransition, use, useOptimistic } from 'react'
import { toast } from 'sonner'
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

  const handleAdd = (todo: Todo) => addOptimistic({ type: 'add', todo })

  const handleToggle = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'toggle', id })
      const toastId = toast.loading('Updating…')
      try {
        await toggleTodo(id)
        toast.dismiss(toastId)
        onMutate()
      } catch {
        // useOptimistic rolls back the optimistic update automatically.
        toast.error('Failed to update — change rolled back', { id: toastId })
      }
    })
  }

  const handleDelete = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'delete', id })
      const toastId = toast.loading('Deleting…')
      try {
        await deleteTodo(id)
        toast.dismiss(toastId)
        onMutate()
      } catch {
        toast.error('Failed to delete — item restored', { id: toastId })
      }
    })
  }

  return (
    <>
      <AddTodoForm onAdd={handleAdd} onMutate={onMutate} />
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
