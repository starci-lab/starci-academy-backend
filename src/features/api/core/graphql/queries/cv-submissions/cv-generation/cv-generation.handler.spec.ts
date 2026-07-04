// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle (mirrors sync-submission.handler.spec.ts).
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CvGenerationMode,
    CvGenerationStatus,
    CvSource,
} from "@modules/databases"
import {
    CvGenerationNotFoundException,
} from "@modules/exceptions"
import {
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
import {
    CvGenerationHandler,
} from "./cv-generation.handler"
import {
    CvGenerationQuery,
} from "./cv-generation.query"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** A fully-populated `UserCvGenerationEntity` row carrying the new fields. */
const makeGenerationRow = (overrides: Record<string, unknown> = {
}) => ({
    id: "cv-gen-1",
    mode: CvGenerationMode.Generate,
    status: CvGenerationStatus.Done,
    source: CvSource.Generated,
    sourceCvSubmissionId: null,
    courseId: "course-1",
    label: "My senior CV",
    targetRole: "Staff Engineer",
    language: "en",
    score: 87,
    extraPrompts: "Ships production systems.",
    structuredData: {
        fullName: "Jane Doe",
    },
    latexCdnKey: null,
    processedAt: new Date("2026-01-01T00:00:00.000Z"),
    errorMessage: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
})

describe("CvGenerationHandler",
    () => {
        let module: TestingModule
        let handler: CvGenerationHandler
        let entityManager: EntityManagerMock
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "text">>

        beforeEach(async () => {
            // fresh jest-backed entity manager — only `findOne` (ownership lookup) is
            // exercised by this handler; no real DB access
            entityManager = makeEntityManagerMock()

            // s3 read is mocked wholesale — resolves null unless a test programs a
            // .tex body for a row that carries a `latexCdnKey`
            s3ReadService = {
                text: jest.fn().mockResolvedValue(null),
            } as unknown as jest.Mocked<Pick<S3ReadService, "text">>

            module = await Test.createTestingModule({
                providers: [
                    CvGenerationHandler,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<CvGenerationHandler>(CvGenerationHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("execute",
            () => {
                it("throws (not-found) when there is no authenticated user — never queries the DB",
                    async () => {
                        await expect(
                            handler.execute(
                                new CvGenerationQuery({
                                    request: {
                                        id: "cv-gen-1",
                                    },
                                    user: undefined,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(CvGenerationNotFoundException)

                        // the ternary short-circuits to `null` before any lookup happens
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(s3ReadService.text).not.toHaveBeenCalled()
                    })

                it("throws (not-found) when no row matches the id for the calling user",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            handler.execute(
                                new CvGenerationQuery({
                                    request: {
                                        id: "missing",
                                    },
                                    user: fakeUser("user-1"),
                                }),
                            ),
                        ).rejects.toBeInstanceOf(CvGenerationNotFoundException)

                        // the ownership lookup is scoped to this user
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                where: expect.objectContaining({
                                    id: "missing",
                                    user: {
                                        id: "user-1",
                                    },
                                }),
                            }),
                        )
                        expect(s3ReadService.text).not.toHaveBeenCalled()
                    })

                it("maps source/score/courseId/label/targetRole/language from the entity onto the payload",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow())

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        // every new field is carried onto the payload verbatim
                        expect(result).toEqual(
                            expect.objectContaining({
                                id: "cv-gen-1",
                                source: CvSource.Generated,
                                score: 87,
                                courseId: "course-1",
                                label: "My senior CV",
                                targetRole: "Staff Engineer",
                                language: "en",
                            }),
                        )
                        // no stored .tex key on this row → latexSource resolves to null,
                        // and the S3 read is skipped entirely
                        expect(result.latexSource).toBeNull()
                        expect(s3ReadService.text).not.toHaveBeenCalled()
                    })

                it("resolves latexSource from MinIO when the row carries a latexCdnKey",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            latexCdnKey: "cv-generations/cv-gen-1.tex",
                        }))
                        s3ReadService.text.mockResolvedValueOnce("\\documentclass{article}")

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(s3ReadService.text).toHaveBeenCalledWith({
                            key: "cv-generations/cv-gen-1.tex",
                            provider: S3Provider.Minio,
                        })
                        expect(result.latexSource).toBe("\\documentclass{article}")
                    })

                it("maps a Null courseId/label/targetRole/language/score straight through (untied CV)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            courseId: null,
                            label: null,
                            targetRole: null,
                            language: null,
                            score: null,
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(result).toEqual(
                            expect.objectContaining({
                                courseId: null,
                                label: null,
                                targetRole: null,
                                language: null,
                                score: null,
                            }),
                        )
                    })
            })
    })
