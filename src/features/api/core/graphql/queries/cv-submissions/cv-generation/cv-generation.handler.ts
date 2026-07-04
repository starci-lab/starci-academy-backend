import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
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
    CvGenerationPayload,
} from "./graphql-types"

@QueryHandler(CvGenerationQuery)
@Injectable()
export class CvGenerationHandler
    extends ICQRSHandler<CvGenerationQuery, CvGenerationPayload>
    implements IQueryHandler<CvGenerationQuery, CvGenerationPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3ReadService: S3ReadService,
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

        // fetch the run + assert ownership before returning anything.
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

        return {
            id: generation.id,
            mode: generation.mode,
            status: generation.status,
            source: generation.source,
            sourceCvSubmissionId: generation.sourceCvSubmissionId,
            courseId: generation.courseId,
            label: generation.label,
            targetRole: generation.targetRole,
            language: generation.language,
            score: generation.score,
            extraPrompts: generation.extraPrompts,
            structuredData: generation.structuredData,
            latexSource,
            processedAt: generation.processedAt,
            errorMessage: generation.errorMessage,
            createdAt: generation.createdAt,
        }
    }
}
