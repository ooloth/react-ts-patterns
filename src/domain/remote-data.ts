// A discriminated union for async state — common in FP/TS circles under this
// name. The status field is the discriminant: narrowing on it gives TypeScript
// full knowledge of which other fields are present.
//
// Why four states instead of { loading, data?, error? }:
// - The alternative allows impossible combinations (loading=true AND data set)
// - Here, each state is self-contained and mutually exclusive by construction
export type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
