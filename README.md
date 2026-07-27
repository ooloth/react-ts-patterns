# React 19 + TypeScript playground

A todo app (load, add, toggle, delete — with simulated async latency) built as a playground for
demonstrating modern React 19, TypeScript and UX patterns, where UX includes accessibility, styling,
animations, layout - everything that leads to an intuitive user experience. The goal is to
demonstrate what patterns to reach for today (and what to stop reaching for) so
previously-recommended patterns don't persist by habit.

## What these patterns replace

If you last focused on React or TypeScript before 2024, these are the habits this repo is designed
to update:

**React**

| Old habit                                                               | Modern replacement                                                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `useEffect(() => { fetch(…).then(setData) }, [])`                       | `use(promise)` + Suspense                                                               |
| Per-component `if (loading) return …` / `if (error) return …`           | Suspense + ErrorBoundary — declare fallbacks once at the tree level                     |
| `React.memo`, `useMemo`, `useCallback` everywhere                       | React Compiler — memoization is automatic; writing it manually is no longer the default |
| `forwardRef((props, ref) => …)`                                         | `ref` as a plain prop                                                                   |
| `useContext(MyContext)`                                                 | `use(MyContext)` — also callable conditionally                                          |
| `<MyContext.Provider value={…}>`                                        | `<MyContext value={…}>`                                                                 |
| `useState` + `e.preventDefault()` + manual `isSubmitting`/`error` state | `useActionState` + `<form action={fn}>`                                                 |
| Prop-drilling `isSubmitting` to the submit button                       | `useFormStatus` in a descendant component                                               |
| Manual optimistic state + rollback logic                                | `useOptimistic`                                                                         |
| `useEffect` + `setTimeout` debounce on inputs                           | `useDeferredValue`                                                                      |
| Hardcoded `id="my-input"` strings                                       | `useId()` — unique per instance, safe across SSR/hydration                              |

**TypeScript**

| Old habit                                                                     | Modern replacement                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Hand-written interfaces duplicating a Zod (or similar) schema                 | `z.infer<typeof Schema>` — one source of truth                            |
| `string` annotated with a comment ("must be a valid ID")                      | Branded types — the type system enforces it                               |
| `: MyType` (loses literals) or `as const` (loses shape check)                 | `satisfies MyType` — keeps literal types and enforces shape               |
| `type Status = 'active' \| 'completed'` with a separate validation step       | `z.enum(['active', 'completed'])` — schema and type stay in sync          |
| Boolean flags (`isLoading`, `isError`, `data`) with impossible combinations   | Discriminated unions — impossible states become unrepresentable           |
| `const enum`, legacy decorators, namespace merges                             | `erasableSyntaxOnly: true` — bans syntax that can't be type-stripped      |
| `import Foo from './foo'` for types, relying on `isolatedModules` to catch it | `verbatimModuleSyntax: true` — enforces `import type` at the syntax level |

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
  todos/    # todo feature: schema, pure functions, in-memory store, and components
  debug/    # debug toolbar: configuration, React context, and toolbar component
