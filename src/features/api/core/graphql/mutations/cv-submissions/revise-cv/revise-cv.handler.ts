import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CvGenerationNotFoundException,
} from "@modules/platform/exceptions/errors/api/cv-generation-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    EnqueueGenerateCvJobService,
} from "../../../../../processors/ai/generate-cv/enqueue-generate-cv.service"
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
    EntityManager,
} from "typeorm"
import {
    ReviseCvCommand,
} from "./revise-cv.command"
import {
    ReviseCvData,
} from "./graphql-types/response"
import {
    CvEvidenceService,
} from "@modules/bussiness/cv-evidence/cv-evidence.service"
import {
    CvTargetLevelRequiredException,
} from "@modules/platform/exceptions/errors/cv/cv-target-level-required"

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
        private readonly cvEvidenceService: CvEvidenceService,
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
                targetLevel,
                milestoneTaskAttemptIds,
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
        const effectiveTargetLevel = targetLevel ?? sourceGeneration.targetLevel
        if (!effectiveTargetLevel) {
            throw new CvTargetLevelRequiredException({
                cvGenerationId: sourceGeneration.id,
            })
        }
        const selectedEvidence = milestoneTaskAttemptIds === undefined
            ? this.cvEvidenceService.parseSnapshot(sourceGeneration.selectedEvidence)
            : (await this.cvEvidenceService.resolveSelected({
                userId: user.id,
                milestoneTaskAttemptIds,
            })).snapshot
        const sourceLanguage = Object.values(Locale).includes(sourceGeneration.language as Locale)
            ? sourceGeneration.language as Locale
            : undefined
        const effectiveLanguage = (language as Locale | undefined)
            ?? sourceLanguage
            ?? locale
            ?? Locale.En

        // create the Pending cv_generations row + enqueue the revise job.
        const { cvGeneration, jobId } = await this.enqueueGenerateCvJobService.enqueue({
            userId: user.id,
            mode: CvGenerationMode.Revise,
            sourceCvSubmissionId: cvSubmissionId,
            extraPrompts: extraPrompts ?? undefined,
            language: effectiveLanguage,
            ai: selection,
            courseId: courseId ?? undefined,
            label: label ?? undefined,
            targetRole: targetRole ?? sourceGeneration.targetRole ?? undefined,
            targetLevel: effectiveTargetLevel,
            selectedEvidence,
        })

        return {
            jobId,
            cvGenerationId: cvGeneration.id,
        }
    }
}
