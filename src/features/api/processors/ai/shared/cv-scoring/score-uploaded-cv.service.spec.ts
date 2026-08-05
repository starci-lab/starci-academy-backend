import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CvGenerationNotFoundException,
} from "@modules/platform/exceptions/errors/api/cv-generation-not-found"
import {
    CvSubmissionExtractS3BufferEmptyException,
    CvSubmissionExtractEmptyTextException,
} from "@modules/platform/exceptions/errors/api/review-cv-submission-extract"
import {
    extractCvText,
} from "../../generate-cv/steps/extract-cv-text"
import {
    CvScoringService,
} from "./cv-scoring.service"
import {
    ScoreUploadedCvService,
} from "./score-uploaded-cv.service"

// mock the text-extraction module so the spec never touches pdf-parse / mammoth
jest.mock("../../generate-cv/steps/extract-cv-text",
    () => ({
        extractCvText: jest.fn(),
    }))

const mockedExtractCvText = extractCvText as jest.MockedFunction<typeof extractCvText>

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The uploaded `cv_generations` row the service loads by id. */
const UPLOADED_ROW = {
    id: "cv-gen-upload-1",
    uploadedCdnKey: "cv-uploads/user-1/resume.pdf",
}

/** A valid grade the shared scoring service returns by default. */
const SCORE_RESULT = {
    score: 82,
    feedback: {
        shortFeedback: "Strong uploaded CV.",
        templateLevel: "mid",
        items: [],
    },
}

describe("ScoreUploadedCvService",
    () => {
        let module: TestingModule
        let service: ScoreUploadedCvService
        let entityManager: jest.Mocked<Pick<EntityManager, "findOne" | "update">>
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "buffer">>
        let cvScoringService: jest.Mocked<Pick<CvScoringService, "score">>

        beforeEach(async () => {
            // entity manager mock -- `findOne` loads the row, `update` persists the grade
            entityManager = {
                findOne: jest.fn().mockResolvedValue(UPLOADED_ROW),
                update: jest.fn().mockResolvedValue({
                    affected: 1,
                }),
            } as unknown as jest.Mocked<Pick<EntityManager, "findOne" | "update">>

            // storage mock -- returns non-empty bytes by default
            s3ReadService = {
                buffer: jest.fn().mockResolvedValue(Buffer.from("PDF-BYTES")),
            } as unknown as jest.Mocked<Pick<S3ReadService, "buffer">>

            // shared scoring mock -- happy path returns a valid grade
            cvScoringService = {
                score: jest.fn().mockResolvedValue(SCORE_RESULT),
            } as unknown as jest.Mocked<Pick<CvScoringService, "score">>

            // extraction mock -- happy path returns non-empty text
            mockedExtractCvText.mockReset()
            mockedExtractCvText.mockResolvedValue("Extracted CV text content.")

            module = await Test.createTestingModule({
                providers: [
                    ScoreUploadedCvService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: CvScoringService,
                        useValue: cvScoringService,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<ScoreUploadedCvService>(ScoreUploadedCvService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("scoreUploadedCv",
            () => {
                it("buffers + extracts the uploaded file, scores via the SHARED service using the cvText branch, and persists onto the same row",
                    async () => {
                        const result = await service.scoreUploadedCv({
                            cvGenerationId: "cv-gen-upload-1",
                            userId: "user-1",
                            templateLevel: "mid",
                        })

                        // buffered the uploaded key from MinIO
                        expect(s3ReadService.buffer).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: UPLOADED_ROW.uploadedCdnKey,
                            }),
                        )
                        // extracted text from the buffered file
                        expect(mockedExtractCvText).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: UPLOADED_ROW.uploadedCdnKey,
                            }),
                        )
                        // fed the extracted text via the `cvText` branch (NOT structuredData)
                        expect(cvScoringService.score).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                cvText: "Extracted CV text content.",
                                templateLevel: "mid",
                            }),
                        )
                        expect(cvScoringService.score).toHaveBeenCalledWith(
                            expect.not.objectContaining({
                                structuredData: expect.anything(),
                            }),
                        )
                        // persisted the grade onto the same cv_generations row by id
                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            {
                                id: "cv-gen-upload-1",
                            },
                            expect.objectContaining({
                                score: 82,
                                feedback: expect.objectContaining({
                                    shortFeedback: "Strong uploaded CV.",
                                }),
                            }),
                        )
                        // returns the grade it wrote
                        expect(result.score).toBe(82)
                    })

                it("throws CvGenerationNotFoundException when the row is missing (nothing to grade)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.scoreUploadedCv({
                                cvGenerationId: "missing",
                                userId: "user-1",
                            }),
                        ).rejects.toBeInstanceOf(CvGenerationNotFoundException)

                        // never attempted to buffer / score a non-existent row
                        expect(s3ReadService.buffer).not.toHaveBeenCalled()
                        expect(cvScoringService.score).not.toHaveBeenCalled()
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("throws CvGenerationNotFoundException when the row has no uploadedCdnKey",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "cv-gen-upload-1",
                            uploadedCdnKey: null,
                        } as never)

                        await expect(
                            service.scoreUploadedCv({
                                cvGenerationId: "cv-gen-upload-1",
                                userId: "user-1",
                            }),
                        ).rejects.toBeInstanceOf(CvGenerationNotFoundException)

                        expect(s3ReadService.buffer).not.toHaveBeenCalled()
                    })

                it("throws CvSubmissionExtractS3BufferEmptyException when MinIO returns no bytes",
                    async () => {
                        s3ReadService.buffer.mockResolvedValueOnce(null)

                        await expect(
                            service.scoreUploadedCv({
                                cvGenerationId: "cv-gen-upload-1",
                                userId: "user-1",
                            }),
                        ).rejects.toBeInstanceOf(CvSubmissionExtractS3BufferEmptyException)

                        // did not attempt to extract / score an empty file
                        expect(mockedExtractCvText).not.toHaveBeenCalled()
                        expect(cvScoringService.score).not.toHaveBeenCalled()
                    })

                it("throws CvSubmissionExtractEmptyTextException when extraction yields no text",
                    async () => {
                        mockedExtractCvText.mockResolvedValueOnce("")

                        await expect(
                            service.scoreUploadedCv({
                                cvGenerationId: "cv-gen-upload-1",
                                userId: "user-1",
                            }),
                        ).rejects.toBeInstanceOf(CvSubmissionExtractEmptyTextException)

                        expect(cvScoringService.score).not.toHaveBeenCalled()
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("propagates a scoring failure (unparseable model reply) WITHOUT persisting a grade",
                    async () => {
                        cvScoringService.score.mockRejectedValueOnce(new Error("model exploded"))

                        await expect(
                            service.scoreUploadedCv({
                                cvGenerationId: "cv-gen-upload-1",
                                userId: "user-1",
                            }),
                        ).rejects.toThrow("model exploded")

                        // no partial write -- the row keeps its prior (null) grade
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })
            })
    })
