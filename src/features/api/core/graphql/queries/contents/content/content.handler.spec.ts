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
    ContentHandler,
} from "./content.handler"
import {
    ContentQuery,
} from "./content.query"
import {
    ContentContextNotFound,
} from "@modules/platform/exceptions/errors/courses/content-context-not-found"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in -- only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/**
 * Build the S3 content document the read service hands back. The body carries a
 * testing-section heading so the premium-lock truncation has a cut point.
 */
const buildS3Content = (
    overrides: Partial<ContentEntity> = {
    },
): ContentEntity => ({
    id: "c1",
    isPremium: false,
    body: "# Intro\n\nteaser body\n\n## Verification\n\nsecret answer",
    bodies: [],
    codeExplainings: [
        {
            id: "ce-1",
        },
    ],
    codeImplementations: [
        {
            id: "ci-1",
        },
    ],
    ...overrides,
}) as unknown as ContentEntity

describe("ContentHandler",
    () => {
        let module: TestingModule
        let handler: ContentHandler
        let entityManager: EntityManagerMock
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "json">>
        let s3NameResolverService: jest.Mocked<Pick<S3NameResolverService, "content">>
        let userService: jest.Mocked<Pick<UserService, "checkEnrollment">>
        let redis: {
            incr: jest.Mock
            expire: jest.Mock
            ttl: jest.Mock
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            s3ReadService = {
                json: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "json">>

            s3NameResolverService = {
                content: jest.fn(() => "contents/c1/vi.json"),
            } as unknown as jest.Mocked<Pick<S3NameResolverService, "content">>

            userService = {
                checkEnrollment: jest.fn(),
            } as unknown as jest.Mocked<Pick<UserService, "checkEnrollment">>

            // scrape-rate guard: every hit starts a fresh window under the limit
            redis = {
                incr: jest.fn(async () => 1),
                expire: jest.fn(async () => 1),
                ttl: jest.fn(async () => 3600),
            }

            module = await Test.createTestingModule({
                providers: [
                    ContentHandler,
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
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: redis,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            handler = module.get<ContentHandler>(ContentHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when neither id nor displayId is provided",
            async () => {
                await expect(
                    handler.execute(
                        new ContentQuery({
                            request: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentContextNotFound)

                expect(s3ReadService.json).not.toHaveBeenCalled()
            })

        it("resolves the id from displayId before reading the S3 document",
            async () => {
                entityManager.findOne
                    // displayId -> id resolution
                    .mockResolvedValueOnce({
                        id: "c1",
                    })
                    // live premium/course row lookup (free content)
                    .mockResolvedValueOnce({
                        id: "c1",
                        isPremium: false,
                        module: {
                            course: {
                                id: "course-1",
                            },
                        },
                    })
                s3ReadService.json.mockResolvedValueOnce(buildS3Content())

                const result = await handler.execute(
                    new ContentQuery({
                        request: {
                            displayId: "intro",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(s3NameResolverService.content).toHaveBeenCalledWith(
                    "c1",
                    Locale.Vi,
                )
                // free content is never locked
                expect(result.isPremium).toBe(false)
            })

        it("throws when the displayId resolves to no content row",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ContentQuery({
                            request: {
                                displayId: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentNotFoundException)
            })

        it("throws when the S3 document is missing",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ContentQuery({
                            request: {
                                id: "c1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentNotFoundException)
            })

        it("returns the full body and unlocks free content",
            async () => {
                // the live row says the content is free
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: false,
                    module: {
                        course: {
                            id: "course-1",
                        },
                    },
                })
                s3ReadService.json.mockResolvedValueOnce(buildS3Content())

                const result = await handler.execute(
                    new ContentQuery({
                        request: {
                            id: "c1",
                        },
                    }),
                )

                expect(result.isPremium).toBe(false)
                // full body and code assets are intact
                expect(result.body).toContain("secret answer")
                expect(result.codeExplainings).toHaveLength(1)
                expect(result.codeImplementations).toHaveLength(1)
                // free content never consults enrollment
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })

        it("locks and truncates premium content for a non-enrolled viewer",
            async () => {
                // the live row flags the content premium and owns course-1
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: true,
                    module: {
                        course: {
                            id: "course-1",
                        },
                    },
                })
                s3ReadService.json.mockResolvedValueOnce(
                    buildS3Content({
                        isPremium: true,
                    }),
                )
                // viewer is not enrolled
                userService.checkEnrollment.mockResolvedValueOnce(false)

                const result = await handler.execute(
                    new ContentQuery({
                        request: {
                            id: "c1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                // locked-for-you flag stays true
                expect(result.isPremium).toBe(true)
                // body is cut before the Verification section
                expect(result.body).toContain("teaser body")
                expect(result.body).not.toContain("secret answer")
                // premium-only code assets are stripped
                expect(result.codeExplainings).toEqual([])
                expect(result.codeImplementations).toEqual([])
                expect(userService.checkEnrollment).toHaveBeenCalledWith(
                    "u1",
                    "course-1",
                )
            })

        it("returns the full premium body for an enrolled viewer and unlocks it",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: true,
                    module: {
                        course: {
                            id: "course-1",
                        },
                    },
                })
                s3ReadService.json.mockResolvedValueOnce(
                    buildS3Content({
                        isPremium: true,
                    }),
                )
                // viewer is enrolled in the owning course
                userService.checkEnrollment.mockResolvedValueOnce(true)

                const result = await handler.execute(
                    new ContentQuery({
                        request: {
                            id: "c1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                // entitled -> unlocked and full body preserved
                expect(result.isPremium).toBe(false)
                expect(result.body).toContain("secret answer")
                expect(result.codeImplementations).toHaveLength(1)
            })

        it("prefers the live DB premium flag over the stale S3 snapshot",
            async () => {
                // S3 snapshot still says free, but the live row toggled premium on
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: true,
                    module: {
                        course: {
                            id: "course-1",
                        },
                    },
                })
                s3ReadService.json.mockResolvedValueOnce(
                    buildS3Content({
                        isPremium: false,
                    }),
                )
                // anonymous viewer -> not entitled
                const result = await handler.execute(
                    new ContentQuery({
                        request: {
                            id: "c1",
                        },
                    }),
                )

                // the live premium flag wins -> content is locked
                expect(result.isPremium).toBe(true)
                expect(result.body).not.toContain("secret answer")
                // no user id -> entitlement is denied without an enrollment check
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })
    })
