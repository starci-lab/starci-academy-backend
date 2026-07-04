import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvGenerationMode,
    CvGenerationStatus,
    CvSource,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueScoreUploadedCvJobService,
} from "@features/api/processors/ai/score-uploaded-cv"
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
    UploadCvCommand,
} from "./upload-cv.command"
import {
    UploadCvData,
} from "./graphql-types"

@CommandHandler(UploadCvCommand)
@Injectable()
export class UploadCvHandler
    extends ICQRSHandler<UploadCvCommand, UploadCvData>
    implements ICommandHandler<UploadCvCommand, UploadCvData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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

        // 1) create the Pending uploaded row in the UNIFIED table: `source =
        // uploaded`, `uploadedCdnKey` = the already-uploaded object key. `mode` is
        // required by the column and carries no revise semantics for an upload, so
        // it mirrors the backfill migration's `mode = generate`. The worker fills
        // `score` + `feedback` and flips the row to Done.
        const cvGeneration = await this.entityManager.save(
            UserCvGenerationEntity,
            this.entityManager.create(
                UserCvGenerationEntity,
                {
                    user: {
                        id: user.id,
                    },
                    mode: CvGenerationMode.Generate,
                    source: CvSource.Uploaded,
                    status: CvGenerationStatus.Pending,
                    uploadedCdnKey: cdnKey,
                    course: courseId ? {
                        id: courseId,
                    } : null,
                    label: label ?? null,
                    targetRole: targetRole ?? null,
                    language: language ?? null,
                },
            ),
        )

        // 2) enqueue async scoring — the single-step worker buffers `cdnKey`,
        // extracts text, scores via the SHARED CvScoringService, and persists.
        const { jobId } = await this.enqueueScoreUploadedCvJobService.enqueue({
            cvGenerationId: cvGeneration.id,
            userId: user.id,
            locale: locale ?? Locale.En,
            ai: selection,
        })

        return {
            jobId,
            cvGenerationId: cvGeneration.id,
        }
    }
}
