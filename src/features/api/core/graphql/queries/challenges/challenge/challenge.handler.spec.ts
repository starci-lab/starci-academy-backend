// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChallengeHandler,
} from "./challenge.handler"
import {
    ChallengeQuery,
} from "./challenge.query"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    ChallengePremiumLockedException,
} from "@modules/platform/exceptions/errors/courses/challenge-premium-locked"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in -- only the id reaches the enrollment check. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** Owner content row as the handler selects it: premium flag + owning course id. */
const premiumContent = (
    courseId?: string,
) => ({
    id: "c1",
    isPremium: true,
    module: courseId
        ? {
            id: "m1",
            course: {
                id: courseId,
            },
        }
        : undefined,
})

/** Minimal challenge entity stand-in -- only the id matters for assertions. */
const fakeChallenge = (
    id: string,
): ChallengeEntity => ({
    id,
}) as unknown as ChallengeEntity

describe("ChallengeHandler",
    () => {
        let module: TestingModule
        let handler: ChallengeHandler
        let entityManager: EntityManagerMock
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "json">>
        let s3NameResolverService: jest.Mocked<Pick<S3NameResolverService, "challenge">>
        let userService: jest.Mocked<Pick<UserService, "checkEnrollment">>

        beforeEach(async () => {
            // primary entity manager resolves the challenge's owning content --
            // defaults to "no owner row found" so the premium-lock branch is skipped
            // unless a test programs it explicitly.
            entityManager = makeEntityManagerMock()

            // S3 read returns the JSON document the test programs (rejects -> not found)
            s3ReadService = {
                json: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "json">>

            // name resolver echoes a deterministic object key the read service consumes
            s3NameResolverService = {
                challenge: jest.fn(() => "challenges/ch-1/vi.json"),
            } as unknown as jest.Mocked<Pick<S3NameResolverService, "challenge">>

            // enrollment check defaults to "not enrolled" so the premium lock holds
            // unless a test grants access explicitly
            userService = {
                checkEnrollment: jest.fn().mockResolvedValue(false),
            } as unknown as jest.Mocked<Pick<UserService, "checkEnrollment">>

            module = await Test.createTestingModule({
                providers: [
                    ChallengeHandler,
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: S3NameResolverService,
                        useValue: s3NameResolverService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ChallengeHandler>(ChallengeHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("resolves the object key by id + locale and returns the read challenge",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(fakeChallenge("ch-1"))

                const result = await handler.execute(
                    new ChallengeQuery({
                        request: {
                            id: "ch-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(s3NameResolverService.challenge).toHaveBeenCalledWith(
                    "ch-1",
                    Locale.Vi,
                )
                expect(result.id).toBe("ch-1")
            })

        it("throws when the S3 document is missing (read resolves null)",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ChallengeQuery({
                            request: {
                                id: "ch-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeNotFoundException)
            })

        it("throws when the S3 read rejects (swallowed to null by the handler)",
            async () => {
                s3ReadService.json.mockRejectedValueOnce(new Error("s3 down"))

                await expect(
                    handler.execute(
                        new ChallengeQuery({
                            request: {
                                id: "ch-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeNotFoundException)
            })

        it("throws when the owning content is premium and the caller is anonymous",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(fakeChallenge("ch-1"))
                entityManager.findOne.mockResolvedValueOnce(premiumContent("course-1"))

                await expect(
                    handler.execute(
                        new ChallengeQuery({
                            request: {
                                id: "ch-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengePremiumLockedException)
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })

        it("throws when the owning content is premium and the caller is not enrolled",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(fakeChallenge("ch-1"))
                entityManager.findOne.mockResolvedValueOnce(premiumContent("course-1"))

                await expect(
                    handler.execute(
                        new ChallengeQuery({
                            request: {
                                id: "ch-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengePremiumLockedException)
                expect(userService.checkEnrollment).toHaveBeenCalledWith(
                    "user-1",
                    "course-1",
                )
            })

        it("throws when the owning content is premium but its course cannot be resolved",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(fakeChallenge("ch-1"))
                entityManager.findOne.mockResolvedValueOnce(premiumContent())

                await expect(
                    handler.execute(
                        new ChallengeQuery({
                            request: {
                                id: "ch-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengePremiumLockedException)
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })

        it("returns a premium challenge to a learner enrolled in the owning course",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(fakeChallenge("ch-1"))
                entityManager.findOne.mockResolvedValueOnce(premiumContent("course-1"))
                userService.checkEnrollment.mockResolvedValueOnce(true)

                const result = await handler.execute(
                    new ChallengeQuery({
                        request: {
                            id: "ch-1",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(result.id).toBe("ch-1")
                expect(userService.checkEnrollment).toHaveBeenCalledWith(
                    "user-1",
                    "course-1",
                )
            })

        it("returns a free challenge without consulting enrollment",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(fakeChallenge("ch-1"))
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: false,
                })

                const result = await handler.execute(
                    new ChallengeQuery({
                        request: {
                            id: "ch-1",
                        },
                    }),
                )

                expect(result.id).toBe("ch-1")
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })
    })
