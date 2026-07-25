import { DEFAULT_MUTATION_OPTIONS, DELAY_PRESETS } from '../debug/config'
import type { MutationOptions } from '../debug/config'
import { TodoIdSchema } from './schema'
import type { RawTodo, Todo, TodoId } from './schema'
import { toggleStatus } from './state-transitions'

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
      },
      { once: true },
    )
  })

// Mutable in-memory store — mutations replace entries, never mutate objects.
// TodoIdSchema.parse() brands the string literals so they satisfy TodoId.
let store: Todo[] = [
  {
    id: TodoIdSchema.parse('1'),
    title: 'Read the React 19 docs',
    status: 'active',
    createdAt: '2026-07-25T09:00:00.000Z',
  },
  {
    id: TodoIdSchema.parse('2'),
    title: 'Build this todo app',
    status: 'active',
    createdAt: '2026-07-25T09:01:00.000Z',
  },
  {
    id: TodoIdSchema.parse('3'),
    title: 'Review TypeScript utility types',
    status: 'completed',
    createdAt: '2026-07-25T09:02:00.000Z',
  },
]

// ReturnType<> derives a type from a function's return type rather than
// writing it by hand — if fetchTodos ever changes, TodosPromise updates too.
export type TodosPromise = ReturnType<typeof fetchTodos>

// Returns unknown[] — callers must parse before trusting the shape.
export async function fetchTodos(delayMs = DELAY_PRESETS.instant): Promise<RawTodo[]> {
  await delay(delayMs)
  // Spread each object to simulate serialisation: the values cross a boundary
  // and arrive as plain objects, not typed Todo instances.
  return store.map((todo) => ({ ...todo }))
}

// Accepts a fully-formed Todo — the caller (client) is responsible for
// generating id and createdAt. This lets the optimistic item and the real
// item share the same key, so React reconciles them without a flicker.
export async function addTodo(
  todo: Todo,
  options: MutationOptions = DEFAULT_MUTATION_OPTIONS,
): Promise<RawTodo> {
  await delay(options.delayMs)
  if (options.shouldFail) throw new Error('Simulated failure')
  store = [...store, todo]
  return { ...todo }
}

export async function toggleTodo(
  id: TodoId,
  options: MutationOptions = DEFAULT_MUTATION_OPTIONS,
  signal?: AbortSignal,
): Promise<RawTodo> {
  await delay(options.delayMs, signal)
  if (options.shouldFail) throw new Error('Simulated failure')
  store = store.map((todo) =>
    todo.id === id ? ({ ...todo, status: toggleStatus(todo.status) } satisfies Todo) : todo,
  )
  const updated = store.find((todo) => todo.id === id)
  if (!updated) throw new Error(`Todo ${id} not found`)
  return { ...updated }
}

export async function deleteTodo(
  id: TodoId,
  options: MutationOptions = DEFAULT_MUTATION_OPTIONS,
): Promise<void> {
  await delay(options.delayMs)
  if (options.shouldFail) throw new Error('Simulated failure')
  store = store.filter((todo) => todo.id !== id)
}
