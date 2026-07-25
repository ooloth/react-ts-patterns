import { useActionState } from 'react'
import { addTodo } from '../api/todos'
import { SubmitButton } from './SubmitButton'

type Props = {
  onSuccess: () => void
}

type ActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

// useActionState wraps an async action and returns [state, action, isPending].
// Passing the action to <form action={...}> makes React treat the submission as
// a transition — the UI stays interactive while the action runs, and isPending
// reflects the in-flight state. No useState or useEffect needed for this flow.
export function AddTodoForm({ onSuccess }: Props) {
  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const title = formData.get('title')
      if (typeof title !== 'string' || title.trim() === '') {
        return { status: 'error', message: 'Title is required' }
      }
      await addTodo({ title: title.trim(), status: 'active' })
      onSuccess()
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
      <SubmitButton label="Add" pendingLabel="Adding…" />
      {state.status === 'error' && (
        <p className="mt-1 text-sm text-red-600">{state.message}</p>
      )}
    </form>
  )
}
