import { describe, expect, test } from 'vitest'
import { TodoIdSchema } from './schema'
import type { Todo } from './schema'
import { filterTodos } from './filter'

const make = (id: string, title: string): Todo => ({
  id: TodoIdSchema.parse(id),
  title,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
})

const TODOS: Todo[] = [
  make('1', 'Read the React docs'),
  make('2', 'Build a todo app'),
  make('3', 'Review TypeScript'),
]

describe('filterTodos', () => {
  test('empty query returns all todos', () => {
    expect(filterTodos(TODOS, '')).toEqual(TODOS)
  })

  test('whitespace-only query returns all todos', () => {
    expect(filterTodos(TODOS, '   ')).toEqual(TODOS)
  })

  test('returns only todos whose title contains the query', () => {
    expect(filterTodos(TODOS, 'React')).toEqual([TODOS[0]])
  })

  test('match is case-insensitive', () => {
    expect(filterTodos(TODOS, 'react')).toEqual([TODOS[0]])
  })

  test('returns empty array when nothing matches', () => {
    expect(filterTodos(TODOS, 'XYZ')).toEqual([])
  })

  test('partial match works', () => {
    expect(filterTodos(TODOS, 'todo')).toEqual([TODOS[1]])
  })
})
