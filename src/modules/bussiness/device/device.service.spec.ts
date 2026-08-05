import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    DeviceService,
} from "./device.service"
import {
    DeviceEntity,
} from "@modules/databases/postgresql/primary/entities/device.entity"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("DeviceService",
    () => {
        let module: TestingModule
        let service: DeviceService
        let entityManager: EntityManagerMock

        const userId = "user-1"
        const fingerprint = "fp-abc"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    DeviceService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<DeviceService>(DeviceService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("recordDevice",
            () => {
                it("no-ops silently when no fingerprint is supplied",
                    async () => {
                        await service.recordDevice({
                            userId,
                            // without a fingerprint we cannot identify the device
                            fingerprint: null,
                            ipAddress: "1.2.3.4",
                            userAgent: "ua",
                        })

                        // never touches the DB at all
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("inserts a fresh device row on first sighting",
                    async () => {
                        // findOne default resolves null -> no existing row for this user+device
                        await service.recordDevice({
                            userId,
                            fingerprint,
                            ipAddress: "1.2.3.4",
                            userAgent: "ua",
                        })

                        // looked up the unique (user, fingerprint) pair
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            DeviceEntity,
                            {
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                    fingerprint,
                                },
                            },
                        )
                        // saved a new row keyed by the user relation + fingerprint
                        const saved = entityManager.save.mock.calls[0][1] as {
                            user: {
                                id: string
                            }
                            fingerprint: string
                            ipAddress: string | null
                            userAgent: string | null
                            lastSeenAt: Date
                        }
                        expect(saved.user.id).toBe(userId)
                        expect(saved.fingerprint).toBe(fingerprint)
                        expect(saved.ipAddress).toBe("1.2.3.4")
                        expect(saved.userAgent).toBe("ua")
                        // last-seen stamped explicitly on insert
                        expect(saved.lastSeenAt).toBeInstanceOf(Date)
                    })

                it("refreshes IP/UA and bumps last-seen for a returning device",
                    async () => {
                        // an existing row stands in for a device we've seen before
                        const existing = {
                            id: "device-1",
                            ipAddress: "9.9.9.9",
                            userAgent: "old-ua",
                            lastSeenAt: new Date("2020-01-01T00:00:00Z"),
                        }
                        entityManager.findOne.mockResolvedValueOnce(existing)

                        await service.recordDevice({
                            userId,
                            fingerprint,
                            ipAddress: "1.2.3.4",
                            userAgent: "new-ua",
                        })

                        // mutates the loaded row in place with the latest metadata
                        expect(existing.ipAddress).toBe("1.2.3.4")
                        expect(existing.userAgent).toBe("new-ua")
                        // last-seen advanced past the stale stored value
                        expect(existing.lastSeenAt.getTime()).toBeGreaterThan(
                            new Date("2020-01-01T00:00:00Z").getTime(),
                        )
                        // persisted the same row instance (update path)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            DeviceEntity,
                            existing,
                        )
                    })
            })
    })
