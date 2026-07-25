import { TodoSchema } from './schema'
import type { RawTodo, Todo } from './schema'

export function parseTodo(raw: RawTodo): Todo {
  return TodoSchema.parse(raw)
}
