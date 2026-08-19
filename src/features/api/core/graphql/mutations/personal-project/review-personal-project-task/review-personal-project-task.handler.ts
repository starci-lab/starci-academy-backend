import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
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
} from "@modules/bussiness/jobs/enqueue/review-personal-project-task.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    validatedLaneToAiJobSelection,
} from "@modules/ai/utils/validated-lane-to-ai-job-selection"
import {
    ReviewPersonalProjectTaskCommand,
} from "./review-personal-project-task.command"
import {
    NoPersonalProjectTasksFoundException,
} from "@modules/platform/exceptions/errors/courses/no-personal-project-tasks-found"
import {
    PersonalProjectBranchTooLongException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-branch-too-long"
import {
    PersonalProjectGithubUrlMissingException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-github-url-missing"
import {
    PersonalProjectInvalidBranchNameException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-invalid-branch-name"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types/response"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
import type {
    ApplyReviewEnrollmentPatchParams,
    ResolvedReviewBranch,
    ResolvedReviewGithubUrl,
} from "./types/review-personal-project-task"
import type {
    ReviewPersonalProjectTaskRequest,
} from "./graphql-types/request"

const BRANCH_PATTERN = /^[a-zA-Z0-9._/-]+$/
const BRANCH_MAX = 255

@CommandHandler(ReviewPersonalProjectTaskCommand)
@Injectable()
/**
 * Enqueues AI review of one milestone task against the enrollment's repo.
 * Rejects missing GitHub URL / illegal branch names here so the worker
 * never starts a clone that cannot succeed.
 */
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

        /** Resolve taskId: use provided or default to the first milestone task (lowest sortIndex). */
        const taskId = await this.resolveTaskId(request,
            user.id)

        const {
            resolvedGithubUrl,
            hasGithubUrlInRequest,
        } = await this.resolveGithubUrl(request,
            enrollment)

        const {
            branchProvided,
            branchTrimmed,
            resolvedBranchForEnqueue,
        } = this.resolveBranch(request,
            enrollment)

        await this.applyReviewEnrollmentPatch({
            enrollment,
            hasGithubUrlInRequest,
            resolvedGithubUrl,
            branchProvided,
            branchTrimmed,
        })
        /** Enqueue grading job */
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            model: request.selectedModel,
            provider: request.selectedModelProvider,
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

    /**
     * Resolve the task to review: the caller's `taskId`, else the course's first
     * milestone task by `sortIndex`.
     *
     * A nested-relation `where` (milestone.course) forces TypeORM's `findOne`
     * (which sets `take: 1`) into its DISTINCT-subquery pagination path; paired
     * with a restrictive `select` that omits the ORDER BY column, the generated
     * subquery references a `sort_index` alias it never selected -> Postgres
     * "column does not exist" (QueryFailedError). A QueryBuilder with a raw
     * `.limit(1)` (not `.take(1)`) keeps a plain `... ORDER BY sort_index ASC
     * LIMIT 1` and sidesteps the DISTINCT path entirely.
     */
    private async resolveTaskId(
        request: ReviewPersonalProjectTaskRequest,
        userId: string,
    ): Promise<string> {
        if (request.taskId) {
            return request.taskId
        }
        const firstTask = await this.entityManager
            .createQueryBuilder(MilestoneTaskEntity,
                "task")
            .innerJoin("task.milestone",
                "milestone")
            .innerJoin("milestone.course",
                "course")
            .where("course.id = :courseId",
                {
                    courseId: request.courseId,
                })
            .orderBy("task.sortIndex",
                "ASC")
            .select(["task.id"])
            .limit(1)
            .getOne()
        if (!firstTask) {
            throw new NoPersonalProjectTasksFoundException({
                courseId: request.courseId,
                userId,
            })
        }
        return firstTask.id
    }

    /**
     * Resolve + validate the GitHub URL to review: the caller's (trimmed), else
     * the enrollment's stored one.
     */
    private async resolveGithubUrl(
        request: ReviewPersonalProjectTaskRequest,
        enrollment: EnrollmentEntity,
    ): Promise<ResolvedReviewGithubUrl> {
        const urlFromRequest = typeof request.githubUrl === "string"
            ? request.githubUrl.trim()
            : ""
        const hasGithubUrlInRequest = urlFromRequest.length > 0
        const resolvedGithubUrl = hasGithubUrlInRequest
            ? urlFromRequest
            : (enrollment.personalProjectGithubUrl?.trim() ?? "")
        if (!resolvedGithubUrl) {
            throw new PersonalProjectGithubUrlMissingException({
            })
        }
        await this.urlValidatorService.isParsable(resolvedGithubUrl)
        return {
            resolvedGithubUrl,
            hasGithubUrlInRequest,
        }
    }

    /**
     * Resolve + validate the branch to review: the caller's (trimmed), else the
     * enrollment's stored one.
     */
    private resolveBranch(
        request: ReviewPersonalProjectTaskRequest,
        enrollment: EnrollmentEntity,
    ): ResolvedReviewBranch {
        const branchProvided = request.branch !== undefined && request.branch !== null
        const branchTrimmed = branchProvided
            ? String(request.branch).trim()
            : ""
        if (!branchProvided) {
            const fromEnrollment = enrollment.personalProjectGithubBranch?.trim() ?? ""
            return {
                branchProvided,
                branchTrimmed,
                resolvedBranchForEnqueue: fromEnrollment.length > 0 ? fromEnrollment : undefined,
            }
        }
        if (branchTrimmed.length > BRANCH_MAX) {
            throw new PersonalProjectBranchTooLongException({
                max: BRANCH_MAX,
            })
        }
        if (branchTrimmed.length > 0 && !BRANCH_PATTERN.test(branchTrimmed)) {
            throw new PersonalProjectInvalidBranchNameException({
            })
        }
        return {
            branchProvided,
            branchTrimmed,
            resolvedBranchForEnqueue: branchTrimmed.length > 0 ? branchTrimmed : undefined,
        }
    }

    /**
     * Persist the caller's GitHub URL/branch onto the enrollment when either was
     * sent this call; a no-op write is skipped entirely.
     */
    private async applyReviewEnrollmentPatch(
        {
            enrollment,
            hasGithubUrlInRequest,
            resolvedGithubUrl,
            branchProvided,
            branchTrimmed,
        }: ApplyReviewEnrollmentPatchParams,
    ): Promise<void> {
        if (!hasGithubUrlInRequest && !branchProvided) {
            return
        }
        if (hasGithubUrlInRequest) {
            enrollment.personalProjectGithubUrl = resolvedGithubUrl
        }
        if (branchProvided) {
            enrollment.personalProjectGithubBranch = branchTrimmed.length > 0
                ? branchTrimmed
                : null
        }
        await this.entityManager.save(
            EnrollmentEntity,
            enrollment,
        )
    }
}
