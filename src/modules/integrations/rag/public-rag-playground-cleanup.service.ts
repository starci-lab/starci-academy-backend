import {
    Injectable,
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
    RagPlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/rag-playground-session.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    InjectQdrantClient,
} from "@modules/databases/qdrant/qdrant.decorators"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

/** A session idle past this window is dropped (its Qdrant collection + DB row). */
const IDLE_TTL_MS = 2 * 60 * 60_000

@Injectable()
/**
 * Cron driver that drops idle PUBLIC RAG Playground sessions -- a visitor who
 * indexes code then abandons the tab would otherwise leak a Qdrant collection
 * forever (there's no logout / account to tie cleanup to; the surface is
 * anonymous by design). Runs every 30 minutes, best-effort per session (one
 * failure never blocks the rest), and is idempotent -- a session dropped by a
 * prior run simply won't be found again.
 */
export class PublicRagPlaygroundCleanupService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Sweep + drop every session whose `lastAccessedAt` is older than
     * {@link IDLE_TTL_MS}, every 30 minutes.
     */
    @Cron(
        "*/30 * * * *",
        {
            name: "rag-playground-cleanup",
            waitForCompletion: true,
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
            this.winstonService.log(WinstonLog.RagCleanupCompleted,
                {
                    op: "rag.playground.cleanup-completed",
                    count: idleSessions.length,
                })
        }
    }

    /**
     * Drop one session's Qdrant collection + DB row. Best-effort -- a failure is
     * logged, not thrown, so one bad session never blocks the rest of the sweep.
     */
    private async dropSession(
        session: RagPlaygroundSessionEntity,
    ): Promise<void> {
        try {
            // Claim by deleting the durable row first. Every replica may have
            // selected the same idle session, but only one DELETE can win and
            // therefore only one replica is allowed to touch Qdrant.
            const claimed = await this.entityManager.delete(
                RagPlaygroundSessionEntity,
                {
                    id: session.id,
                },
            )
            if (!claimed.affected) {
                return
            }
        } catch (error) {
            this.winstonService.log(WinstonLog.BestEffortOperationFailed,
                {
                    op: "rag.playground.session-row-delete-failed",
                    sessionId: session.sessionId,
                    error: error instanceof Error ? error.message : String(error),
                })
            return
        }
        try {
            await this.qdrantClient.deleteCollection(
                `playground-${session.sessionId}`,
            )
        } catch (error) {
            this.winstonService.log(WinstonLog.BestEffortOperationFailed,
                {
                    op: "rag.playground.collection-drop-failed",
                    sessionId: session.sessionId,
                    error: error instanceof Error ? error.message : String(error),
                })
        }
    }
}
