import { describe, expect, test } from 'vitest'
import { parseTodo } from './parse'

describe('parseTodo', () => {
  test('returns a typed Todo for a valid shape', () => {
    const raw = { id: 'x', title: 'Test', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }
    const todo = parseTodo(raw)
    expect(todo.title).toBe('Test')
    expect(todo.status).toBe('active')
  })

  test('throws for a missing required field', () => {
    expect(() => parseTodo({ id: 'x', title: 'Test', status: 'active' })).toThrow()
  })

  test('throws for an invalid status value', () => {
    expect(() =>
      parseTodo({ id: 'x', title: 'Test', status: 'done', createdAt: '2026-01-01T00:00:00.000Z' }),
    ).toThrow()
  })

  test('throws for a non-datetime createdAt', () => {
    expect(() =>
      parseTodo({ id: 'x', title: 'Test', status: 'active', createdAt: '2026-01-01' }),
    ).toThrow()
  })

  test('throws for an empty title', () => {
    expect(() =>
      parseTodo({ id: 'x', title: '', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }),
    ).toThrow()
  })
})
