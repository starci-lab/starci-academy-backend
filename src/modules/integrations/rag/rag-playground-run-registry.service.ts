import {
    Injectable,
} from "@nestjs/common"
import {
    randomUUID,
} from "node:crypto"
import type {
    PreparedRagPlaygroundRun,
} from "./types/public-rag-playground"

/** A prepared run not consumed within this window is dropped (abandoned tab / never subscribed). */
const RUN_TTL_MS = 3 * 60_000

@Injectable()
/**
 * In-memory holding pen for a prepared-but-not-yet-streamed RAG Playground ask.
 *
 * The `askRagPlayground` mutation does the (cheap-ish) retrieval + prompt
 * build and stashes the result here under a fresh `runId`; the public
 * Socket.IO gateway then `consume()`s it once the client subscribes to start
 * streaming. Deliberately NOT persisted (no DB row per question) -- this is a
 * public demo, not a feature that needs a Q&A history; a server restart or a
 * 3-minute idle window simply drops any not-yet-streamed run.
 *
 * Single-instance only (in-process Map) -- acceptable for this surface's scale;
 * a multi-instance deployment would need a shared store (Redis) instead.
 */
export class RagPlaygroundRunRegistryService {
    private readonly runs = new Map<string, PreparedRagPlaygroundRun>()

    /**
     * Stash a prepared run and return its id. Auto-expires after
     * {@link RUN_TTL_MS} if never consumed.
     *
     * @param run - The prepared messages + sources to stream once subscribed.
     * @returns The fresh run id the client subscribes with.
     */
    create(
        run: PreparedRagPlaygroundRun,
    ): string {
        const runId = randomUUID()
        this.runs.set(runId,
            run)
        setTimeout(
            () => this.runs.delete(runId),
            RUN_TTL_MS,
        )
        return runId
    }

    /**
     * Take + remove a prepared run -- single-use, mirrors "start streaming"
     * semantics (a second subscribe with the same id finds nothing).
     *
     * @param runId - The run id to consume.
     * @returns The prepared run, or undefined if unknown/already consumed/expired.
     */
    consume(
        runId: string,
    ): PreparedRagPlaygroundRun | undefined {
        const run = this.runs.get(runId)
        this.runs.delete(runId)
        return run
    }
}
