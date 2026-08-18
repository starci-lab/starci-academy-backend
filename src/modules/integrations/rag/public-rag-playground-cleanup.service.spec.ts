import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    PublicRagPlaygroundCleanupService,
} from "./public-rag-playground-cleanup.service"

const POSTGRESQL_PRIMARY = "primary"

describe("PublicRagPlaygroundCleanupService",
    () => {
        let service: PublicRagPlaygroundCleanupService
        let entityManager: EntityManagerMock
        const deleteCollection = jest.fn()

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            deleteCollection.mockReset().mockResolvedValue(undefined)
            const module = await Test.createTestingModule({
                providers: [
                    PublicRagPlaygroundCleanupService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: QDRANT_CLIENT,
                        useValue: {
                            deleteCollection,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()
            service = module.get(PublicRagPlaygroundCleanupService)
        })

        it("only the replica that claims the row deletes the external collection",
            async () => {
                entityManager.find.mockResolvedValue([
                    {
                        id: "session-row",
                        sessionId: "session-public",
                    },
                ])
                entityManager.delete.mockResolvedValue({
                    affected: 0,
                })

                await service.handleIdleCleanup()

                // the claim attempted was still the right row -- proves this
                // replica targeted the correct session before losing the race,
                // not just that `delete` was called with SOMETHING
                const [call] = entityManager.delete.mock.calls
                expect(call[1]).toEqual({
                    id: "session-row",
                })
                // losing the DB claim must suppress the external side effect
                expect(deleteCollection).not.toHaveBeenCalled()
            })

        it("deletes the external collection after winning the durable claim",
            async () => {
                entityManager.find.mockResolvedValue([
                    {
                        id: "session-row",
                        sessionId: "session-public",
                    },
                ])
                entityManager.delete.mockResolvedValue({
                    affected: 1,
                })

                await service.handleIdleCleanup()

                // read back the ACTUAL collection name handed to Qdrant, rather
                // than asserting only that the call happened
                const [[collectionName]] = deleteCollection.mock.calls
                expect(collectionName).toBe("playground-session-public")
            })
    })
