import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
} from "@modules/databases"
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
    PersonalProjectBranchTooLongException,
    PersonalProjectGithubUrlMissingException,
    PersonalProjectInvalidBranchNameException,
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types"
import {
    UrlValidatorService,
} from "@modules/validators"

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

        /** Resolve taskId: use provided or default to the first milestone task (lowest sortIndex). */
        let taskId = request.taskId
        if (!taskId) {
            // A nested-relation `where` (milestone.course) forces TypeORM's `findOne`
            // (which sets `take: 1`) into its DISTINCT-subquery pagination path; paired
            // with a restrictive `select` that omits the ORDER BY column, the generated
            // subquery references a `sort_index` alias it never selected → Postgres
            // "column does not exist" (QueryFailedError). A QueryBuilder with a raw
            // `.limit(1)` (not `.take(1)`) keeps a plain `... ORDER BY sort_index ASC
            // LIMIT 1` and sidesteps the DISTINCT path entirely.
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
            throw new PersonalProjectGithubUrlMissingException({
            })
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
                throw new PersonalProjectBranchTooLongException({
                    max: BRANCH_MAX,
                })
            }
            if (branchTrimmed.length > 0 && !BRANCH_PATTERN.test(branchTrimmed)) {
                throw new PersonalProjectInvalidBranchNameException({
                })
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
}
