import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Cron,
} from "@nestjs/schedule"
import {
    LessThan,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    RagPlaygroundSessionEntity,
} from "@modules/databases"

/** A session idle past this window is dropped (its Qdrant collection + DB row). */
const IDLE_TTL_MS = 2 * 60 * 60_000

@Injectable()
/**
 * Cron driver that drops idle PUBLIC RAG Playground sessions — a visitor who
 * indexes code then abandons the tab would otherwise leak a Qdrant collection
 * forever (there's no logout / account to tie cleanup to; the surface is
 * anonymous by design). Runs every 30 minutes, best-effort per session (one
 * failure never blocks the rest), and is idempotent — a session dropped by a
 * prior run simply won't be found again.
 */
export class PublicRagPlaygroundCleanupService {
    private readonly logger = new Logger(PublicRagPlaygroundCleanupService.name)

    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Sweep + drop every session whose `lastAccessedAt` is older than
     * {@link IDLE_TTL_MS}, every 30 minutes.
     */
    @Cron(
        "*/30 * * * *",
        {
            name: "rag-playground-cleanup",
        },
    )
    async handleIdleCleanup(): Promise<void> {
        const cutoff = new Date(Date.now() - IDLE_TTL_MS)
        const idleSessions = await this.entityManager.find(
            RagPlaygroundSessionEntity,
            {
                where: {
                    lastAccessedAt: LessThan(cutoff),
                },
            },
        )
        for (const session of idleSessions) {
            await this.dropSession(session)
        }
        if (idleSessions.length > 0) {
            this.logger.log(
                `RAG Playground cleanup dropped ${idleSessions.length} idle session(s)`,
            )
        }
    }

    /**
     * Drop one session's Qdrant collection + DB row. Best-effort — a failure is
     * logged, not thrown, so one bad session never blocks the rest of the sweep.
     */
    private async dropSession(
        session: RagPlaygroundSessionEntity,
    ): Promise<void> {
        try {
            await this.qdrantClient.deleteCollection(
                `playground-${session.sessionId}`,
            )
        } catch (error) {
            // collection may already be gone (race / manual cleanup) — log and continue
            this.logger.warn(
                `Failed to drop Qdrant collection for idle session ${session.sessionId}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            )
        }
        try {
            await this.entityManager.delete(
                RagPlaygroundSessionEntity,
                {
                    id: session.id,
                },
            )
        } catch (error) {
            this.logger.warn(
                `Failed to delete idle session row ${session.sessionId}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            )
        }
    }
}
