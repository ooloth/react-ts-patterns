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
