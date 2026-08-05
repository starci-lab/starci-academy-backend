import {
    Injectable 
} from "@nestjs/common"
import {
    EMBED_MODEL, GEN_MODEL_FALLBACK, OLLAMA_BASE, RAG_TOP_K 
} from "./rag-constants"
import type {
    IndexSource, OllamaStatus, RagSource 
} from "./rag-types"

/** An embedded chunk of indexed code, kept in-memory for the session. */
interface RagChunk {
    filePath: string
    snippet: string
    embedding: Array<number>
}

/** ~35-line windows with ~8-line overlap -- enough context per chunk without blowing the prompt budget. */
const CHUNK_LINES = 35
const CHUNK_OVERLAP_LINES = 8

@Injectable()
/**
 * On-device RAG engine, single session per agent process. Talks to the
 * learner's LOCAL Ollama (no cloud, no auth) -- every method is best-effort
 * and never throws, so a missing/unhealthy Ollama degrades gracefully.
 */
export class RagService {
    private chunks: Array<RagChunk> = []

    /** Probe local Ollama for serving status + installed models. Never throws. */
    async probeOllama(): Promise<OllamaStatus> {
        try {
            const response = await fetch(`${OLLAMA_BASE}/api/tags`)
            const data = await response.json() as { models?: Array<{ name: string }> }
            return {
                serving: true, models: (data.models ?? []).map((model) => model.name) 
            }
        } catch {
            return {
                serving: false, models: [] 
            }
        }
    }

    /** Split text into overlapping line-windows, each tagged with its 1-based start line. */
    private chunkText(text: string, filePath: string): Array<{ filePath: string, snippet: string, startLine: number }> {
        const lines = text.split(/\r?\n/)
        const chunks: Array<{ filePath: string, snippet: string, startLine: number }> = []
        const step = CHUNK_LINES - CHUNK_OVERLAP_LINES
        for (let start = 0; start < lines.length; start += step) {
            const end = Math.min(start + CHUNK_LINES,
                lines.length)
            chunks.push({
                filePath, snippet: lines.slice(start,
                    end).join("\n"), startLine: start + 1 
            })
            if (end >= lines.length) {
                break
            }
        }
        return chunks
    }

    /** Embed one piece of text via local Ollama. Throws on failure -- callers decide how to handle it. */
    private async embed(text: string): Promise<Array<number>> {
        const response = await fetch(`${OLLAMA_BASE}/api/embeddings`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    model: EMBED_MODEL, prompt: text 
                }),
            })
        const data = await response.json() as { embedding?: Array<number> }
        return data.embedding ?? []
    }

    /** Chunk + embed a code source into the in-memory index (replaces any prior session index). */
    async index(source: IndexSource): Promise<{ chunkCount: number, sourceLabel: string }> {
        this.chunks = []
        if (!source.code) {
            // P4 will teach github/sample sources to resolve inline text; for now a machine
            // with no pasted code has nothing local to embed.
            const label = source.fileName || source.githubUrl || source.sampleId || "unknown"
            return {
                chunkCount: 0, sourceLabel: `${label} (on-device indexing needs inline code for now)` 
            }
        }
        const label = source.fileName || "pasted-code"
        const windows = this.chunkText(source.code,
            label)
        try {
            for (const window of windows) {
                const embedding = await this.embed(window.snippet)
                this.chunks.push({
                    filePath: window.filePath, snippet: window.snippet, embedding 
                })
            }
        } catch {
            // best-effort -- whatever embedded before the failure stays indexed.
        }
        return {
            chunkCount: this.chunks.length, sourceLabel: label 
        }
    }

    /** Cosine similarity between two equal-length embedding vectors. */
    private cosineSimilarity(a: Array<number>, b: Array<number>): number {
        let dot = 0
        let normA = 0
        let normB = 0
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i]
            normA += a[i] * a[i]
            normB += b[i] * b[i]
        }
        if (normA === 0 || normB === 0) {
            return 0
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    /** Top-`RAG_TOP_K` chunks by cosine similarity to the question embedding. */
    private topChunks(questionEmbedding: Array<number>): Array<{ chunk: RagChunk, score: number }> {
        return this.chunks
            .map((chunk) => ({
                chunk, score: this.cosineSimilarity(questionEmbedding,
                    chunk.embedding) 
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0,
                RAG_TOP_K)
    }

    /** Choose a generation model from the installed set: coder > qwen > any non-embed > fallback. */
    private pickGenModel(models: Array<string>): string {
        const generative = models.filter((name) => !name.toLowerCase().includes("embed"))
        return generative.find((name) => name.toLowerCase().includes("coder"))
            ?? generative.find((name) => name.toLowerCase().startsWith("qwen"))
            ?? generative[0]
            ?? GEN_MODEL_FALLBACK
    }

    /** Stream an Ollama `/api/generate` NDJSON response, calling `onChunk` with the accumulated text. */
    private async streamGenerate(prompt: string, model: string, onChunk: (text: string, done: boolean) => void): Promise<void> {
        const response = await fetch(`${OLLAMA_BASE}/api/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    model, prompt, stream: true 
                }),
            })
        const reader = response.body?.getReader()
        if (!reader) {
            onChunk("",
                true)
            return
        }
        const decoder = new TextDecoder()
        let buffer = ""
        let accumulated = ""
        for (;;) {
            const { value, done } = await reader.read()
            if (done) {
                break
            }
            buffer += decoder.decode(value,
                {
                    stream: true 
                })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""
            for (const line of lines) {
                if (!line.trim()) {
                    continue
                }
                const parsed = JSON.parse(line) as { response?: string, done?: boolean }
                accumulated += parsed.response ?? ""
                onChunk(accumulated,
                    Boolean(parsed.done))
            }
        }
        onChunk(accumulated,
            true)
    }

    /** Answer a question grounded ONLY in the indexed chunks, streaming the answer as it generates. */
    async ask(question: string, onAnswerChunk: (text: string, done: boolean) => void): Promise<{ sources: Array<RagSource> }> {
        try {
            const { models } = await this.probeOllama()
            const genModel = this.pickGenModel(models)
            const questionEmbedding = await this.embed(question)
            const top = this.topChunks(questionEmbedding)
            const sources: Array<RagSource> = top.map(({ chunk, score }) => ({
                filePath: chunk.filePath,
                snippet: chunk.snippet.slice(0,
                    200),
                score: Math.round(score * 100) / 100,
            }))
            const context = top
                .map(({ chunk }) => `--- ${chunk.filePath} ---\n${chunk.snippet}`)
                .join("\n\n")
            const prompt = [
                "Answer the question using ONLY the provided code context. Cite the file names you used. "
                    + "If the answer is not in the context, say you can't find it in the code.",
                context,
                `Question: ${question}`,
            ].join("\n\n")
            await this.streamGenerate(prompt,
                genModel,
                onAnswerChunk)
            return {
                sources 
            }
        } catch {
            onAnswerChunk("[error] could not reach local Ollama — check that `ollama serve` is running.",
                true)
            return {
                sources: [] 
            }
        }
    }
}
