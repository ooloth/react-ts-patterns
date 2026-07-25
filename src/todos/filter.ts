import type { Todo } from './schema'

export function filterTodos(todos: Todo[], query: string): Todo[] {
  if (!query.trim()) return todos
  const q = query.toLowerCase()
  return todos.filter((t) => t.title.toLowerCase().includes(q))
}
