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
    TriggerCvSubmissionCommand,
} from "./trigger-cv-submission.command"
import {
    TriggerCvSubmissionResponse,
} from "./graphql-types"

@CommandHandler(TriggerCvSubmissionCommand)
@Injectable()
export class TriggerCvSubmissionHandler
    extends ICQRSHandler<TriggerCvSubmissionCommand, TriggerCvSubmissionResponse>
    implements ICommandHandler<TriggerCvSubmissionCommand, TriggerCvSubmissionResponse> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessCvSubmissionJobService: EnqueueProcessCvSubmissionJobService,
    ) {
        super()
    }

    protected override async process(
        command: TriggerCvSubmissionCommand,
    ): Promise<TriggerCvSubmissionResponse> {
        const {
            user,
            request,
        } = command.params

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
                templateCvId: request.templateCvId ?? null,
                reviewPlan: null,
            },
        )

        await this.enqueueProcessCvSubmissionJobService.enqueue({
            userId: user.id,
            cvSubmissionId: cvSubmission.id,
            cvSubmissionAttemptId: cvSubmissionAttempt.id,
            templateCvId: request.templateCvId,
        })

        return {
            success: true,
            message: "CV processing has been queued.",
        }
    }
}
