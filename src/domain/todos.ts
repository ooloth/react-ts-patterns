import { TodoSchema } from './schema'
import type { RawTodo, Todo, TodoId, TodoStatus } from './schema'

export type OptimisticAction =
  | { type: 'add'; todo: Todo }
  | { type: 'toggle'; id: TodoId }
  | { type: 'delete'; id: TodoId }

export function toggleStatus(status: TodoStatus): TodoStatus {
  return status === 'active' ? 'completed' : 'active'
}

export function applyOptimistic(todos: Todo[], action: OptimisticAction): Todo[] {
  switch (action.type) {
    case 'add':
      return [...todos, action.todo]
    case 'toggle':
      return todos.map(t => t.id === action.id ? { ...t, status: toggleStatus(t.status) } : t)
    case 'delete':
      return todos.filter(t => t.id !== action.id)
  }
}

// Parses an unknown value into a typed Todo. Throws on invalid shape.
// Called at the API boundary after every fetch or mutation response.
export function parseTodo(raw: RawTodo): Todo {
  return TodoSchema.parse(raw)
}
