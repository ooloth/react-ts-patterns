# React 19 + TypeScript playground

A todo app (load, add, toggle, delete — with simulated async latency) built to explore why
`useEffect` + `useState` is no longer the default for data fetching and mutations, how Suspense
changes the mental model, what `useActionState`, `useFormStatus`, and `useOptimistic` each solve,
and how the React Compiler changes the memoization conversation.

## Setup

```bash
npm install
npm run dev        # start dev server
npm test           # Vitest unit tests (pure domain functions)
npm run test:e2e   # Playwright e2e tests (full app in Chromium)
```

## Structure

```
src/
  domain/   # Zod schemas and derived types — no React, no I/O
  api/      # mock async functions — imports from domain/, simulates network delays
  ui/       # React components — imports from both
```

Dependency direction: `domain` ← `api` ← `ui`. Nothing in `domain/` imports from `api/` or `ui/`.

## Domain vocabulary

| Name | What it represents |
|---|---|
| `Todo` | A todo item — `Readonly<z.infer<typeof TodoSchema>>` |
| `TodoId` | Branded string — the type system rejects a plain `string` where a validated ID is required |
| `TodoStatus` | `'active' \| 'completed'` — derived from a Zod enum |
| `CreateTodoInput` | The fields required to create a todo — derived via `TodoSchema.omit()` |
| `RawTodo` | `unknown` — what the mock API returns before parsing; callers must validate before use |
| `RemoteData<T>` | Generic async state: `idle \| loading \| success \| error` — a named pattern worth knowing |

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
| `ref` as a plain prop | `AddTodoForm` accepts `ref` as a regular prop; `TodoList` passes `ref={inputRef}` with no `forwardRef` wrapper — the React 19 way to expose a child element's ref to a parent |
| `<Context value={...}>` | `App` provides `DebugContext` with React 19's shorthand — no `.Provider` needed |
| Suspense + ErrorBoundary | `App` wraps `TodoList` in both; `react-error-boundary` supplies the `ErrorBoundary` component |
| `eslint-plugin-react-compiler` | Errors on Rules of React violations that cause the compiler to bail out on a component and skip automatic memoization |
| `eslint-plugin-react-hooks` | Enforces the rules of hooks (call order, exhaustive deps) |
| `eslint-plugin-react-x` | Enforces broader React correctness rules beyond hooks |
| `eslint-plugin-react-dom` | Enforces React DOM-specific best practices |

## TypeScript

| Pattern | How used |
|---|---|
| `z.infer<>` | All types (`Todo`, `TodoId`, `TodoStatus`, etc.) are derived from Zod schemas — never written by hand |
| Branded types | `TodoId = z.string().brand<'TodoId'>()` — the type system rejects a plain `string` where a validated ID is required |
| `satisfies` | `DELAY_PRESETS satisfies Record<string, number>` preserves the literal key types (`'instant' \| 'normal' \| 'slow'`) while enforcing the value shape; also used in `toggleTodo` to assert the spread object still satisfies `Todo` |
| Discriminated unions | `OptimisticAction` (`add` / `toggle` / `delete`) and `RemoteData<T>` (`idle` / `loading` / `success` / `error`) each exhaustively switch on `type` / `status` |
| `Readonly<>` | `Todo` is `Readonly<z.infer<typeof TodoSchema>>` — mutations must replace the object, never mutate it in place |
| `z.enum()` | `TodoStatus` is derived from a Zod enum so the schema and the type stay in sync |
| `TodoSchema.omit()` | `CreateTodoInput` is derived structurally — no manual duplication of fields |
| `ReturnType<>` | `TodosPromise = ReturnType<typeof fetchTodos>` — the prop and state types stay in sync with the function signature automatically |

## Design notes

**`applyOptimistic` as a pure function** — any logic of the shape `(state, action) → newState`
belongs outside components as a plain function. `applyOptimistic` follows this pattern: it is
independently testable without React and keeps `TodoList` thin. A natural extension would be to
move all such reducers into `domain/` and unit-test them there.

**Implicit finite state machines** — `ActionState` in `AddTodoForm` and `RemoteData<T>` are both
implicit FSMs: a fixed set of states with defined transitions. For more complex UI, making these
explicit (e.g. with XState or a typed reducer) prevents impossible states at the component level,
not just the type level.
