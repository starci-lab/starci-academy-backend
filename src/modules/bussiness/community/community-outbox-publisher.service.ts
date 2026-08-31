import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { EntityManager } from "typeorm"
import { InjectPrimaryPostgreSQLEntityManager } from "@modules/databases/postgresql/primary/primary.decorators"

export const COURSE_COMMUNITY_CHANGED_EVENT = "course-community.changed"

@Injectable()
export class CommunityOutboxPublisherService implements OnApplicationBootstrap, OnApplicationShutdown {
    private timer?: NodeJS.Timeout
    private running = false
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly manager: EntityManager,
        private readonly events: EventEmitter2,
    ) {}

    onApplicationBootstrap(): void {
        this.timer = setInterval(() => void this.tick(), 1000)
        this.timer.unref()
    }

    onApplicationShutdown(): void {
        if (this.timer) clearInterval(this.timer)
    }

    private async tick(): Promise<void> {
        if (this.running) return
        this.running = true
        try { await this.publishPending() } catch { /* expand deploys may start before the table exists */ } finally { this.running = false }
    }

    async publishPending(limit = 50): Promise<number> {
        const rows = await this.manager.transaction(async (tx) => tx.query(`
            UPDATE community_outbox SET leased_until = now() + interval '30 seconds', attempts = attempts + 1
            WHERE id IN (SELECT id FROM community_outbox WHERE published_at IS NULL AND available_at <= now()
              AND (leased_until IS NULL OR leased_until < now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1)
            RETURNING id, event_key, kind, payload`, [limit])) as Array<{ id: string; event_key: string; kind: string; payload: unknown }>
        for (const row of rows) {
            try {
                this.events.emit(COURSE_COMMUNITY_CHANGED_EVENT, { eventKey: row.event_key, kind: row.kind, ...(row.payload as object) })
                await this.manager.query(`UPDATE community_outbox SET published_at=now(), leased_until=NULL, last_error=NULL WHERE id=$1`, [row.id])
            } catch (error) {
                await this.manager.query(`UPDATE community_outbox SET leased_until=NULL, available_at=now() + interval '30 seconds', last_error=$2 WHERE id=$1`, [row.id, String(error)])
            }
        }
        return rows.length
    }
}
