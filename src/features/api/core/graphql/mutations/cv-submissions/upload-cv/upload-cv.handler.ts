import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    EnqueueScoreUploadedCvJobService,
} from "../../../../../processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    validatedLaneToAiJobSelection,
} from "@modules/ai/utils/validated-lane-to-ai-job-selection"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    UploadCvCommand,
} from "./upload-cv.command"
import {
    UploadCvData,
} from "./graphql-types/response"

@CommandHandler(UploadCvCommand)
@Injectable()
/**
 * Creates a Pending uploaded-source row and enqueues scoring so upload and
 * score stay one atomic user action after the presigned PUT.
 */
export class UploadCvHandler
    extends ICQRSHandler<UploadCvCommand, UploadCvData>
    implements ICommandHandler<UploadCvCommand, UploadCvData> {
    constructor(
        private readonly enqueueScoreUploadedCvJobService: EnqueueScoreUploadedCvJobService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
    ) {
        super()
    }

    protected override async process(
        command: UploadCvCommand,
    ): Promise<UploadCvData> {
        const {
            request: {
                cdnKey,
                selectedModel,
                selectedModelProvider,
                courseId,
                label,
                targetRole,
                language,
                targetLevel,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // validate the optional model/provider pick against the user's entitlement +
        // the ai_models catalog, then collapse it into the AI job selection carried
        // on the async pipeline's payload. No pick validates to an empty selection
        // (the balancer picks). Mirrors generate-cv.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)
        const effectiveLanguage = (language as Locale | undefined) ?? locale ?? Locale.En
        const { cvGeneration, jobId } = await this.enqueueScoreUploadedCvJobService.enqueue({
            userId: user.id,
            cdnKey,
            language: effectiveLanguage,
            targetLevel,
            courseId: courseId ?? undefined,
            label: label ?? undefined,
            targetRole: targetRole ?? undefined,
            ai: selection,
        })

        return {
            jobId,
            cvGenerationId: cvGeneration.id,
        }
    }
}
