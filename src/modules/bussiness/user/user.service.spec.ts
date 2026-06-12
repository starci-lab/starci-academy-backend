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
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    EnrollmentEntity,
    UserEntity,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

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
                        // miss → falsy cached value forces the DB path
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
                it("returns the cached enrollment flag without hitting the database",
                    async () => {
                        // a cached boolean (even `false`) is authoritative
                        cacheService.get.mockResolvedValueOnce(false)

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(false)
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("returns true and caches it when an enrollment row exists",
                    async () => {
                        // cache miss is signalled by `undefined`
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "enrollment-1",
                        })

                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(true)
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                    course: {
                                        id: courseId,
                                    },
                                },
                            },
                        )
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.CourseEnrollment,
                            args: [
                                userId,
                                courseId,
                            ],
                            cacheResult: true,
                        })
                    })

                it("returns false and caches it when no enrollment row exists",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // findOne defaults to null → not enrolled (null, not undefined)
                        const result = await service.checkEnrollment(userId,
                            courseId)

                        expect(result).toBe(false)
                        // cached the negative result so repeat reads stay cheap
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.CourseEnrollment,
                            args: [
                                userId,
                                courseId,
                            ],
                            cacheResult: false,
                        })
                    })
            })
    })
