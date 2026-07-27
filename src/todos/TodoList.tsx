import { startTransition, use, useDeferredValue, useId, useOptimistic, useRef, useState } from 'react'
import { toast } from 'sonner'
import { deleteTodo, toggleTodo } from './store'
import type { TodosPromise } from './store'
import { applyOptimistic } from './state-transitions'
import { parseTodo } from './parse'
import { filterTodos } from './filter'
import type { Todo, TodoId } from './schema'
import { AddTodoForm } from './AddTodoForm'
import { useMutationOptions } from '../debug/useMutationOptions'

type Props = {
  todosPromise: TodosPromise
  onMutate: () => void
}

export function TodoList({ todosPromise, onMutate }: Props) {
  const todos: Todo[] = use(todosPromise).map(parseTodo)
  const [optimisticTodos, addOptimistic] = useOptimistic(todos, applyOptimistic)
  const { mutationOptions, setFailNext } = useMutationOptions()
  const inputRef = useRef<HTMLInputElement>(null)
  const toggleControllerRef = useRef<AbortController | null>(null)
  // useId: stable unique ID per instance — correct when the component is reused or SSR'd.
  const filterId = useId()
  const [query, setQuery] = useState('')
  // useDeferredValue keeps the input responsive by letting React deprioritize
  // the filtered-list re-render when it can't keep up with fast typing.
  const deferredQuery = useDeferredValue(query)
  const isPending = query !== deferredQuery
  // React Compiler: no useMemo — derived values like this are memoized automatically.
  const visible = filterTodos(optimisticTodos, deferredQuery)

  const handleAdd = (todo: Todo) => {
    addOptimistic({ type: 'add', todo })
    // Re-focus after the optimistic add so the user can type the next todo
    // without clicking back into the input.
    inputRef.current?.focus()
  }

  const handleToggle = (id: TodoId) => {
    toggleControllerRef.current?.abort()
    const controller = new AbortController()
    toggleControllerRef.current = controller

    startTransition(async () => {
      addOptimistic({ type: 'toggle', id })
      toast.loading('Updating…', { id: 'todo-update' })
      try {
        await toggleTodo(id, mutationOptions, controller.signal)
        toast.dismiss('todo-update')
        onMutate()
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        // useOptimistic rolls back the optimistic update automatically.
        toast.error('Failed to update — change rolled back', { id: 'todo-update' })
        setFailNext(false)
      }
    })
  }

  const handleDelete = (id: TodoId) => {
    startTransition(async () => {
      addOptimistic({ type: 'delete', id })
      toast.loading('Deleting…', { id: 'todo-delete' })
      try {
        await deleteTodo(id, mutationOptions)
        toast.dismiss('todo-delete')
        onMutate()
      } catch {
        toast.error('Failed to delete — item restored', { id: 'todo-delete' })
        setFailNext(false)
      }
    })
  }

  return (
    <>
      <label htmlFor={filterId} className="sr-only">Filter todos</label>
      <input
        id={filterId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter todos…"
        className="mt-6 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <AddTodoForm ref={inputRef} onAdd={handleAdd} onMutate={onMutate} />
      <ul className={`mt-4 divide-y divide-gray-200 ${isPending ? 'opacity-50' : ''}`}>
        {visible.map((todo) => (
          <li key={todo.id} className="flex items-center gap-3 py-3">
            <input
              id={`todo-${todo.id}`}
              type="checkbox"
              checked={todo.status === 'completed'}
              onChange={() => handleToggle(todo.id)}
              className="h-4 w-4 cursor-pointer"
            />
            <label
              htmlFor={`todo-${todo.id}`}
              className={`flex-1 cursor-pointer ${todo.status === 'completed' ? 'line-through text-gray-400' : ''}`}
            >
              {todo.title}
            </label>
            <button
              onClick={() => handleDelete(todo.id)}
              aria-label={`Delete ${todo.title}`}
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
