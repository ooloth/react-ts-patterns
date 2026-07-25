import { useActionState } from 'react'
import { toast } from 'sonner'
import { addTodo } from '../api/todos'
import { TodoIdSchema } from '../domain/schema'
import type { Todo } from '../domain/schema'
import { SubmitButton } from './SubmitButton'
import { useMutationOptions } from './useMutationOptions'

type Props = {
  onAdd: (todo: Todo) => void
  onMutate: () => void
}

type ActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

export function AddTodoForm({ onAdd, onMutate }: Props) {
  const { mutationOptions, setFailNext } = useMutationOptions()

  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const title = formData.get('title')
      if (typeof title !== 'string' || title.trim() === '') {
        return { status: 'error', message: 'Title is required' }
      }

      const todo: Todo = {
        id: TodoIdSchema.parse(crypto.randomUUID()),
        title: title.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      onAdd(todo)
      const toastId = toast.loading('Adding…')
      try {
        await addTodo(todo, mutationOptions)
        toast.dismiss(toastId)
        onMutate()
      } catch {
        toast.error('Failed to add — item removed', { id: toastId })
        setFailNext(false)
      }
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
