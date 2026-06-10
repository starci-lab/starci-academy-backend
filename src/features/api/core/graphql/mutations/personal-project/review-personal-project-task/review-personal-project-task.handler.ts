import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    BadRequestException,
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "@modules/bussiness"
import {
    GradingLaneValidationService,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
import {
    ReviewPersonalProjectTaskCommand,
} from "./review-personal-project-task.command"
import {
    NoPersonalProjectTasksFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types"
import {
    UrlValidatorService,
} from "@modules/vaildators"

const BRANCH_PATTERN = /^[a-zA-Z0-9._/-]+$/
const BRANCH_MAX = 255

@CommandHandler(ReviewPersonalProjectTaskCommand)
@Injectable()
export class ReviewPersonalProjectTaskHandler
    extends ICQRSHandler<ReviewPersonalProjectTaskCommand, ReviewPersonalProjectTaskResponseData>
    implements ICommandHandler<ReviewPersonalProjectTaskCommand, ReviewPersonalProjectTaskResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueReviewPersonalProjectTaskJobService: EnqueueReviewPersonalProjectTaskJobService,
        private readonly urlValidatorService: UrlValidatorService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
    ) {
        super()
    }

    protected override async process(
        command: ReviewPersonalProjectTaskCommand,
    ): Promise<ReviewPersonalProjectTaskResponseData> {
        const { request, user, locale } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        /** Enrollment for this course (GitHub URL / branch may come from request or stored fields). */
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: request.courseId,
                    },
                },
                select: {
                    id: true,
                    personalProjectGithubUrl: true,
                    personalProjectGithubBranch: true,
                },
            },
        )

        /** Resolve taskId: use provided or default to first milestone task (orderIndex 0) */
        let taskId = request.taskId
        if (!taskId) {
            const firstTask = await this.entityManager.findOne(
                MilestoneTaskEntity,
                {
                    where: {
                        milestone: {
                            course: {
                                id: request.courseId,
                            },
                        },
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (!firstTask) {
                throw new NoPersonalProjectTasksFoundException({
                    courseId: request.courseId,
                    userId: user.id,
                })
            }
            taskId = firstTask.id
        }

        const urlFromRequest =
            typeof request.githubUrl === "string"
                ? request.githubUrl.trim()
                : ""
        const hasGithubUrlInRequest = urlFromRequest.length > 0
        const resolvedGithubUrl = hasGithubUrlInRequest
            ? urlFromRequest
            : (enrollment.personalProjectGithubUrl?.trim() ?? "")
        if (!resolvedGithubUrl) {
            throw new BadRequestException(
                "Provide githubUrl or save a personal project GitHub URL on your enrollment for this course",
            )
        }
        await this.urlValidatorService.isParsable(resolvedGithubUrl)

        const branchProvided =
            request.branch !== undefined && request.branch !== null
        const branchTrimmed = branchProvided
            ? String(request.branch).trim()
            : ""
        let resolvedBranchForEnqueue: string | undefined
        if (branchProvided) {
            if (branchTrimmed.length > BRANCH_MAX) {
                throw new BadRequestException(
                    `Branch must be at most ${BRANCH_MAX} characters`,
                )
            }
            if (branchTrimmed.length > 0 && !BRANCH_PATTERN.test(branchTrimmed)) {
                throw new BadRequestException(
                    "Invalid branch name",
                )
            }
            resolvedBranchForEnqueue = branchTrimmed.length > 0
                ? branchTrimmed
                : undefined
        }
        else {
            const fromEnrollment =
                enrollment.personalProjectGithubBranch?.trim() ?? ""
            resolvedBranchForEnqueue = fromEnrollment.length > 0
                ? fromEnrollment
                : undefined
        }

        let enrollmentDirty = false
        if (hasGithubUrlInRequest) {
            enrollment.personalProjectGithubUrl = urlFromRequest
            enrollmentDirty = true
        }
        if (branchProvided) {
            enrollment.personalProjectGithubBranch = branchTrimmed.length > 0
                ? branchTrimmed
                : null
            enrollmentDirty = true
        }
        if (enrollmentDirty) {
            await this.entityManager.save(
                EnrollmentEntity,
                enrollment,
            )
        }
        /** Enqueue grading job */
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            mode: request.mode,
            model: request.selectedModel,
            provider: request.selectedModelProvider,
            byokApiKey: request.byokApiKey,
        })
        // collapse the validated lane into the discriminated AI selection carried on the job
        const ai = validatedLaneToAiJobSelection(validatedLane)
        const job = await this.enqueueReviewPersonalProjectTaskJobService.enqueue({
            taskId,
            branch: resolvedBranchForEnqueue,
            userId: user.id,
            locale,
            lang: request.lang?.trim() || undefined,
            enrollmentId: enrollment.id,
            githubUrl: resolvedGithubUrl,
            ai,
        })
        return {
            jobId: job.id,
        }
    }
}
