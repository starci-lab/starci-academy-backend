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
    GradingLaneValidationService,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
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
        private readonly gradingLaneValidationService: GradingLaneValidationService,
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
                mode,
                selectedModel,
                selectedModelProvider,
                courseId,
                label,
                targetRole,
                language,
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

        // validate the chosen CV-generation lane (mode + optional model/provider)
        // against the user's entitlement and the ai_models catalog, then collapse
        // it into the AI job selection carried on the async pipeline's payload.
        // Mirrors generate-cv + interview-grading wiring.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            mode,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)

        // create the Pending cv_generations row + enqueue the revise job.
        const { cvGeneration, jobId } = await this.enqueueGenerateCvJobService.enqueue({
            userId: user.id,
            mode: CvGenerationMode.Revise,
            sourceCvSubmissionId: cvSubmissionId,
            extraPrompts: extraPrompts ?? undefined,
            locale: locale ?? Locale.En,
            ai: selection,
            courseId: courseId ?? undefined,
            label: label ?? undefined,
            targetRole: targetRole ?? undefined,
            language: language ?? undefined,
        })

        return {
            jobId,
            cvGenerationId: cvGeneration.id,
        }
    }
}
