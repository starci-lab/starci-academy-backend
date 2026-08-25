import {
    Injectable 
} from "@nestjs/common"
import {
    Interval 
} from "@nestjs/schedule"
import {
    IsNull, LessThan, type EntityManager 
} from "typeorm"
import {
    GlobalChatMetricsService 
} from "@modules/bussiness/chat/global-chat-metrics.service"
import {
    ChatOutboxEntity 
} from "@modules/databases/postgresql/primary/entities/chat-outbox.entity"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EventName 
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService 
} from "@modules/platform/event/event-emitter.service"
import {
    AbstractException 
} from "@modules/platform/exceptions/errors/abstract"
import type {
    GlobalChatInvalidatedEventPayload 
} from "@modules/platform/event/types/event-payload/chat"

const PUBLISH_INTERVAL_MS = 1000
const LEASE_MS = 30_000

function parseInvalidationPayload(
    payload: Record<string, unknown>,
): GlobalChatInvalidatedEventPayload {
    const { conversationId, messageId, actorId } = payload
    if (
        typeof conversationId !== "string" ||
    typeof actorId !== "string" ||
    (messageId !== null && typeof messageId !== "string")
    ) {
        throw new AbstractException(
            "Global Chat outbox payload is invalid",
            "GLOBAL_CHAT_OUTBOX_PAYLOAD_INVALID",
        )
    }
    return {
        conversationId,
        messageId,
        actorId,
    }
}

@Injectable()
/** Leases durable outbox rows, emits compact local invalidations and marks success. */
export class GlobalChatOutboxPublisherService {
    constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    private readonly eventEmitterService: EventEmitterService,
    private readonly metrics: GlobalChatMetricsService,
    ) {}

  @Interval(PUBLISH_INTERVAL_MS)
    async publishPending(): Promise<void> {
        const now = new Date()
        const staleLease = new Date(now.getTime() - LEASE_MS)
        const rows = await this.entityManager
            .createQueryBuilder(ChatOutboxEntity,
                "outbox")
            .where("outbox.published_at IS NULL")
            .andWhere("outbox.available_at <= :now",
                {
                    now,
                })
            .andWhere(
                "(outbox.locked_at IS NULL OR outbox.locked_at < :staleLease)",
                {
                    staleLease,
                },
            )
            .orderBy("outbox.created_at",
                "ASC")
            .take(50)
            .getMany()
        for (const row of rows) {
            const claim = await this.entityManager.update(
                ChatOutboxEntity,
                {
                    id: row.id,
                    publishedAt: IsNull(),
                    lockedAt: row.lockedAt ? LessThan(staleLease) : IsNull(),
                },
                {
                    lockedAt: now,
                    attempts: () => "\"attempts\" + 1",
                },
            )
            if (!claim.affected) continue
            try {
                const payload = parseInvalidationPayload(row.payload)
                await this.eventEmitterService.emit({
                    event: EventName.GlobalChatInvalidated,
                    payload,
                })
                const publishedAt = new Date()
                await this.entityManager.update(
                    ChatOutboxEntity,
                    {
                        id: row.id,
                    },
                    {
                        publishedAt,
                        lockedAt: null,
                        lastError: null,
                    },
                )
                this.metrics.outboxPublished(
                    publishedAt.getTime() - row.createdAt.getTime(),
                )
            } catch (error) {
                const attempts = row.attempts + 1
                await this.entityManager.update(
                    ChatOutboxEntity,
                    {
                        id: row.id,
                    },
                    {
                        lockedAt: null,
                        availableAt: new Date(
                            Date.now() + Math.min(60_000,
                                attempts * 1000),
                        ),
                        lastError:
              error instanceof Error
                  ? error.message.slice(0,
                      2000)
                  : String(error).slice(0,
                      2000),
                    },
                )
                this.metrics.logOutboxFailure()
            }
        }
    }
}
