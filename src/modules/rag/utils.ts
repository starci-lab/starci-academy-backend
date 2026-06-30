/** Maps a file extension to the programming language tag stored in the RAG payload. */
const EXT_LANG_MAP: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    java: "java",
    cs: "csharp",
    go: "go",
    py: "python",
    rb: "ruby",
    php: "php",
    rs: "rust",
    css: "css",
    scss: "css",
    html: "html",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    sh: "shell",
}

/**
 * Derive a coarse language tag from a file path, used as the `lang` payload field
 * for code chunks in the lesson RAG index.
 *
 * @param filePath - The file path (e.g. `/src/App.tsx`).
 * @returns The language tag (e.g. `typescript`), or `"other"` when unknown.
 */
export const extToLang = (
    filePath: string,
): string => {
    const ext = filePath.split(".").at(-1)?.toLowerCase() ?? ""
    return EXT_LANG_MAP[ext] ?? "other"
}
