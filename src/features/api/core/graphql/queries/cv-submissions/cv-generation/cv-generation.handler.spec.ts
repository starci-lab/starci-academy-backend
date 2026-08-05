// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
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
    SubmissionFeedbackSeverity,
} from "@modules/databases"
import {
    CvGenerationNotFoundException,
} from "@modules/exceptions"
import {
    S3BuildService,
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
    course: {
        title: "System Design Mastery",
    },
    label: "My senior CV",
    targetRole: "Staff Engineer",
    language: "en",
    score: 87,
    feedback: null,
    extraPrompts: "Ships production systems.",
    structuredData: {
        fullName: "Jane Doe",
    },
    latexCdnKey: null,
    uploadedCdnKey: null,
    generatedPdfCdnKey: null,
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
        let s3BuildService: jest.Mocked<Pick<S3BuildService, "buildSignedGetObjectUrl">>

        beforeEach(async () => {
            // fresh jest-backed entity manager -- only `findOne` (ownership lookup) is
            // exercised by this handler; no real DB access
            entityManager = makeEntityManagerMock()

            // s3 read is mocked wholesale -- resolves null unless a test programs a
            // .tex body for a row that carries a `latexCdnKey`
            s3ReadService = {
                text: jest.fn().mockResolvedValue(null),
            } as unknown as jest.Mocked<Pick<S3ReadService, "text">>

            // s3 build (presign) is mocked wholesale -- resolves a fake signed URL
            // unless a test asserts it's never called (generated-source rows)
            s3BuildService = {
                buildSignedGetObjectUrl: jest.fn().mockResolvedValue("https://minio.local/signed"),
            } as unknown as jest.Mocked<Pick<S3BuildService, "buildSignedGetObjectUrl">>

            module = await Test.createTestingModule({
                providers: [
                    CvGenerationHandler,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: S3BuildService,
                        useValue: s3BuildService,
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
                        expect(s3BuildService.buildSignedGetObjectUrl).not.toHaveBeenCalled()
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
                                courseTitle: "System Design Mastery",
                                label: "My senior CV",
                                targetRole: "Staff Engineer",
                                language: "en",
                            }),
                        )
                        // no feedback on this row yet -> null (not an empty object)
                        expect(result.feedback).toBeNull()
                        // no stored .tex key on this row -> latexSource resolves to null,
                        // and the S3 read is skipped entirely
                        expect(result.latexSource).toBeNull()
                        expect(s3ReadService.text).not.toHaveBeenCalled()
                        // Generated source, no uploaded file -> uploadedCvUrl stays null and
                        // the presign is never attempted
                        expect(result.uploadedCvUrl).toBeNull()
                        // Generated source, but no compiled PDF yet -> generatedPdfUrl stays
                        // null too, same "no presign attempted" contract
                        expect(result.generatedPdfUrl).toBeNull()
                        expect(s3BuildService.buildSignedGetObjectUrl).not.toHaveBeenCalled()
                    })

                it("resolves generatedPdfUrl via a presigned GET URL when source = Generated and the compile succeeded",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            generatedPdfCdnKey: "cv-generations/cv-gen-1.pdf",
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(s3BuildService.buildSignedGetObjectUrl).toHaveBeenCalledWith({
                            key: "cv-generations/cv-gen-1.pdf",
                            provider: S3Provider.Minio,
                        })
                        expect(result.generatedPdfUrl).toBe("https://minio.local/signed")
                    })

                it("does not presign generatedPdfUrl when source = Uploaded (even if the column were somehow set)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            source: CvSource.Uploaded,
                            uploadedCdnKey: "cv-generations/cv-gen-1.pdf",
                            generatedPdfCdnKey: "cv-generations/cv-gen-1.pdf",
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(result.generatedPdfUrl).toBeNull()
                    })

                it("maps courseTitle from the loaded course relation, and null when untied",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            courseId: null,
                            course: null,
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        // the ownership lookup eagerly loads `course` so courseTitle
                        // resolves without a second query
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                relations: {
                                    course: true,
                                },
                            }),
                        )
                        expect(result.courseTitle).toBeNull()
                    })

                it("parses feedback.items (shape-coerced), defaulting an unrecognized severity to Low",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            feedback: {
                                shortFeedback: "Solid mid-level CV, needs measurable impact.",
                                templateLevel: "mid",
                                items: [
                                    {
                                        severity: "high",
                                        section: "impact",
                                        message: "Bullets lack quantified outcomes.",
                                        suggestion: "Add metrics (%, time saved, users).",
                                    },
                                    {
                                        severity: "not-a-real-severity",
                                        section: "clarity",
                                        message: "Summary is clear.",
                                        suggestion: null,
                                    },
                                ],
                            },
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(result.feedback).toEqual({
                            shortFeedback: "Solid mid-level CV, needs measurable impact.",
                            templateLevel: "mid",
                            items: [
                                {
                                    severity: SubmissionFeedbackSeverity.High,
                                    section: "impact",
                                    message: "Bullets lack quantified outcomes.",
                                    suggestion: "Add metrics (%, time saved, users).",
                                },
                                {
                                    // unrecognized raw value degrades to Low rather than
                                    // propagating garbage into a typed GraphQL enum
                                    severity: SubmissionFeedbackSeverity.Low,
                                    section: "clarity",
                                    message: "Summary is clear.",
                                    suggestion: null,
                                },
                            ],
                        })
                    })

                it("resolves uploadedCvUrl via a presigned GET URL when source = Uploaded",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            source: CvSource.Uploaded,
                            uploadedCdnKey: "cv-generations/cv-gen-1.pdf",
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(s3BuildService.buildSignedGetObjectUrl).toHaveBeenCalledWith({
                            key: "cv-generations/cv-gen-1.pdf",
                            provider: S3Provider.Minio,
                        })
                        expect(result.uploadedCvUrl).toBe("https://minio.local/signed")
                    })

                it("does not presign uploadedCvUrl when source = Uploaded but no file was ever stored",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(makeGenerationRow({
                            source: CvSource.Uploaded,
                            uploadedCdnKey: null,
                        }))

                        const result = await handler.execute(
                            new CvGenerationQuery({
                                request: {
                                    id: "cv-gen-1",
                                },
                                user: fakeUser("user-1"),
                            }),
                        )

                        expect(result.uploadedCvUrl).toBeNull()
                        expect(s3BuildService.buildSignedGetObjectUrl).not.toHaveBeenCalled()
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
