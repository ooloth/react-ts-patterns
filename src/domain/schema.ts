import { z } from 'zod'

// An opaque ID — prevents passing any string where a TodoId is expected.
// z.string().brand<'TodoId'>() marks the *output* type only, so plain strings
// are accepted as input but the parsed value carries the brand.
export const TodoIdSchema = z.string().brand<'TodoId'>()
export type TodoId = z.infer<typeof TodoIdSchema>

// A discriminated string union instead of a boolean — extensible (e.g. 'archived')
// and self-documenting at call sites.
export const TodoStatusSchema = z.enum(['active', 'completed'])
export type TodoStatus = z.infer<typeof TodoStatusSchema>

// The core domain entity. Readonly enforces immutability — mutations return
// new objects rather than modifying in place.
export const TodoSchema = z.object({
  id: TodoIdSchema,
  title: z.string().min(1),
  status: TodoStatusSchema,
  createdAt: z.string().datetime(),
})
export type Todo = Readonly<z.infer<typeof TodoSchema>>

// What a caller submits to create a todo — id and createdAt are assigned
// server-side, so callers must not (and cannot) provide them.
export const CreateTodoInputSchema = TodoSchema.omit({ id: true, createdAt: true })
export type CreateTodoInput = z.infer<typeof CreateTodoInputSchema>

// The shape the fake API returns before parsing — unknown forces callers to
// prove the shape rather than trusting it. This is what .safeParse() accepts.
export type RawTodo = unknown
