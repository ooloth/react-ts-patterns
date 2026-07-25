# React 19 + TypeScript playground

A todo app built to explore modern React 19 APIs and TypeScript best practices.

## Setup

```bash
npm install
npm run dev
```

## React 19

| Pattern | How used |
|---|---|
| React Compiler | Enabled via `@vitejs/plugin-react` — automatically memoizes components and values, eliminating the need for `useMemo`, `useCallback`, and `React.memo` |
| `use(promise)` | `TodoList` unwraps `todosPromise` in render; Suspense catches the pending state and shows a fallback |
| `use(context)` | `TodoList`, `AddTodoForm`, and `DebugToolbar` read `DebugContext` — unlike `useContext`, `use()` can be called conditionally |
| `useActionState` | `AddTodoForm` manages the form submission cycle: idle → submitting → idle/error |
| `<form action={fn}>` | `AddTodoForm` passes the function from `useActionState` directly to the form's `action` prop — the React 19 alternative to `onSubmit` that integrates with `useFormStatus` |
| `useFormStatus` | `SubmitButton` disables itself while its parent `<form>` is pending — must be a descendant of the form, not the form itself |
| `useOptimistic` | `TodoList` applies toggle and delete instantly in the UI; React rolls back the optimistic state automatically if the server call fails |
| `startTransition` (sync) | Wraps re-fetches after mutations so Suspense keeps the current list visible instead of flashing the loading fallback |
| `startTransition` (async) | React 19 extended `startTransition` to accept async functions — toggle and delete use this to sequence the optimistic update, server call, and re-fetch inside a single transition |
| `<Context value={...}>` | `App` provides `DebugContext` with React 19's shorthand — no `.Provider` needed |
| Suspense + ErrorBoundary | `App` wraps `TodoList` in both; `react-error-boundary` supplies the `ErrorBoundary` component |

## TypeScript

| Pattern | How used |
|---|---|
| `z.infer<>` | All types (`Todo`, `TodoId`, `TodoStatus`, etc.) are derived from Zod schemas — never written by hand |
| Branded types | `TodoId = z.string().brand<'TodoId'>()` — the type system rejects a plain `string` where a validated ID is required |
| `satisfies` | `DELAY_PRESETS satisfies Record<string, number>` preserves the literal key types (`'instant' \| 'normal' \| 'slow'`) while enforcing the value shape; also used in `toggleTodo` to assert the spread object still satisfies `Todo` |
| Discriminated unions | `OptimisticAction` (`add` / `toggle` / `delete`), `ActionState` (`idle` / `error`), and `RemoteData<T>` (`idle` / `loading` / `success` / `error`) each exhaustively switch on `type` / `status` |
| `Readonly<>` | `Todo` is `Readonly<z.infer<typeof TodoSchema>>` — mutations must replace the object, never mutate it in place |
| `z.enum()` | `TodoStatus` is derived from a Zod enum so the schema and the type stay in sync |
| `TodoSchema.omit()` | `CreateTodoInput` is derived structurally — no manual duplication of fields |
