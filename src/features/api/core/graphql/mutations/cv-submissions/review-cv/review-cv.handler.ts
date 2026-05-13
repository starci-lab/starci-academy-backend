import {
    EnqueueProcessCvSubmissionJobService,
} from "@modules/bussiness"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserCVSubmissionEntity,
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
    ReviewCvResponseData,
} from "./graphql-types"
import {
    TemplateCVNotFoundException,
    UserCVSubmissionNotFoundException,
} from "@modules/exceptions"

@CommandHandler(ReviewCvCommand)
@Injectable()
export class ReviewCvHandler
    extends ICQRSHandler<ReviewCvCommand, ReviewCvResponseData>
    implements ICommandHandler<ReviewCvCommand, ReviewCvResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessCvSubmissionJobService: EnqueueProcessCvSubmissionJobService,
    ) {
        super()
    }

    /**
     * Process the review CV command.
     * @param command - The review CV command.
     * @returns The review CV response data.
     */
    protected override async process(
        command: ReviewCvCommand,
    ): Promise<ReviewCvResponseData> {
        const {
            locale,
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
            throw new TemplateCVNotFoundException({
                id: request.templateCvId,
            })
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
                relations: {
                    user: true,
                },
            },
        )

        if (!cvSubmission) {
            throw new UserCVSubmissionNotFoundException({
                id: request.cvSubmissionId,
            })
        }

        const job = await this.enqueueProcessCvSubmissionJobService.enqueue(
            {
                userId: user.id,
                cvSubmissionId: cvSubmission.id,
                templateCvId: request.templateCvId,
                locale,
            }
        )

        return {
            jobId: job.id,
        }
    }
}
