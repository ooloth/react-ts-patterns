import { startTransition, use, useEffect, useOptimistic, useRef } from 'react'
import { toast } from 'sonner'
import { deleteTodo, toggleTodo } from '../api/todos'
import type { TodosPromise } from '../api/todos'
import { applyOptimistic, parseTodo } from '../domain/todos'
import type { Todo, TodoId } from '../domain/schema'
import { AddTodoForm } from './AddTodoForm'
import { useMutationOptions } from './useMutationOptions'

type Props = {
  todosPromise: TodosPromise
  onMutate: () => void
}

export function TodoList({ todosPromise, onMutate }: Props) {
  const todos: Todo[] = use(todosPromise).map(parseTodo)
  const [optimisticTodos, addOptimistic] = useOptimistic(todos, applyOptimistic)
  const { mutationOptions, setFailNext } = useMutationOptions()
  const inputRef = useRef<HTMLInputElement>(null)

  // autoFocus doesn't fire reliably when React mounts after Suspense resolves
  // (it's a browser behaviour tied to initial DOM insertion, not React mounts).
  // useEffect is the reliable alternative.
  useEffect(() => { inputRef.current?.focus() }, [])

  const handleAdd = (todo: Todo) => {
    addOptimistic({ type: 'add', todo })
    // Re-focus after the optimistic add so the user can type the next todo
    // without clicking back into the input.
    inputRef.current?.focus()
  }

  const handleToggle = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'toggle', id })
      const toastId = toast.loading('Updating…')
      try {
        await toggleTodo(id, mutationOptions)
        toast.dismiss(toastId)
        onMutate()
      } catch {
        // useOptimistic rolls back the optimistic update automatically.
        toast.error('Failed to update — change rolled back', { id: toastId })
        setFailNext(false)
      }
    })
  }

  const handleDelete = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'delete', id })
      const toastId = toast.loading('Deleting…')
      try {
        await deleteTodo(id, mutationOptions)
        toast.dismiss(toastId)
        onMutate()
      } catch {
        toast.error('Failed to delete — item restored', { id: toastId })
        setFailNext(false)
      }
    })
  }

  return (
    <>
      <AddTodoForm ref={inputRef} onAdd={handleAdd} onMutate={onMutate} />
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
