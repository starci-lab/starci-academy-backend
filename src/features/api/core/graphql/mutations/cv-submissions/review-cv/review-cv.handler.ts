import {
    EnqueueProcessCvSubmissionJobService,
} from "@modules/bussiness"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserCVSubmissionAttemptEntity,
    UserCVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
    TemplateCVEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    ReviewCvCommand,
} from "./review-cv.command"
import {
    ReviewCvResponse,
} from "./graphql-types"

@CommandHandler(ReviewCvCommand)
@Injectable()
export class ReviewCvHandler
    extends ICQRSHandler<ReviewCvCommand, ReviewCvResponse>
    implements ICommandHandler<ReviewCvCommand, ReviewCvResponse> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessCvSubmissionJobService: EnqueueProcessCvSubmissionJobService,
    ) {
        super()
    }

    protected override async process(
        command: ReviewCvCommand,
    ): Promise<ReviewCvResponse> {
        const {
            user,
            request,
        } = command.params

        const template = await this.entityManager.findOne(
            TemplateCVEntity,
            {
                where: {
                    id: request.templateCvId,
                },
            },
        )
        if (!template) {
            throw new Error("CV review level (template) not found.")
        }

        const cvSubmission = await this.entityManager.findOne(
            UserCVSubmissionEntity,
            {
                where: {
                    id: request.cvSubmissionId,
                    user: {
                        id: user.id,
                    },
                },
                relations: [
                    "user",
                ],
            },
        )

        if (!cvSubmission) {
            throw new Error("CV submission not found.")
        }

        const cvSubmissionAttempt = request.cvSubmissionAttemptId
            ? await this.entityManager.findOne(
                UserCVSubmissionAttemptEntity,
                {
                    where: {
                        id: request.cvSubmissionAttemptId,
                        cvSubmission: {
                            id: cvSubmission.id,
                        },
                    },
                },
            )
            : await this.entityManager.findOne(
                UserCVSubmissionAttemptEntity,
                {
                    where: {
                        cvSubmission: {
                            id: cvSubmission.id,
                        },
                    },
                    order: {
                        attemptNumber: "DESC",
                    },
                },
            )

        if (!cvSubmissionAttempt) {
            throw new Error("CV submission attempt not found.")
        }

        if (cvSubmissionAttempt.status !== CvSubmissionStatus.Pending) {
            throw new Error(`CV submission attempt is already ${cvSubmissionAttempt.status}.`)
        }

        await this.entityManager.update(
            UserCVSubmissionAttemptEntity,
            cvSubmissionAttempt.id,
            {
                status: CvSubmissionStatus.Processing,
                processedAt: null,
                templateCvId: request.templateCvId,
                reviewPlan: null,
            },
        )

        await this.enqueueProcessCvSubmissionJobService.enqueue({
            userId: user.id,
            cvSubmissionId: cvSubmission.id,
            cvSubmissionAttemptId: cvSubmissionAttempt.id,
            templateCvId: request.templateCvId,
            persistReviewAsCanonicalAttempt: true,
        })

        return {
            success: true,
            message: "CV review has been queued for the selected level.",
        }
    }
}
