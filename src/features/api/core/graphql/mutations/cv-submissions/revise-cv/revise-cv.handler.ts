import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvGenerationMode,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserCVSubmissionEntity,
} from "@modules/databases"
import {
    CvSubmissionNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueGenerateCvJobService,
} from "@features/api/processors/ai/generate-cv"
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
    ReviseCvCommand,
} from "./revise-cv.command"
import {
    ReviseCvData,
} from "./graphql-types"

@CommandHandler(ReviseCvCommand)
@Injectable()
export class ReviseCvHandler
    extends ICQRSHandler<ReviseCvCommand, ReviseCvData>
    implements ICommandHandler<ReviseCvCommand, ReviseCvData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueGenerateCvJobService: EnqueueGenerateCvJobService,
    ) {
        super()
    }

    protected override async process(
        command: ReviseCvCommand,
    ): Promise<ReviseCvData> {
        const {
            request: {
                cvSubmissionId,
                extraPrompts,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // validate the source submission exists AND belongs to the caller before
        // enqueueing — never revise someone else's (or a missing) submission.
        const submission = await this.entityManager.findOne(
            UserCVSubmissionEntity,
            {
                where: {
                    id: cvSubmissionId,
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!submission) {
            throw new CvSubmissionNotFoundException({
                cvSubmissionId,
            })
        }

        // create the Pending cv_generations row + enqueue the revise job.
        const cvGeneration = await this.enqueueGenerateCvJobService.enqueue({
            userId: user.id,
            mode: CvGenerationMode.Revise,
            sourceCvSubmissionId: cvSubmissionId,
            extraPrompts: extraPrompts ?? undefined,
            locale: locale ?? Locale.En,
        })

        return {
            cvGenerationId: cvGeneration.id,
        }
    }
}
