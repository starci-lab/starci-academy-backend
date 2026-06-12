// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ChallengeHandler,
} from "./challenge.handler"
import {
    ChallengeQuery,
} from "./challenge.query"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"
import {
    Locale,
} from "@modules/databases"
import type {
    ChallengeEntity,
} from "@modules/databases"

/** Minimal challenge entity stand-in — only the id matters for assertions. */
const fakeChallenge = (
    id: string,
): ChallengeEntity => ({
    id,
}) as unknown as ChallengeEntity

describe("ChallengeHandler",
    () => {
        let module: TestingModule
        let handler: ChallengeHandler
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "json">>
        let s3NameResolverService: jest.Mocked<Pick<S3NameResolverService, "challenge">>

        beforeEach(async () => {
            // S3 read returns the JSON document the test programs (rejects → not found)
            s3ReadService = {
                json: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "json">>

            // name resolver echoes a deterministic object key the read service consumes
            s3NameResolverService = {
                challenge: jest.fn(() => "challenges/ch-1/vi.json"),
            } as unknown as jest.Mocked<Pick<S3NameResolverService, "challenge">>

            module = await Test.createTestingModule({
                providers: [
                    ChallengeHandler,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: S3NameResolverService,
                        useValue: s3NameResolverService,
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
    })
