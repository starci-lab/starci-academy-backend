import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvGenerationMode,
    Locale,
} from "@modules/databases"
import {
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
    GenerateCvCommand,
} from "./generate-cv.command"
import {
    GenerateCvData,
} from "./graphql-types"

@CommandHandler(GenerateCvCommand)
@Injectable()
/**
 * Validates model entitlement then creates a Pending generation + job so the
 * client polls instead of blocking the mutation on a long AI run.
 */
export class GenerateCvHandler
    extends ICQRSHandler<GenerateCvCommand, GenerateCvData>
    implements ICommandHandler<GenerateCvCommand, GenerateCvData> {
    constructor(
        private readonly enqueueGenerateCvJobService: EnqueueGenerateCvJobService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
    ) {
        super()
    }

    protected override async process(
        command: GenerateCvCommand,
    ): Promise<GenerateCvData> {
        const {
            request: {
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

        // validate the optional model/provider pick against the user's entitlement
        // and the ai_models catalog, then collapse it into the AI job selection
        // carried on the async pipeline's payload. No pick validates to an empty
        // selection (the balancer picks). Mirrors the interview-grading wiring.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)

        // create the Pending cv_generations row + enqueue the build job.
        const { cvGeneration, jobId } = await this.enqueueGenerateCvJobService.enqueue({
            userId: user.id,
            mode: CvGenerationMode.Generate,
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
