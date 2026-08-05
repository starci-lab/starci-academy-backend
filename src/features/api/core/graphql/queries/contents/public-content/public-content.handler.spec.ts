// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    PublicContentHandler,
} from "./public-content.handler"
import {
    PublicContentQuery,
} from "./public-content.query"
import {
    ContentContextNotFound,
    ContentNotFoundException,
} from "@modules/exceptions"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"
import {
    Locale,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    ContentEntity,
} from "@modules/databases"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal content entity stand-in -- only the id matters for assertions. */
const fakeContent = (
    id: string,
): ContentEntity => ({
    id,
}) as unknown as ContentEntity

describe("PublicContentHandler",
    () => {
        let module: TestingModule
        let handler: PublicContentHandler
        let entityManager: EntityManagerMock
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "json">>
        let s3NameResolverService: jest.Mocked<Pick<S3NameResolverService, "content">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            s3ReadService = {
                json: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "json">>

            s3NameResolverService = {
                content: jest.fn(() => "contents/c1/vi.json"),
            } as unknown as jest.Mocked<Pick<S3NameResolverService, "content">>

            module = await Test.createTestingModule({
                providers: [
                    PublicContentHandler,
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

            handler = module.get<PublicContentHandler>(PublicContentHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when neither id nor displayId is provided",
            async () => {
                await expect(
                    handler.execute(
                        new PublicContentQuery({
                            request: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentContextNotFound)

                expect(s3ReadService.json).not.toHaveBeenCalled()
            })

        it("resolves an id from displayId then returns the non-premium S3 document",
            async () => {
                // displayId lookup resolves a free content row
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: false,
                })
                s3ReadService.json.mockResolvedValueOnce(fakeContent("c1"))

                const result = await handler.execute(
                    new PublicContentQuery({
                        request: {
                            displayId: "intro",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.id).toBe("c1")
                expect(s3NameResolverService.content).toHaveBeenCalledWith(
                    "c1",
                    Locale.Vi,
                )
            })

        it("blocks a premium content resolved by displayId",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "c1",
                    isPremium: true,
                })

                await expect(
                    handler.execute(
                        new PublicContentQuery({
                            request: {
                                displayId: "premium-lesson",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentNotFoundException)

                // premium short-circuits before any S3 read
                expect(s3ReadService.json).not.toHaveBeenCalled()
            })

        it("throws when the displayId resolves to no content row",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new PublicContentQuery({
                            request: {
                                displayId: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentNotFoundException)
            })

        it("blocks a premium content requested directly by id",
            async () => {
                // the id-branch verifies the row is non-premium
                entityManager.findOne.mockResolvedValueOnce({
                    isPremium: true,
                })

                await expect(
                    handler.execute(
                        new PublicContentQuery({
                            request: {
                                id: "c1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentNotFoundException)

                expect(s3ReadService.json).not.toHaveBeenCalled()
            })

        it("returns the S3 document for a non-premium id",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    isPremium: false,
                })
                s3ReadService.json.mockResolvedValueOnce(fakeContent("c1"))

                const result = await handler.execute(
                    new PublicContentQuery({
                        request: {
                            id: "c1",
                        },
                    }),
                )

                expect(result.id).toBe("c1")
            })

        it("throws when the S3 document is missing for a valid non-premium id",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    isPremium: false,
                })
                s3ReadService.json.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new PublicContentQuery({
                            request: {
                                id: "c1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ContentNotFoundException)
            })
    })
