import {
    EnqueueProcessCvSubmissionJobService,
    ICQRSHandler,
} from "@modules/bussiness"
import {
    CVSubmissionEntity,
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
            CVSubmissionEntity,
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

        if (cvSubmission.status !== CvSubmissionStatus.Pending) {
            throw new Error(`CV submission is already ${cvSubmission.status}.`)
        }

        await this.entityManager.update(
            CVSubmissionEntity,
            cvSubmission.id,
            {
                status: CvSubmissionStatus.Processing,
            },
        )

        await this.enqueueProcessCvSubmissionJobService.enqueue({
            userId: user.id,
            cvSubmissionId: cvSubmission.id,
        })

        return {
            success: true,
            message: "CV processing has been queued.",
        }
    }
}
