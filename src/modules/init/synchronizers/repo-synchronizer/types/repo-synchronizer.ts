/**
 * A single entry in a Sandpack file map.
 *
 * The walker collects text files from a repo tree and exposes them as a
 * `Record<string, SandpackFile>` keyed by absolute-style path
 * (e.g. `/src/App.tsx`). Each value carries the raw file contents.
 */
export interface SandpackFile {
    /** Raw text contents of the file. */
    code: string
}
