import { TodoIdSchema, TodoSchema } from '../domain/schema'
import type { RawTodo, Todo } from '../domain/schema'

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// Mutable in-memory store — mutations replace entries, never mutate objects.
// TodoIdSchema.parse() brands the string literals so they satisfy TodoId.
let store: Todo[] = [
  { id: TodoIdSchema.parse('1'), title: 'Read the React 19 docs', status: 'active', createdAt: '2026-07-25T09:00:00.000Z' },
  { id: TodoIdSchema.parse('2'), title: 'Build this todo app', status: 'active', createdAt: '2026-07-25T09:01:00.000Z' },
  { id: TodoIdSchema.parse('3'), title: 'Review TypeScript utility types', status: 'completed', createdAt: '2026-07-25T09:02:00.000Z' },
]

// Returns unknown[] — callers must parse before trusting the shape.
export async function fetchTodos(): Promise<RawTodo[]> {
  await delay(600)
  // Spread each object to simulate serialisation: the values cross a boundary
  // and arrive as plain objects, not typed Todo instances.
  return store.map(todo => ({ ...todo }))
}

// Parses a single raw value. Returns the Todo on success, throws on invalid shape.
// Used by call sites that have already retrieved raw data and need to validate it.
export function parseTodo(raw: RawTodo): Todo {
  return TodoSchema.parse(raw)
}
