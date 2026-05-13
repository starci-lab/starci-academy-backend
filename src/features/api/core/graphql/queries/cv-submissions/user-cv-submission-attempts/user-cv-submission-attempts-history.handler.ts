import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
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
    UserCvSubmissionAttemptsHistoryQuery,
} from "./user-cv-submission-attempts-history.query"
import {
    CvReviewHistoryResponseData,
} from "./graphql-types"

@QueryHandler(UserCvSubmissionAttemptsHistoryQuery)
@Injectable()
export class UserCvSubmissionAttemptsHistoryHandler
    extends ICQRSHandler<UserCvSubmissionAttemptsHistoryQuery, CvReviewHistoryResponseData>
    implements IQueryHandler<UserCvSubmissionAttemptsHistoryQuery, CvReviewHistoryResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    protected override async process(
        query: UserCvSubmissionAttemptsHistoryQuery,
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
            UserCVSubmissionAttemptEntity,
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

        const historyItems = await Promise.all(
            attempts.map(async (attempt) => {
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
                    detailFeedback: attempt.detailFeedback,
                }
            }),
        )

        return {
            cvSubmissionId: attempts[0]?.cvSubmissionId ?? "",
            data: historyItems,
        }
    }
}
