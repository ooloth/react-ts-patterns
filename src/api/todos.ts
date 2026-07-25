import { TodoIdSchema, TodoSchema } from '../domain/schema'
import type { CreateTodoInput, RawTodo, Todo, TodoId } from '../domain/schema'

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

export async function addTodo(input: CreateTodoInput): Promise<RawTodo> {
  await delay(400)
  const todo: Todo = {
    // crypto.randomUUID() is available in all modern browsers and Node 19+
    id: TodoIdSchema.parse(crypto.randomUUID()),
    title: input.title,
    status: input.status,
    createdAt: new Date().toISOString(),
  }
  store = [...store, todo]
  return { ...todo }
}

// Returns the updated todo so callers can reconcile optimistic state.
export async function toggleTodo(id: TodoId): Promise<RawTodo> {
  await delay(300)
  store = store.map(todo =>
    todo.id === id
      ? { ...todo, status: todo.status === 'active' ? 'completed' : 'active' } satisfies Todo
      : todo
  )
  const updated = store.find(todo => todo.id === id)
  if (!updated) throw new Error(`Todo ${id} not found`)
  return { ...updated }
}

export async function deleteTodo(id: TodoId): Promise<void> {
  await delay(300)
  store = store.filter(todo => todo.id !== id)
}
