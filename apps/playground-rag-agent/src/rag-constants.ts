/** Local Ollama HTTP origin the on-device RAG engine talks to. */
export const OLLAMA_BASE = "http://localhost:11434"

/** How often (ms) to probe local Ollama for serving status + installed models. */
export const OLLAMA_STATUS_INTERVAL_MS = 4000

/** Embedding model used to chunk + embed indexed code and questions. */
export const EMBED_MODEL = "nomic-embed-text"

/** Last-resort generation model when none can be picked from the installed set. */
export const GEN_MODEL_FALLBACK = "qwen2.5:3b"

/** How many top chunks (by cosine similarity) to feed into the answer prompt. */
export const RAG_TOP_K = 4
