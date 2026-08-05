import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import type {
    QueryDeepPartialEntity,
} from "typeorm/query-builder/QueryPartialEntity"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    CvGenerationNotFoundException,
} from "@modules/platform/exceptions/errors/api/cv-generation-not-found"
import {
    CvSubmissionExtractS3BufferEmptyException,
    CvSubmissionExtractEmptyTextException,
} from "@modules/platform/exceptions/errors/api/review-cv-submission-extract"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    extractCvText,
} from "../../generate-cv/steps/extract-cv-text"
import {
    CvScoringService,
} from "./cv-scoring.service"
import type {
    ScoreCvResult,
    ScoreUploadedCvParams,
} from "./types"

@Injectable()
/**
 * WF-07 -- UPLOAD-scoring path. Grades a user-UPLOADED CV that already lives in
 * the unified `cv_generations` table (`source = uploaded`, `uploadedCdnKey` set)
 * and writes the resulting `score` + `feedback` back onto that same row.
 *
 * It is the upload analogue of {@link GenerateCvScoreStepService}: it reuses the
 * SAME {@link CvScoringService} but feeds the extracted plain text via the
 * `cvText` branch (instead of the composed `structuredData`), so both CV sources
 * are graded by one rubric in one place.
 *
 * Steps: load the row -> buffer `uploadedCdnKey` from MinIO -> extract text
 * (pdf/docx/plain via {@link extractCvText}) -> score -> persist. Scoring itself is
 * best-effort at the persistence boundary: an AI/parse failure inside
 * {@link CvScoringService.score} is caught by the caller / worker; here a missing
 * row, empty file, or empty extracted text is a hard failure (nothing to grade),
 * surfaced as a typed exception rather than a silent null score.
 */
export class ScoreUploadedCvService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
        private readonly cvScoringService: CvScoringService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Buffer + extract the uploaded CV, score it with the shared rubric, and
     * persist `score` + `feedback` onto the `cv_generations` row.
     *
     * @param params - {@link ScoreUploadedCvParams} (row id + owner + rubric hints).
     * @returns The {@link ScoreCvResult} that was written onto the row.
     * @throws CvGenerationNotFoundException When the row is missing or has no
     *   `uploadedCdnKey` (nothing to grade).
     * @throws CvSubmissionExtractS3BufferEmptyException When MinIO returns no bytes.
     * @throws CvSubmissionExtractEmptyTextException When extraction yields no text.
     */
    async scoreUploadedCv(
        {
            cvGenerationId,
            userId,
            templateLevel,
            locale,
            selection,
        }: ScoreUploadedCvParams,
    ): Promise<ScoreCvResult> {
        // load the uploaded row + resolve its stored object key
        const generation = await this.entityManager.findOne(
            UserCvGenerationEntity,
            {
                where: {
                    id: cvGenerationId,
                },
                select: {
                    id: true,
                    uploadedCdnKey: true,
                },
            },
        )
        // a missing row OR a row without an uploaded file has nothing to grade
        const key = generation?.uploadedCdnKey
        if (!generation || !key) {
            throw new CvGenerationNotFoundException({
                cvGenerationId,
            })
        }

        // buffer the uploaded file from MinIO (same store the presign upload targets)
        const buffer = await this.s3ReadService.buffer({
            key,
            provider: S3Provider.Minio,
        })
        if (!buffer || buffer.length === 0) {
            throw new CvSubmissionExtractS3BufferEmptyException({
                key,
                provider: S3Provider.Minio,
            })
        }

        // extract plain text (pdf -> pdf-parse, docx -> mammoth, else utf-8)
        const cvText = await extractCvText({
            buffer,
            key,
        })
        if (cvText.length === 0) {
            throw new CvSubmissionExtractEmptyTextException({
                key,
            })
        }

        // SOURCE-AGNOSTIC scoring via the SHARED service -- the `cvText` branch
        // (upload) mirrors the generate step's `structuredData` branch. The
        // shared service throws on an unparseable model reply; the caller decides
        // whether to degrade (worker) or surface (sync mutation).
        const result = await this.cvScoringService.score({
            userId,
            cvText,
            ...(templateLevel !== undefined ? {
                templateLevel,
            } : {
            }),
            ...(locale !== undefined ? {
                locale,
            } : {
            }),
            ...(selection !== undefined ? {
                selection,
            } : {
            }),
        })

        // persist the grade onto the SAME unified row (identical write to the
        // generate score step) -- one table, one shape, whichever the source.
        await this.entityManager.update(
            UserCvGenerationEntity,
            {
                id: cvGenerationId,
            },
            {
                score: result.score,
                feedback: result.feedback,
            } as QueryDeepPartialEntity<UserCvGenerationEntity>,
        )

        this.winstonService.log(
            WinstonLog.ProcessCVSubmissionStepExecuted,
            {
                jobId: "",
                queueName: "score-uploaded-cv",
                step: "score-uploaded",
                stepIndex: 0,
                payload: {
                    cvGenerationId,
                    userId,
                },
                success: true,
            },
        )

        return result
    }
}
