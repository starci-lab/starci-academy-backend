import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvSubmissionStatus,
    UserCVSubmissionAttemptEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
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
    FindOptionsOrder,
} from "typeorm"
import {
    UserCvSubmissionAttemptsQuery,
} from "./user-cv-submission-attempts.query"
import {
    UserCvSubmissionAttemptsPayload,
    UserCvSubmissionAttemptsSortBy,
} from "./graphql-types"

@QueryHandler(UserCvSubmissionAttemptsQuery)
@Injectable()
export class UserCvSubmissionAttemptsHandler
    extends ICQRSHandler<UserCvSubmissionAttemptsQuery, UserCvSubmissionAttemptsPayload>
    implements IQueryHandler<UserCvSubmissionAttemptsQuery, UserCvSubmissionAttemptsPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    protected override async process(
        query: UserCvSubmissionAttemptsQuery,
    ): Promise<UserCvSubmissionAttemptsPayload> {
        const {
            user,
            request,
        } = query.params
        const {
            filters: {
                limit = envConfig().services.api.pagination.page.limit,
                pageNumber = 0,
                sorts,
            } = {
            },
        } = request

        if (!user) {
            return {
                cvSubmissionId: "",
                totalCount: 0,
                data: [],
            }
        }

        const order: FindOptionsOrder<UserCVSubmissionAttemptEntity> = {
        }
        const sortList = sorts?.length
            ? sorts
            : [
                {
                    by: UserCvSubmissionAttemptsSortBy.CreatedAt,
                    order: "DESC" as const,
                },
            ]
        for (const sort of sortList) {
            order[sort.by as UserCvSubmissionAttemptsSortBy] = sort.order
        }

        const safeLimit = Math.min(
            Math.max(1,
                limit),
            100,
        )
        const safePage = Math.max(0,
            pageNumber)
        const skip = safePage * safeLimit

        const where = {
            cvSubmission: {
                user: {
                    id: user.id,
                },
            },
        }

        const [attempts,
            totalCount] = await this.entityManager.findAndCount(
            UserCVSubmissionAttemptEntity,
            {
                where,
                order,
                skip,
                take: safeLimit,
                relations: {
                    cvSubmission: true,
                },
            },
        )

        const attemptRows = await Promise.all(
            attempts.map(async (attempt) => {
                const fileKey = attempt.cdnKey
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
                    status: attempt.cvSubmission?.status ?? CvSubmissionStatus.Pending,
                    detailFeedback: attempt.detailFeedback,
                    score: attempt.score,
                }
            }),
        )

        return {
            cvSubmissionId: attempts[0]?.cvSubmissionId ?? "",
            totalCount,
            data: attemptRows,
        }
    }
}
