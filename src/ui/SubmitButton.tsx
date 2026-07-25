import { useFormStatus } from 'react-dom'

type Props = {
  label: string
  disabled?: boolean
}

// useFormStatus must be called in a component that is rendered *inside* a <form>.
// It cannot be called in the same component that renders the form — React reads
// form context from the nearest ancestor <form>, so the component must be a
// descendant, not a sibling or the same level.
export function SubmitButton({ label, disabled = false }: Props) {
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
