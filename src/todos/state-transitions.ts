import type { Todo, TodoId, TodoStatus } from './schema'

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
