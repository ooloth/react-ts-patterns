# Todo App — React 19 Interview Prep

## Outcomes

Be able to speak confidently about:
- Why `useEffect` + `useState` is no longer the default for async data and mutations
- How `Suspense` changes the data-fetching mental model
- What `useActionState`, `useFormStatus`, and `useOptimistic` each solve
- How the React Compiler changes (or removes) the memoization conversation
- TypeScript domain modeling, runtime parsing, and utility type usage in a React context

---

## What We're Building

A todo list with fake async latency on every operation — no real server, but written as if there were one. Operations: load todos, add, toggle complete, delete.

---

## Build Sequence

### 1. Domain layer + mock API
- Define Zod schemas; derive all types with `z.infer<typeof Schema>`
- Use `.safeParse()` at API boundaries (returns result object); `.parse()` internally where shape is guaranteed
- Utility types: `Omit` / Zod `.omit()`, `Readonly`, `ReadonlyArray`, `ReturnType`, `Pick`
- `satisfies` for config/label maps; `as const` for enums
- Fake `fetchTodos`, `addTodo`, `toggleTodo`, `deleteTodo` — each returns a `Promise` with a short delay and returns `RawTodo` (unvalidated); parse at the call site

### 2. Suspense + `use()` + Error boundary
- Suspend the todo list on the initial fetch using `use(promise)`
- Wrap in `<Suspense fallback={...}>` for loading state
- Wrap in an `<ErrorBoundary>` (class component) for error state
- **Interview talking point:** how this inverts the data-fetching model vs. `useEffect`

### 3. Add with `useActionState` + `useFormStatus`
- `<form action={asyncFn}>` — React 19 supports async functions directly as form actions
- `useActionState` manages `{ pending, error, data }`; transition is implicit
- `useFormStatus` inside the submit button for disabled/spinner state without prop drilling
- **Interview talking point:** how this replaces `useState` + `useEffect` + manual error handling

### 4. Toggle + delete with `startTransition` + `useOptimistic`
- Button click handlers: call `startTransition(async () => { addOptimistic(...); await mutation() })`
- Transition is explicit here — `useOptimistic` requires being inside a transition to behave correctly
- UI updates immediately; rolls back automatically on error
- **Interview talking point:** `useActionState` wraps the transition for forms; `startTransition` is the explicit equivalent for imperative mutations — same underlying model, different entry point

---

## Domain Vocabulary

| Concept | Name | Notes |
|---------|------|-------|
| A todo item | `Todo` | derived: `z.infer<typeof TodoSchema>` |
| Opaque ID | `TodoId` | branded: `string & { _brand: 'TodoId' }` |
| Completion state | `TodoStatus` | `'active' \| 'completed'` |
| Input to create | `CreateTodoInput` | via `TodoSchema.omit({ id: true, createdAt: true })` |
| Unvalidated API shape | `RawTodo` | what the fake API returns before `.safeParse()` |
| Generic async state | `RemoteData<T>` | `{ status: 'idle' } \| { status: 'loading' } \| { status: 'success', data: T } \| { status: 'error', error: string }` — a known term; name it in the interview |

## TypeScript Angles to Demonstrate

| Pattern | Where |
|---------|-------|
| Zod schema → derived type | All domain types via `z.infer<>` |
| `.safeParse()` at boundaries | Mock API call sites |
| Branded / opaque ID | `TodoId` — prevents passing arbitrary strings as IDs |
| Discriminated union | `RemoteData<T>` for generic async state |
| `Readonly` / `ReadonlyArray` | Todo type and list props |
| `satisfies` | Status label map: `const labels = { active: 'Active', completed: 'Done' } satisfies Record<TodoStatus, string>` |
| `ReturnType` | Type helpers derived from mock API functions |
| Generic action type | Typed wrapper around `useActionState` result |

---

## Folder Structure

```
src/
  domain/       # pure types and Zod schemas — no React, no I/O
  api/          # mock async functions — imports from domain/, has delays/side effects
  ui/           # React components — imports from both
  App.tsx       # root component
  main.tsx      # entry point
```

Dependency direction: `domain` ← `api` ← `ui`. Nothing in `domain/` imports from `api/` or `ui/`.

---

## Later / Stretch

**Pure functions and unit testability** — any logic that maps `(state, action) → newState`
belongs outside components as a plain function. `applyOptimistic` already follows this
pattern. A useful extension: extract all such reducers into `domain/` and write unit
tests for them without React. Keeps components thin and logic independently verifiable.

**Finite state machines** — `ActionState` in `AddTodoForm` and `RemoteData<T>` are
implicit FSMs. For UI with more complex state transitions, making them explicit (e.g.
with `xstate` or a hand-rolled typed reducer) prevents impossible states at the
component level, not just the type level. Out of scope for this exercise but worth
naming in the interview as a known technique.

---

## What to Skip

- Routing, auth, real persistence — out of scope
- CSS beyond minimal layout — not the point
- Testing — not enough time; mention it in conversation instead
- `useTransition` directly — `useActionState` wraps it; mention the relationship verbally
