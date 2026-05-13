import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserCVSubmissionEntity,
    UserCVSubmissionAttemptEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    S3BuildService,
    S3Provider,
} from "@modules/s3"
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
    CvUrlQuery,
} from "./cv-url.query"
import {
    CvUrlViewData,
} from "./graphql-types"
import {
    envConfig 
} from "@modules/env"

/**
 * Handler for the CV URL query.
 */
@QueryHandler(CvUrlQuery)
@Injectable()
export class CvUrlHandler
    extends ICQRSHandler<CvUrlQuery, CvUrlViewData | null>
    implements IQueryHandler<CvUrlQuery, CvUrlViewData | null> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    /**
     * Process the query.
     * @param query - The query.
     * @returns The view data.
     */
    protected override async process(
        query: CvUrlQuery,
    ): Promise<CvUrlViewData | null> {
        /**
         * Validate the query params.
         */
        const {
            user,
        } = query.params
        if (!user) {
            return null
        }
        /**
         * Load the submission.
         */
        const submission = await this.entityManager.findOne(
            UserCVSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!submission) {
            return null
        }

        /**
         * Load the last attempt.
         */
        const lastAttempt = await this.entityManager.findOne(
            UserCVSubmissionAttemptEntity,
            {
                where: {
                    cvSubmission: {
                        id: submission.id,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )

        /**
         * Build the CV URL.
         */
        const detailFeedback = lastAttempt?.detailFeedback ?? null
        const rawKey = submission.cdnKey ?? null
        /**
         * If the raw key is not set, return null.
         */
        if (!rawKey) {
            return {
                id: submission.id,
                status: submission.status,
                cvUrl: null,
                cvUrlExpiresInSeconds: 0,
                detailFeedback,
            }
        }

        /**
         * Build the CV URL.
         */
        const cvUrl = await this.s3BuildService.buildSignedGetObjectUrl({
            key: rawKey,
            provider: S3Provider.Minio,
            expiresInSeconds: envConfig().s3.minio.presignTtl,
        })

        /**
         * Return the view data.
         */
        return {
            id: submission.id,
            status: submission.status,
            cvUrl,
            cvUrlExpiresInSeconds: envConfig().s3.minio.presignTtl,
            detailFeedback,
        }
    }
}
