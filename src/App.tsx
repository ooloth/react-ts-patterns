import { Suspense, startTransition, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "sonner";
import { DebugContext, DELAY_PRESETS } from "./domain/debug";
import type { DelayPreset } from "./domain/debug";
import { fetchTodos } from "./api/todos";
import type { TodosPromise } from "./api/todos";
import { DebugToolbar } from "./ui/DebugToolbar";
import { TodoList } from "./ui/TodoList";

export default function App() {
  const [todosPromise, setTodosPromise] = useState<TodosPromise>(() =>
    fetchTodos(),
  );
  const [delayPreset, setDelayPreset] = useState<DelayPreset>("instant");
  const [failNext, setFailNext] = useState(false);

  const refresh = () => startTransition(() => setTodosPromise(fetchTodos(DELAY_PRESETS[delayPreset])));

  // React 19: <Context value={...}> replaces <Context.Provider value={...}>.
  // The .Provider form still works but is no longer necessary.
  return (
    <DebugContext
      value={{ delayPreset, failNext, setDelayPreset, setFailNext }}
    >
      <main className="mx-auto max-w-xl p-8 pb-16">
        <h1 className="text-2xl font-semibold">Todos</h1>
        <p>Playground for trying out modern React and TypeScript idioms.</p>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <p className="mt-4 text-red-600">
              Failed to load todos:{" "}
              {error instanceof Error ? error.message : String(error)}
            </p>
          )}
        >
          <Suspense fallback={<p className="mt-4 text-gray-400">Loading…</p>}>
            <TodoList todosPromise={todosPromise} onMutate={refresh} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <DebugToolbar />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            width: "fit-content",
            minWidth: "unset",
            animation: "none",
            transition: "none",
          },
        }}
      />
    </DebugContext>
  );
}
