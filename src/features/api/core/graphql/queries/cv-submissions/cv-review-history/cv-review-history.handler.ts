import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CVSubmissionAttemptEntity,
    CVSubmissionFeedbackEntity,
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
    In,
} from "typeorm"
import {
    CvReviewHistoryQuery,
} from "./cv-review-history.query"
import {
    CvReviewHistoryResponseData,
} from "./graphql-types"

@QueryHandler(CvReviewHistoryQuery)
@Injectable()
export class CvReviewHistoryHandler
    extends ICQRSHandler<CvReviewHistoryQuery, CvReviewHistoryResponseData>
    implements IQueryHandler<CvReviewHistoryQuery, CvReviewHistoryResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    protected override async process(
        query: CvReviewHistoryQuery,
    ): Promise<CvReviewHistoryResponseData> {
        const {
            user,
        } = query.params

        if (!user) {
            return {
                cvSubmissionId: "",
                data: [],
            }
        }

        const attempts = await this.entityManager.find(
            CVSubmissionAttemptEntity,
            {
                where: {
                    cvSubmission: {
                        user: {
                            id: user.id,
                        },
                    },
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )

        const attemptIds = attempts.map((attempt) => attempt.id)
        const feedbacks = attemptIds.length > 0
            ? await this.entityManager.find(
                CVSubmissionFeedbackEntity,
                {
                    where: {
                        attempt: {
                            id: In(attemptIds),
                        },
                    },
                    order: {
                        orderIndex: "ASC",
                        createdAt: "ASC",
                    },
                },
            )
            : []

        const feedbackByAttemptId = new Map<string, CVSubmissionFeedbackEntity>()
        for (const feedback of feedbacks) {
            if (!feedbackByAttemptId.has(feedback.attemptId)) {
                feedbackByAttemptId.set(feedback.attemptId,
                    feedback)
            }
        }

        const historyItems = await Promise.all(
            attempts.map(async (attempt) => {
                const feedback = feedbackByAttemptId.get(attempt.id)
                const fileKey = attempt.fileUrl
                const fileUrl = fileKey.startsWith("http")
                    ? fileKey
                    : await this.s3BuildService.buildSignedGetObjectUrl({
                        key: fileKey,
                        provider: S3Provider.Minio,
                    })

                return {
                    attemptId: attempt.id,
                    attemptNumber: attempt.attemptNumber,
                    fileKey,
                    fileUrl,
                    submittedAt: attempt.createdAt,
                    status: attempt.status,
                    feedback: feedback?.summary ?? null,
                    score: feedback?.score ?? null,
                }
            }),
        )

        return {
            cvSubmissionId: attempts[0]?.cvSubmissionId ?? "",
            data: historyItems,
        }
    }
}