```

Pure files (`schema.ts`, `state-transitions.ts`, `parse.ts`, `filter.ts`, `debug/config.ts`) import nothing from the project and have no side effects. `store.ts` and components may import from them. `debug/context.ts` is the only file that imports React outside of component files.

## Testing

Two layers, no React Testing Library:

- **Unit tests** (`npm test`) cover the pure domain functions — `parse`, `filter`, and
  `state-transitions`. These have no React dependency and are cheapest to test at the module
  level. Fixtures use `Object.freeze` to catch accidental mutation in functions that should
  return new arrays.
- **End-to-end tests** (`npm run test:e2e`) cover UI behaviour in a real Chromium browser via
  Playwright — adds, toggles, deletes, filtering, optimistic updates, and rollback on simulated
  server failure.

RTL component tests aren't used here. Anything worth testing in a component is either domain
logic (better tested as a pure function) or UI behaviour (better tested end-to-end in a real
browser). The component layer in between adds jsdom overhead, couples tests to implementation
details, and tends to duplicate what the other two layers already cover.

## Domain vocabulary

| Name              | What it represents                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `Todo`            | A todo item — `Readonly<z.infer<typeof TodoSchema>>`                                       |
| `TodoId`          | Branded string — the type system rejects a plain `string` where a validated ID is required |
| `TodoStatus`      | `'active' \| 'completed'` — derived from a Zod enum                                        |
| `CreateTodoInput` | The fields required to create a todo — derived via `TodoSchema.omit()`                     |
| `RawTodo`         | `unknown` — what the mock API returns before parsing; callers must validate before use     |

## React 19

| Pattern                        | How used                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Compiler                 | Enabled via `@vitejs/plugin-react` — automatically memoizes components and values, eliminating the need for `useMemo`, `useCallback`, and `React.memo`                                                                                                                                                                                            |
| `use(promise)`                 | `TodoList` unwraps `todosPromise` in render; Suspense catches the pending state and shows a fallback                                                                                                                                                                                                                                              |
| `use(context)`                 | `TodoList`, `AddTodoForm`, and `DebugToolbar` read `DebugContext` — unlike `useContext`, `use()` can be called conditionally                                                                                                                                                                                                                      |
| `useActionState`               | `AddTodoForm` manages the form submission cycle: idle → submitting → idle/error                                                                                                                                                                                                                                                                   |
| `<form action={fn}>`           | `AddTodoForm` passes the function from `useActionState` directly to the form's `action` prop — the React 19 alternative to `onSubmit` that integrates with `useFormStatus`                                                                                                                                                                        |
| `useFormStatus`                | `SubmitButton` disables itself while its parent `<form>` is pending — must be a descendant of the form, not the form itself                                                                                                                                                                                                                       |
| `useOptimistic`                | `TodoList` applies toggle and delete instantly in the UI; React rolls back the optimistic state automatically if the server call fails                                                                                                                                                                                                            |
| `startTransition` (sync)       | Wraps re-fetches after mutations so Suspense keeps the current list visible instead of flashing the loading fallback                                                                                                                                                                                                                              |
| `startTransition` (async)      | React 19 extended `startTransition` to accept async functions — toggle and delete use this to sequence the optimistic update, server call, and re-fetch inside a single transition                                                                                                                                                                |
| `AbortController`              | `toggleTodo` accepts an optional `AbortSignal`; `handleToggle` aborts the previous in-flight request before starting a new one — the stale transition ends early (cleaning up its optimistic update), and the shared loading toast stays visible until the latest operation settles                                                               |
| `useDeferredValue`             | `TodoList` filters todos by a deferred copy of the search query — the input stays responsive while React deprioritizes the filtered-list re-render; `isPending = query !== deferredQuery` can dim the list while the two values differ (the effect is imperceptible with small lists; it becomes meaningful when rendering each row is expensive) |
| `useId`                        | `AddTodoForm` and `TodoList` each call `useId()` to associate a `sr-only` label with its input — stable across re-renders, unique per instance, and safe across SSR/hydration boundaries                                                                                                                                                          |
| `ref` as a plain prop          | `AddTodoForm` accepts `ref` as a regular prop; `TodoList` passes `ref={inputRef}` with no `forwardRef` wrapper — the React 19 way to expose a child element's ref to a parent                                                                                                                                                                     |
| `<Context value={...}>`        | `App` provides `DebugContext` with React 19's shorthand — no `.Provider` needed                                                                                                                                                                                                                                                                   |
| Suspense + ErrorBoundary       | `App` wraps `TodoList` in both; `react-error-boundary` supplies the `ErrorBoundary` component                                                                                                                                                                                                                                                     |
| `eslint-plugin-react-compiler` | Errors on Rules of React violations that cause the compiler to bail out on a component and skip automatic memoization                                                                                                                                                                                                                             |
| `eslint-plugin-react-hooks`    | Enforces the rules of hooks (call order, exhaustive deps)                                                                                                                                                                                                                                                                                         |
| `eslint-plugin-react-x`        | Enforces broader React correctness rules beyond hooks                                                                                                                                                                                                                                                                                             |
| `eslint-plugin-react-dom`      | Enforces React DOM-specific best practices                                                                                                                                                                                                                                                                                                        |

## TypeScript

| Pattern                | How used                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `z.infer<>`            | All types (`Todo`, `TodoId`, `TodoStatus`, etc.) are derived from Zod schemas — never written by hand                                                                                                                                                |
| Branded types          | `TodoId = z.string().brand<'TodoId'>()` — the type system rejects a plain `string` where a validated ID is required                                                                                                                                  |
| `satisfies`            | `DELAY_PRESETS satisfies Record<string, number>` preserves the literal key types (`'instant' \| 'normal' \| 'slow'`) while enforcing the value shape; also used in `toggleTodo` to assert the spread object still satisfies `Todo`                   |
| Discriminated unions   | `OptimisticAction` (`add` / `toggle` / `delete`) exhaustively switches on `type`                                                                                                                                                                     |
| `Readonly<>`           | `Todo` is `Readonly<z.infer<typeof TodoSchema>>` — mutations must replace the object, never mutate it in place                                                                                                                                       |
| `z.enum()`             | `TodoStatus` is derived from a Zod enum so the schema and the type stay in sync                                                                                                                                                                      |
| `TodoSchema.omit()`    | `CreateTodoInput` is derived structurally — no manual duplication of fields                                                                                                                                                                          |
| `ReturnType<>`         | `TodosPromise = ReturnType<typeof fetchTodos>` — the prop and state types stay in sync with the function signature automatically                                                                                                                     |
| `erasableSyntaxOnly`   | Tsconfig flag that bans TypeScript syntax requiring transformation rather than simple type-stripping (`const enum`, legacy decorators, namespace merges) — keeps code compatible with tools that strip types without compiling (Node, Vite, esbuild) |
| `verbatimModuleSyntax` | Tsconfig flag that requires `import type` for type-only imports and `export type` for type-only exports — prevents accidental value imports that bloat bundles and cause runtime errors in ESM                                                       |

## Accessibility

| Pattern | How used |
| ------- | -------- |
| `<label htmlFor>` | Each todo's title is a `<label>` linked to its checkbox via `htmlFor={`todo-${todo.id}`}` — clicking the title activates the checkbox; the ID is data-derived (from `todo.id`), contrasting with `useId` which generates instance-derived IDs |
| `aria-label` | Delete buttons use `aria-label={`Delete ${todo.title}`}` — visible text stays "Delete" while screen readers announce the item context ("Delete Buy milk") |

## Todos 😉

- [ ] Improve styling
- [ ] Optimize a11y (e.g. screen reader users, keyboard users, color contrast, etc)
- [ ] Optimize UX (e.g. intuitive journeys, optimistic updates, more/fewer animations)
- [ ] Express code boundaries more effectively via folder/file organization
- [ ] Move all `(state, action) → newState` reducers into `domain/` and unit-test them there —
      `applyOptimistic` already follows this shape; the rest of the mutation logic could too
- [ ] Make the implicit FSMs explicit with XState or a typed reducer — `ActionState` in `AddTodoForm`
      has a fixed state set with defined transitions; an explicit machine would prevent impossible
      states at the component level, not just the type level
