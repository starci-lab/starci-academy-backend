import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    UserService,
} from "./user.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("UserService",
    () => {
        let module: TestingModule
        let service: UserService
        let entityManager: EntityManagerMock
        let cacheService: jest.Mocked<CacheService>

        const userId = "user-1"
        const courseId = "course-1"
        const keycloakId = "kc-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // raw `query` is used by checkEnrollment to rebuild the enrolled set
            entityManager.query = jest.fn().mockResolvedValue([])

            // cache get/set/del stubs the test programs per-case
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            module = await Test.createTestingModule({
                providers: [
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<UserService>(UserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getUserByKeycloakId",
            () => {
                it("returns the cached user without touching the database",
                    async () => {
                        const cached = {
                            id: userId,
                        } as UserEntity
                        cacheService.get.mockResolvedValueOnce(cached)

                        const result = await service.getUserByKeycloakId(keycloakId)

                        expect(result).toBe(cached)
                        // cache hit short-circuits the DB lookup + the re-cache write
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("loads from the DB on a cache miss and back-fills the cache",
                    async () => {
                        // miss -> falsy cached value forces the DB path
                        cacheService.get.mockResolvedValueOnce(undefined)
                        const row = {
                            id: userId,
                        }
                        entityManager.findOne.mockResolvedValueOnce(row)

                        const result = await service.getUserByKeycloakId(keycloakId)

                        expect(result).toBe(row)
                        // looked the user up by keycloak id, selecting only the id column
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            UserEntity,
                            {
                                select: {
                                    id: true,
                                },
                                where: {
                                    keycloakId,
                                },
                            },
                        )
                        // wrote the resolved row back under the keycloak-user key
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.KeycloakUser,
                            args: [
                                keycloakId,
                            ],
                            cacheResult: row,
                        })
                    })

                it("throws UserNotFoundException when neither cache nor DB has the user",
                    async () => {
                        // miss in cache, and the DB row is absent too
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.getUserByKeycloakId(keycloakId),
                        ).rejects.toBeInstanceOf(UserNotFoundException)
                        // nothing to cache on the not-found path
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })
            })

        describe("checkEnrollment",
            () => {
                it("checks membership against the cached set without hitting the DB",
                    async () => {
                        // cached set of enrolled course ids is authoritative
                        cacheService.get.mockResolvedValueOnce([
                            courseId,
                        ])

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(true)
                        // cache hit short-circuits the rebuild query + re-cache
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("returns false when the course is not in the cached set",
                    async () => {
                        cacheService.get.mockResolvedValueOnce([
                            "other-course",
                        ])

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(false)
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("rebuilds the set from the DB on a miss and caches it (enrolled)",
                    async () => {
                        // cache miss is signalled by `undefined`
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // one indexed query returns every enrolled course id
                        entityManager.query.mockResolvedValueOnce([
                            {
                                course_id: courseId,
                            },
                        ])

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(true)
                        // cached the rebuilt set under one per-user key
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.UserEnrolledCourses,
                            args: [
                                userId,
                            ],
                            cacheResult: [
                                courseId,
                            ],
                        })
                    })

                it("rebuilds and returns false when the user has no such enrollment",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // query defaults to [] -> user is enrolled in nothing matching
                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(false)
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.UserEnrolledCourses,
                            args: [
                                userId,
                            ],
                            cacheResult: [],
                        })
                    })

                it("gates the rebuild query to PAID rows only (is_enrolled = true)",
                    async () => {
                        // cache miss forces the rebuild read against the DB
                        cacheService.get.mockResolvedValueOnce(undefined)

                        await service.checkEnrollment(userId,
                            courseId)

                        // the indexed read must filter out trial placeholders so a
                        // trial-only membership (is_enrolled = false) never satisfies the
                        // paid gate -- assert on the SQL the service issues
                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        expect(sql).toContain("is_enrolled = true")
                        expect(params).toEqual([
                            userId,
                        ])
                    })

                it("returns false for a TRIAL-only user (rebuild yields no paid rows)",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // the `is_enrolled = true` filter means a user who only holds a
                        // trial placeholder rebuilds to an EMPTY set -> not enrolled
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(false)
                    })

                it("returns true for a PAID user (rebuild yields the course id)",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // a real/paid enrollment surfaces in the filtered rebuild
                        entityManager.query.mockResolvedValueOnce([
                            {
                                course_id: courseId,
                            },
                        ])

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(true)
                    })
            })

        describe("resolveOrCreateTrialEnrollment",
            () => {
                it("returns the existing enrollment without creating a new one",
                    async () => {
                        // an enrollment (trial or paid) already exists -> return it as-is
                        const existing = {
                            id: "enrollment-1",
                            isEnrolled: true,
                        } as EnrollmentEntity
                        entityManager.findOne.mockResolvedValueOnce(existing)

                        const result = await service.resolveOrCreateTrialEnrollment(
                            userId,
                            courseId,
                        )

                        expect(result).toBe(existing)
                        // idempotent: nothing is built or persisted
                        expect(entityManager.create).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("creates a TRIAL placeholder (is_enrolled = false) when none exists",
                    async () => {
                        // no row yet -> take the create path
                        entityManager.findOne.mockResolvedValueOnce(null)
                        const created = {
                            id: "enrollment-new",
                            isEnrolled: false,
                        } as EnrollmentEntity
                        entityManager.save.mockResolvedValueOnce(created)

                        const result = await service.resolveOrCreateTrialEnrollment(
                            userId,
                            courseId,
                        )

                        // built as a trial placeholder for this user+course
                        expect(entityManager.create).toHaveBeenCalledWith(
                            EnrollmentEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                                course: {
                                    id: courseId,
                                },
                                pricingPhase: PricingPhase.EarlyBird,
                                isEnrolled: false,
                            }),
                        )
                        // persisted and returned
                        expect(entityManager.save).toHaveBeenCalledTimes(1)
                        expect(result).toBe(created)
                    })

                it("recovers idempotently when a concurrent insert wins the unique race",
                    async () => {
                        // first read finds nothing -> create path
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // save trips the UQ_enrollments_user_course constraint
                        entityManager.save.mockRejectedValueOnce(
                            new Error("duplicate key value violates unique constraint"),
                        )
                        // recovery re-read returns the row the racing request created
                        const raced = {
                            id: "enrollment-raced",
                            isEnrolled: false,
                        } as EnrollmentEntity
                        entityManager.findOne.mockResolvedValueOnce(raced)

                        const result = await service.resolveOrCreateTrialEnrollment(
                            userId,
                            courseId,
                        )

                        expect(result).toBe(raced)
                    })

                it("rethrows when the save fails for a non-race reason (no recovery row)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)
                        const failure = new Error("connection terminated")
                        entityManager.save.mockRejectedValueOnce(failure)
                        // recovery re-read also finds nothing -> the error is genuine
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.resolveOrCreateTrialEnrollment(userId,
                                courseId),
                        ).rejects.toBe(failure)
                    })
            })

        describe("invalidateEnrolledCourses",
            () => {
                it("drops the user's cached enrolled-courses set",
                    async () => {
                        await service.invalidateEnrolledCourses(userId)

                        expect(cacheService.del).toHaveBeenCalledWith({
                            key: CacheKey.UserEnrolledCourses,
                            args: [
                                userId,
                            ],
                        })
                    })
            })
    })
