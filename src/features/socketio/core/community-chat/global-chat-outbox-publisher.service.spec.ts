import type {
    EntityManager 
} from "typeorm"
import type {
    GlobalChatMetricsService 
} from "@modules/bussiness/chat/global-chat-metrics.service"
import {
    EventName 
} from "@modules/platform/event/enums/event-name"
import type {
    EventEmitterService 
} from "@modules/platform/event/event-emitter.service"
import {
    GlobalChatOutboxPublisherService 
} from "./global-chat-outbox-publisher.service"

function outboxQuery(
    rows: Array<Record<string, unknown>>,
): Record<string, jest.Mock> {
    const builder: Record<string, jest.Mock> = {
        where: jest.fn(),
        andWhere: jest.fn(),
        orderBy: jest.fn(),
        take: jest.fn(),
        getMany: jest.fn().mockResolvedValue(rows),
    }
    for (const method of ["where",
        "andWhere",
        "orderBy",
        "take"])
        builder[method].mockReturnValue(builder)
    return builder
}

describe("GlobalChatOutboxPublisherService",
    () => {
        const row = {
            id: "outbox-1",
            payload: {
                conversationId: "global-room",
                messageId: "message-1",
                actorId: "member-1",
            },
            lockedAt: null,
            attempts: 0,
            createdAt: new Date(Date.now() - 100),
        }

        let manager: {
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
  }
        let emitter: jest.Mocked<Pick<EventEmitterService, "emit">>
        let metrics: jest.Mocked<
    Pick<GlobalChatMetricsService, "outboxPublished" | "logOutboxFailure">
  >
        let service: GlobalChatOutboxPublisherService

        beforeEach(() => {
            manager = {
                createQueryBuilder: jest.fn().mockReturnValue(outboxQuery([row])),
                update: jest.fn(),
            }
            emitter = {
                emit: jest.fn().mockResolvedValue(undefined),
            }
            metrics = {
                outboxPublished: jest.fn(),
                logOutboxFailure: jest.fn(),
            }
            service = new GlobalChatOutboxPublisherService(
      manager as unknown as EntityManager,
      emitter as unknown as EventEmitterService,
      metrics as unknown as GlobalChatMetricsService,
            )
        })

        it("publishes a successfully leased row and marks it durable",
            async () => {
                manager.update
                    .mockResolvedValueOnce({
                        affected: 1,
                    })
                    .mockResolvedValueOnce({
                        affected: 1,
                    })

                await service.publishPending()

                expect(emitter.emit).toHaveBeenCalledWith({
                    event: EventName.GlobalChatInvalidated,
                    payload: row.payload,
                })
                expect(manager.update).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    {
                        id: row.id,
                    },
                    expect.objectContaining({
                        publishedAt: expect.any(Date),
                        lockedAt: null,
                        lastError: null,
                    }),
                )
                expect(metrics.outboxPublished).toHaveBeenCalledTimes(1)
            })

        it("does not duplicate a publish when another worker owns the lease",
            async () => {
                manager.update.mockResolvedValueOnce({
                    affected: 0,
                })

                await service.publishPending()

                expect(emitter.emit).not.toHaveBeenCalled()
                expect(manager.update).toHaveBeenCalledTimes(1)
            })

        it("releases the lease and schedules bounded retry after a publish failure",
            async () => {
                manager.update
                    .mockResolvedValueOnce({
                        affected: 1,
                    })
                    .mockResolvedValueOnce({
                        affected: 1,
                    })
                emitter.emit.mockRejectedValueOnce(new Error("temporary NATS outage"))

                await service.publishPending()

                expect(manager.update).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    {
                        id: row.id,
                    },
                    expect.objectContaining({
                        lockedAt: null,
                        availableAt: expect.any(Date),
                        lastError: "temporary NATS outage",
                    }),
                )
                expect(metrics.logOutboxFailure).toHaveBeenCalledTimes(1)
                expect(metrics.outboxPublished).not.toHaveBeenCalled()
            })
    })
