import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvGenerationMode,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    CvGenerationNotFoundException,
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
/**
 * Checks the source generation exists and belongs to the caller before enqueueing
 * -- never revise someone else's (or a missing) CV.
 */
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

        // validate the source CV generation exists AND belongs to the caller
        // before enqueueing -- never revise someone else's (or a missing) CV.
        // `cvSubmissionId` here is a `cv_generations.id` (unified table -- covers
        // both `Generated` and `Uploaded` sources), NOT the legacy
        // `cv_submissions.id`. The request field keeps its historical name to
        // avoid a breaking GraphQL schema change.
        const sourceGeneration = await this.entityManager.findOne(
            UserCvGenerationEntity,
            {
                where: {
                    id: cvSubmissionId,
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!sourceGeneration) {
            throw new CvGenerationNotFoundException({
                cvGenerationId: cvSubmissionId,
            })
        }

        // validate the optional model/provider pick against the user's entitlement
        // and the ai_models catalog, then collapse it into the AI job selection
        // carried on the async pipeline's payload. Mirrors generate-cv +
        // interview-grading wiring.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
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
