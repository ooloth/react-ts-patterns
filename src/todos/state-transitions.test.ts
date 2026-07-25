import { describe, expect, test } from 'vitest'
import { TodoIdSchema } from './schema'
import type { Todo } from './schema'
import { applyOptimistic, toggleStatus } from './state-transitions'

// Shared fixtures — frozen to catch accidental mutation in applyOptimistic
const A: Todo = Object.freeze({
  id: TodoIdSchema.parse('a'),
  title: 'Buy milk',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
})
const B: Todo = Object.freeze({
  id: TodoIdSchema.parse('b'),
  title: 'Read docs',
  status: 'completed',
  createdAt: '2026-01-01T00:01:00.000Z',
})

describe('toggleStatus', () => {
  test('active → completed', () => {
    expect(toggleStatus('active')).toBe('completed')
  })

  test('completed → active', () => {
    expect(toggleStatus('completed')).toBe('active')
  })
})

describe('applyOptimistic — add', () => {
  test('appends the todo to an existing list', () => {
    expect(applyOptimistic([A], { type: 'add', todo: B })).toEqual([A, B])
  })

  test('works on an empty list', () => {
    expect(applyOptimistic([], { type: 'add', todo: A })).toEqual([A])
  })

  test('does not mutate the original array', () => {
    const original = [A]
    applyOptimistic(original, { type: 'add', todo: B })
    expect(original).toHaveLength(1)
  })
})

describe('applyOptimistic — toggle', () => {
  test('flips the status of the matching todo', () => {
    const [result] = applyOptimistic([A], { type: 'toggle', id: A.id })
    expect(result.status).toBe('completed')
  })

  test('leaves non-matching todos unchanged', () => {
    const [, second] = applyOptimistic([A, B], { type: 'toggle', id: A.id })
    expect(second).toEqual(B)
  })

  test('is a no-op when no todo matches the id', () => {
    const result = applyOptimistic([A], { type: 'toggle', id: TodoIdSchema.parse('z') })
    expect(result).toEqual([A])
  })
})

describe('applyOptimistic — delete', () => {
  test('removes the matching todo', () => {
    expect(applyOptimistic([A, B], { type: 'delete', id: A.id })).toEqual([B])
  })

  test('leaves non-matching todos unchanged', () => {
    expect(applyOptimistic([A, B], { type: 'delete', id: B.id })).toEqual([A])
  })

  test('is a no-op when no todo matches the id', () => {
    const result = applyOptimistic([A], { type: 'delete', id: TodoIdSchema.parse('z') })
    expect(result).toEqual([A])
  })
})
