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
    // Compute the focus target before the optimistic removal changes the list.
    // flushSync would let us render then focus immediately, but it can't be
    // used inside startTransition — setTimeout(fn, 0) defers until after commit.
    // getElementById is used instead of a ref map because the checkboxes already
    // carry stable IDs for the htmlFor/label association — reuse beats a parallel
    // data structure. A ref map would be the right call if those IDs didn't exist.
    const idx = visible.findIndex((t) => t.id === id)
    const nextFocusId = visible[idx + 1]?.id ?? visible[idx - 1]?.id ?? null

    startTransition(async () => {
      addOptimistic({ type: 'delete', id })
      setTimeout(() => {
        if (nextFocusId) {
          document.getElementById(`todo-${nextFocusId}`)?.focus()
        } else {
          inputRef.current?.focus()
        }
      }, 0)
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
        className="mt-6 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
      />
      <AddTodoForm ref={inputRef} onAdd={handleAdd} onMutate={onMutate} />
      {visible.length === 0 && !isPending && (
        <p role="status" className="mt-4 text-sm text-muted">
          {query.trim() ? `No todos match "${deferredQuery}"` : 'No todos yet'}
        </p>
      )}
      <ul aria-busy={isPending} className={`mt-4 divide-y divide-line ${isPending ? 'opacity-50' : ''}`}>
        {visible.map((todo) => (
          <li key={todo.id} className="flex items-center gap-3 py-3">
            <div className="relative h-[1.125rem] w-[1.125rem] flex-shrink-0">
              <input
                id={`todo-${todo.id}`}
                type="checkbox"
                checked={todo.status === 'completed'}
                onChange={() => handleToggle(todo.id)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none flex h-full w-full items-center justify-center rounded border-2 border-line bg-surface transition-colors duration-150 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-canvas"
              >
                {todo.status === 'completed' && (
                  <svg aria-hidden="true" className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <label
              htmlFor={`todo-${todo.id}`}
              className={`flex-1 cursor-pointer text-sm transition-colors duration-150 ${todo.status === 'completed' ? 'text-faint line-through' : 'text-text'}`}
            >
              {todo.title}
            </label>
            <button
              onClick={() => handleDelete(todo.id)}
              aria-label={`Delete ${todo.title}`}
              className="text-sm text-muted transition-colors hover:text-danger"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
