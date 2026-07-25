import { useActionState, useState } from 'react'
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

export function AddTodoForm({ onAdd, onMutate }: Props) {
  const [title, setTitle] = useState('')
  const { mutationOptions, setFailNext } = useMutationOptions()

  const [, formAction] = useActionState(
    async (_prev: null, formData: FormData): Promise<null> => {
      const todo: Todo = {
        id: TodoIdSchema.parse(crypto.randomUUID()),
        title: (formData.get('title') as string).trim(),
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
      return null
    },
    null,
  )

  return (
    // onSubmit fires synchronously on submit; action runs async after.
    // Clearing title here gives optimistic input reset before the await.
    <form action={formAction} onSubmit={() => setTitle('')} className="mt-6 flex gap-2">
      <input
        name="title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="New todo…"
        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <SubmitButton label="Add" disabled={title.trim() === ''} />
    </form>
  )
}
