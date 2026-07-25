import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { Ref } from 'react'
import { toast } from 'sonner'
import { addTodo } from './store'
import { TodoIdSchema } from './schema'
import type { Todo } from './schema'
import { useMutationOptions } from '../debug/useMutationOptions'

type Props = {
  // React 19: ref is a plain prop — no forwardRef wrapper needed.
  // Before React 19, passing a ref to a custom component required forwardRef.
  ref?: Ref<HTMLInputElement>
  onAdd: (todo: Todo) => void
  onMutate: () => void
}

// useFormStatus must be called in a descendant of the <form>, not the same
// component that renders it — React reads form context from the nearest
// ancestor <form>.
function SubmitButton({ label, disabled = false }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {label}
    </button>
  )
}

export function AddTodoForm({ ref, onAdd, onMutate }: Props) {
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
      toast.loading('Adding…', { id: 'todo-add' })
      try {
        await addTodo(todo, mutationOptions)
        toast.dismiss('todo-add')
        onMutate()
      } catch {
        toast.error('Failed to add — item removed', { id: 'todo-add' })
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
        ref={ref}
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
