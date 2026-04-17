import {
    EnqueueProcessCvSubmissionJobService,
} from "@modules/bussiness"
import {
    CVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    TriggerCvSubmissionRequest,
    TriggerCvSubmissionResponse,
} from "./graphql-types"

@Injectable()
export class TriggerCvSubmissionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessCvSubmissionJobService: EnqueueProcessCvSubmissionJobService,
    ) {}

    async execute(
        {
            user,
            request,
        }: {
            user: UserEntity
            request: TriggerCvSubmissionRequest
        },
    ): Promise<TriggerCvSubmissionResponse> {
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