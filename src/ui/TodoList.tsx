import { use } from 'react'
import { parseTodo } from '../api/todos'
import type { RawTodo, Todo } from '../domain/schema'

type Props = {
  todosPromise: Promise<RawTodo[]>
}

// use() reads the promise during render. If the promise is pending, React
// suspends this component — the nearest <Suspense> fallback renders instead.
// If the promise rejects, the nearest error boundary catches it.
// This inverts the old useEffect model: data requirements are declared at
// render time, not wired up after mount.
export function TodoList({ todosPromise }: Props) {
  const raw = use(todosPromise)
  const todos: Todo[] = raw.map(parseTodo)

  return (
    <ul className="mt-4 divide-y divide-gray-200">
      {todos.map(todo => (
        <li key={todo.id} className="flex items-center gap-3 py-3">
          <span className={todo.status === 'completed' ? 'line-through text-gray-400' : ''}>
            {todo.title}
          </span>
        </li>
      ))}
    </ul>
  )
}
