/**
 * Minimal request shape the bootstrap's PNA preflight middleware (`main.ts`)
 * reads -- just the one header it checks, not the full Express `Request`.
 */
export interface PnaPreflightRequestParams {
    headers: Record<string, string | undefined>
}

/**
 * Minimal response shape the bootstrap's PNA preflight middleware (`main.ts`)
 * writes to -- just the one setter it calls, not the full Express `Response`.
 */
export interface PnaPreflightResponseParams {
    setHeader: (name: string, value: string) => void
}
