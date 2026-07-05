import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvSource,
    InjectPrimaryPostgreSQLEntityManager,
    SubmissionFeedbackSeverity,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    S3BuildService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    CvGenerationNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    CvGenerationQuery,
} from "./cv-generation.query"
import {
    CvFeedback,
    CvGenerationPayload,
} from "./graphql-types"

/** Enum members of {@link SubmissionFeedbackSeverity}, for defensive coercion. */
const VALID_SEVERITIES: ReadonlyArray<string> = Object.values(SubmissionFeedbackSeverity)

@QueryHandler(CvGenerationQuery)
@Injectable()
export class CvGenerationHandler
    extends ICQRSHandler<CvGenerationQuery, CvGenerationPayload>
    implements IQueryHandler<CvGenerationQuery, CvGenerationPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    protected override async process(
        query: CvGenerationQuery,
    ): Promise<CvGenerationPayload> {
        const {
            user,
            request: {
                id,
            },
        } = query.params

        // fetch the run + assert ownership before returning anything. `course`
        // is loaded eagerly so `courseTitle` resolves without a second query.
        const generation = user
            ? await this.entityManager.findOne(
                UserCvGenerationEntity,
                {
                    where: {
                        id,
                        user: {
                            id: user.id,
                        },
                    },
                    relations: {
                        course: true,
                    },
                },
            )
            : null

        if (!generation) {
            throw new CvGenerationNotFoundException({
                cvGenerationId: id,
            })
        }

        // resolve the stored .tex object to its raw text server-side so the FE
        // never needs direct MinIO access. null key / missing object → null.
        const latexSource = generation.latexCdnKey
            ? await this.s3ReadService.text({
                key: generation.latexCdnKey,
                provider: S3Provider.Minio,
            })
            : null

        // uploaded CVs carry a raw file (pdf/docx) instead of a rendered .tex —
        // resolve it to a presigned GET URL server-side, mirroring the legacy
        // cvUrl query's pattern (buildSignedGetObjectUrl).
        const uploadedCvUrl = generation.source === CvSource.Uploaded && generation.uploadedCdnKey
            ? await this.s3BuildService.buildSignedGetObjectUrl({
                key: generation.uploadedCdnKey,
                provider: S3Provider.Minio,
            })
            : null

        // generated CVs may have a server-compiled PDF (tectonic, best-effort at
        // render time) — resolve it the same way as the uploaded file so the FE
        // can preview EITHER source through the same PDF viewer.
        const generatedPdfUrl = generation.source === CvSource.Generated && generation.generatedPdfCdnKey
            ? await this.s3BuildService.buildSignedGetObjectUrl({
                key: generation.generatedPdfCdnKey,
                provider: S3Provider.Minio,
            })
            : null

        return {
            id: generation.id,
            mode: generation.mode,
            status: generation.status,
            source: generation.source,
            sourceCvSubmissionId: generation.sourceCvSubmissionId,
            courseId: generation.courseId,
            courseTitle: generation.course?.title ?? null,
            label: generation.label,
            targetRole: generation.targetRole,
            language: generation.language,
            score: generation.score,
            feedback: this.mapFeedback(generation.feedback),
            extraPrompts: generation.extraPrompts,
            structuredData: generation.structuredData,
            latexSource,
            uploadedCvUrl,
            generatedPdfUrl,
            processedAt: generation.processedAt,
            errorMessage: generation.errorMessage,
            createdAt: generation.createdAt,
        }
    }

    /**
     * Shape-coerces the stored `feedback` jsonb (produced by
     * `CvScoreFeedback`/`parseCvScore` in the shared scoring service) into the
     * typed GraphQL {@link CvFeedback}. Defensive — a malformed/legacy row
     * degrades to an empty item list rather than throwing.
     */
    private mapFeedback(
        raw: Record<string, unknown> | null,
    ): CvFeedback | null {
        if (!raw) {
            return null
        }
        const items = Array.isArray(raw.items)
            ? (raw.items as Array<Record<string, unknown>>).map((item) => ({
                severity: VALID_SEVERITIES.includes(String(item?.severity))
                    ? (item.severity as SubmissionFeedbackSeverity)
                    : SubmissionFeedbackSeverity.Low,
                section: typeof item?.section === "string" ? item.section : "",
                message: typeof item?.message === "string" ? item.message : "",
                suggestion: typeof item?.suggestion === "string" ? item.suggestion : null,
            }))
            : []
        return {
            shortFeedback: typeof raw.shortFeedback === "string" ? raw.shortFeedback : "",
            templateLevel: typeof raw.templateLevel === "string" ? raw.templateLevel : "",
            items,
        }
    }
}
