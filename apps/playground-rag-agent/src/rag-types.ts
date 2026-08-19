/** Local Ollama serving status, polled + pushed to the browser. */
export interface OllamaStatus {
    serving: boolean
    models: Array<string>
}

/** A code source the browser wants indexed into the on-device RAG engine. */
export interface IndexSource {
    kind: string
    code?: string
    fileName?: string
    githubUrl?: string
    sampleId?: string
}

/** One retrieved chunk cited alongside an answer. */
export interface RagSource {
    filePath: string
    snippet: string
    score: number
}

/** Params for a `ragAsk` socket event -- both fields optional, validated at the call site. */
export interface RagAskParams {
    runId?: string
    question?: string
}
