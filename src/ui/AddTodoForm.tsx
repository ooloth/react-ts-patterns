import { useActionState } from 'react'
import { addTodo } from '../api/todos'
import { TodoIdSchema } from '../domain/schema'
import type { Todo } from '../domain/schema'
import { SubmitButton } from './SubmitButton'

type Props = {
  // Called immediately with the full Todo before the API roundtrip, so the
  // parent can apply an optimistic update using the same id and shape.
  onAdd: (todo: Todo) => void
  onMutate: () => void
}

type ActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

export function AddTodoForm({ onAdd, onMutate }: Props) {
  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const title = formData.get('title')
      if (typeof title !== 'string' || title.trim() === '') {
        return { status: 'error', message: 'Title is required' }
      }

      // Generate id and createdAt on the client so the optimistic item and
      // the stored item share the same key — no flicker on reconciliation.
      const todo: Todo = {
        id: TodoIdSchema.parse(crypto.randomUUID()),
        title: title.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      onAdd(todo)
      await addTodo(todo)
      onMutate()
      return { status: 'idle' }
    },
    { status: 'idle' },
  )

  return (
    <form action={formAction} className="mt-6 flex gap-2">
      <input
        name="title"
        type="text"
        placeholder="New todo…"
        required
        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <SubmitButton label="Add" />
      {state.status === 'error' && (
        <p className="mt-1 text-sm text-red-600">{state.message}</p>
      )}
    </form>
  )
}
