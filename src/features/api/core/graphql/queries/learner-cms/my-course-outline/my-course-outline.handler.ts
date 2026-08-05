import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    IQueryHandler,
    QueryBus,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness/progress/personal-project.service"
import {
    EnrollmentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/enrollment-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    CourseQuery,
} from "../../courses/course/course.query"
import {
    MilestonesQuery,
} from "../../milestones/milestones/milestones.query"
import {
    MyCourseOutlineQuery,
} from "./my-course-outline.query"
import {
    MyCourseOutlineChallenge,
    MyCourseOutlineCurrentTask,
    MyCourseOutlineData,
    MyCourseOutlineLesson,
    MyCourseOutlineMilestone,
    MyCourseOutlineModule,
    MyCourseOutlineTask,
} from "./graphql-types/response"
import type {
    MilestoneTaskProgressItem,
} from "@modules/integrations/cache/types/cache-results/milestone-task-progress"
import type {
    ChallengeProgressLookup,
    LessonReadLookup,
    TaskProgressLookup,
} from "./types/lookups"

@QueryHandler(MyCourseOutlineQuery)
@Injectable()
/**
 * Assembles one enrolled course's full tree (modules -> lessons -> challenges and
 * milestones -> tasks) with the signed-in viewer's progress overlaid. This is a
 * read-only join across the S3-sourced course tree, the ES-sourced milestone
 * tree, the two progress services (challenge + capstone), and the lesson read
 * flags -- it does NOT re-grade anything.
 */
export class MyCourseOutlineHandler
    extends ICQRSHandler<MyCourseOutlineQuery, MyCourseOutlineData>
    implements IQueryHandler<MyCourseOutlineQuery, MyCourseOutlineData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly queryBus: QueryBus,
        private readonly challengeProgressService: ChallengeProgressService,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        query: MyCourseOutlineQuery,
    ): Promise<MyCourseOutlineData> {
        const {
            request: {
                courseId,
            },
            user,
            locale,
        } = query.params

        // the resolver resolves the viewer from the Keycloak guard; guard against a
        // missing user defensively so downstream id reads never dereference undefined
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // 1. enrollment is OPTIONAL. A non-enrolled viewer "trying free" (the course.tryLearning
        // CTA -> /learn/content) gets the outline as a READ-ONLY preview: empty progress, with
        // premium modules/lessons still flagged (isPremium) so the client locks them. The two
        // progress services are scoped by enrollment id, so they're skipped without an enrollment.
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    // userId is a @RelationId (virtual, not queryable) -- filter via
                    // the user relation's real FK column instead
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: courseId,
                    },
                },
                relations: {
                    course: true,
                },
            },
        )

        // the course displayId drives the S3-sourced tree read: from the enrollment's course
        // relation when enrolled, else a direct course lookup for the preview viewer.
        const previewCourse = enrollment
            ? null
            : await this.entityManager.findOne(
                CourseEntity,
                {
                    where: {
                        id: courseId,
                    },
                    select: {
                        id: true,
                        displayId: true,
                    },
                },
            )
        const displayId = enrollment?.course.displayId ?? previewCourse?.displayId
        if (!displayId) {
            // neither enrolled nor a resolvable course -> not-found (stable code, WARN-only since
            // the client SWR retries this every few seconds).
            const exception = new EnrollmentNotFoundException({
                userId: user.id,
                courseId,
            })
            this.winstonService.log(
                WinstonLog.RequestHandlingFailed,
                {
                    op: "my-course-outline.resolve",
                    userId: user.id,
                    error: exception.message,
                    meta: {
                        courseId,
                    },
                },
            )
            throw exception
        }

        // 3. load the full course tree (modules -> contents -> challenges) from the
        // S3-sourced read model; CourseQuery resolves the tree by displayId + locale
        const course = await this.queryBus.execute<CourseQuery, CourseEntity>(
            new CourseQuery({
                request: {
                    id: courseId,
                    displayId,
                },
                locale: locale ?? Locale.En,
                user,
            }),
        )

        // load the capstone milestone tree (milestones -> tasks) from the ES-sourced
        // read model, already locale-resolved and ordered by sort index
        const milestonesResult = await this.queryBus.execute<
            MilestonesQuery,
            { data: Array<MilestoneEntity> }
        >(
            new MilestonesQuery({
                request: {
                    courseId,
                },
                locale: locale ?? Locale.En,
                user,
            }),
        )
        const milestoneRows = milestonesResult.data

        // 4+5. progress overlays come from the two enrollment-scoped services. A preview
        // (non-enrolled) viewer has no enrollment id -> empty progress (everything reads as
        // not-started) and the current-task pointer falls back to the first lesson.
        let challengeProgressById: ChallengeProgressLookup = new Map()
        let taskProgressById: TaskProgressLookup = new Map()
        let currentTaskProgress: MilestoneTaskProgressItem | null = null
        if (enrollment) {
            // per-challenge progress, keyed by challenge id for O(1) overlay lookups
            const challengeProgress = await this.challengeProgressService.getProgress({
                enrollmentId: enrollment.id,
                courseId,
            })
            challengeProgressById = new Map(
                challengeProgress.completionTasks.map(
                    (task) => [task.id,
                        task],
                ),
            )

            // per-capstone-task progress + the first uncompleted task (currentTask)
            const taskProgress = await this.personalProjectProgressService.getProgress({
                enrollmentId: enrollment.id,
                courseId,
            })
            taskProgressById = new Map(
                taskProgress.completionTasks.map(
                    (task) => [task.id,
                        task],
                ),
            )
            currentTaskProgress = taskProgress.currentTask
        }

        // 6. lesson read flags: every UserContent row the viewer owns under this
        // course; only rows flagged isRead count as read. Keyed by ENROLLMENT id (the
        // anchor for per-course progress going forward) when the viewer is enrolled --
        // user_contents.enrollment_id is backfilled. A preview (non-enrolled) viewer has
        // no enrollment id -> no read rows in scope, so the outline reads as all-unread
        // (matching the empty-progress preview semantics above).
        const userContents = enrollment
            ? await this.entityManager.find(
                UserContentEntity,
                {
                    where: {
                        enrollment: {
                            id: enrollment.id,
                        },
                        content: {
                            module: {
                                course: {
                                    id: courseId,
                                },
                            },
                        },
                    },
                    select: {
                        contentId: true,
                        isRead: true,
                    },
                },
            )
            : []
        const lessonReadById: LessonReadLookup = new Map(
            userContents.map(
                (userContent) => [userContent.contentId,
                    userContent.isRead],
            ),
        )

        // 7. map the course tree -> response object types, overlaying read / status /
        // completed. sort every level by sortIndex so the outline mirrors the lesson
        // navigation; the S3 tree is already sorted, but re-sort defensively.
        const modules = this.mapModules(
            course.modules ?? [],
            challengeProgressById,
            lessonReadById,
        )
        const milestones = this.mapMilestones(
            milestoneRows,
            taskProgressById,
        )

        // 8. aggregate progress summary across the three dimensions
        const progress = this.buildProgressSummary(
            modules,
            milestones,
        )

        // 9. current task: prefer the first uncompleted capstone task, else the first
        // unread lesson, else null when everything is done
        const currentTask = this.resolveCurrentTask(
            currentTaskProgress,
            milestoneRows,
            modules,
        )

        // 10. content-first resume for the course-content home: next unread lesson,
        // else first uncompleted challenge, else null. Never a milestone task -- the
        // capstone has its own resume on the personal-project surface.
        const nextContentTask = this.resolveNextContentTask(modules)

        return {
            course: {
                id: course.id,
                title: course.title,
                displayId: course.displayId,
            },
            modules,
            milestones,
            progress,
            currentTask,
            nextContentTask,
        }
    }

    /**
     * Map the S3 module tree into the response shape, sorting modules / lessons /
     * challenges by sort index and overlaying read + challenge progress.
     * @param courseModules - The locale-resolved module entities from the course tree.
     * @param challengeProgressById - Per-challenge progress keyed by challenge id.
     * @param lessonReadById - Lesson read flags keyed by content id.
     * @returns The mapped modules ordered by sort index.
     */
    private mapModules(
        courseModules: Array<ModuleEntity>,
        challengeProgressById: ChallengeProgressLookup,
        lessonReadById: LessonReadLookup,
    ): Array<MyCourseOutlineModule> {
        // copy before sort so we never mutate the cached / shared S3 tree
        return [...courseModules]
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
            .map((module) => ({
                id: module.id,
                title: module.title,
                // expose orderIndex as the display order even though we sort by sortIndex
                orderIndex: module.orderIndex,
                isPremium: module.isPremium,
                lessons: this.mapLessons(
                    module.contents ?? [],
                    challengeProgressById,
                    lessonReadById,
                ),
            }))
    }

    /**
     * Map the lessons (contents) of a module, sorting by sort index and overlaying
     * the viewer's read flag and each lesson's challenge progress.
     * @param contents - The locale-resolved content entities of the module.
     * @param challengeProgressById - Per-challenge progress keyed by challenge id.
     * @param lessonReadById - Lesson read flags keyed by content id.
     * @returns The mapped lessons ordered by sort index.
     */
    private mapLessons(
        contents: Array<ContentEntity>,
        challengeProgressById: ChallengeProgressLookup,
        lessonReadById: LessonReadLookup,
    ): Array<MyCourseOutlineLesson> {
        return [...contents]
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
            .map((content) => ({
                id: content.id,
                displayId: content.displayId,
                title: content.title,
                minutesRead: content.minutesRead,
                // difficulty is nullable on the entity; pass through as a plain string
                difficulty: content.difficulty ?? null,
                isPremium: content.isPremium,
                // a missing read row means the viewer has not read the lesson
                isRead: lessonReadById.get(content.id) ?? false,
                challenges: this.mapChallenges(
                    content.challenges ?? [],
                    challengeProgressById,
                ),
            }))
    }

    /**
     * Map the challenges of a lesson, sorting by sort index and overlaying the
     * viewer's per-challenge progress (status / lastScore / completed).
     * @param challenges - The locale-resolved challenge entities of the lesson.
     * @param challengeProgressById - Per-challenge progress keyed by challenge id.
     * @returns The mapped challenges ordered by sort index.
     */
    private mapChallenges(
        challenges: Array<ChallengeEntity>,
        challengeProgressById: ChallengeProgressLookup,
    ): Array<MyCourseOutlineChallenge> {
        return [...challenges]
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
            .map((challenge) => {
                // overlay progress; a missing entry means the viewer never started it
                const progress = challengeProgressById.get(challenge.id)
                return {
                    id: challenge.id,
                    title: challenge.title,
                    difficulty: challenge.difficulty,
                    maxScore: challenge.score,
                    // default to notStarted when there is no progress row yet
                    status: progress?.status ?? "notStarted",
                    lastScore: progress?.lastScore ?? 0,
                    completed: progress?.completed ?? false,
                }
            })
    }

    /**
     * Map the milestone tree into the response shape, sorting milestones / tasks by
     * sort index and overlaying the viewer's per-task progress.
     * @param milestoneRows - The locale-resolved milestone entities (with tasks).
     * @param taskProgressById - Per-task progress keyed by task id.
     * @returns The mapped milestones ordered by sort index.
     */
    private mapMilestones(
        milestoneRows: Array<MilestoneEntity>,
        taskProgressById: TaskProgressLookup,
    ): Array<MyCourseOutlineMilestone> {
        return [...milestoneRows]
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
            .map((milestone) => ({
                id: milestone.id,
                title: milestone.title,
                orderIndex: milestone.orderIndex,
                tasks: this.mapTasks(
                    milestone.tasks ?? [],
                    taskProgressById,
                ),
            }))
    }

    /**
     * Map the tasks of a milestone, sorting by sort index and overlaying the
     * viewer's per-task progress (completed / lastScore).
     * @param tasks - The locale-resolved milestone-task entities.
     * @param taskProgressById - Per-task progress keyed by task id.
     * @returns The mapped tasks ordered by sort index.
     */
    private mapTasks(
        tasks: Array<MilestoneTaskEntity>,
        taskProgressById: TaskProgressLookup,
    ): Array<MyCourseOutlineTask> {
        return [...tasks]
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
            .map((task) => {
                // overlay progress; a missing entry means the viewer never attempted it
                const progress = taskProgressById.get(task.id)
                return {
                    id: task.id,
                    title: task.title,
                    // type is nullable in the schema; pass through as a plain string
                    type: task.type ?? null,
                    maxScore: task.maxScore,
                    completed: progress?.completed ?? false,
                    lastScore: progress?.lastScore ?? 0,
                }
            })
    }

    /**
     * Build the aggregate progress summary from the already-mapped trees. The
     * overall percent is the equal-weight average of the lesson / challenge / task
     * ratios (mirrors the myCourses equal-weight rule); dimensions with no items
     * contribute a full ratio so an empty dimension does not drag the total down.
     * @param modules - The mapped module tree.
     * @param milestones - The mapped milestone tree.
     * @returns The aggregate progress summary.
     */
    private buildProgressSummary(
        modules: Array<MyCourseOutlineModule>,
        milestones: Array<MyCourseOutlineMilestone>,
    ): MyCourseOutlineData["progress"] {
        // flatten the lesson + challenge collections once for counting
        const lessons = modules.flatMap((module) => module.lessons)
        const challenges = lessons.flatMap((lesson) => lesson.challenges)
        const tasks = milestones.flatMap((milestone) => milestone.tasks)

        const lessonsTotal = lessons.length
        const lessonsRead = lessons.filter((lesson) => lesson.isRead).length
        const challengesTotal = challenges.length
        const challengesCompleted = challenges.filter((challenge) => challenge.completed).length
        const tasksTotal = tasks.length
        const tasksCompleted = tasks.filter((task) => task.completed).length

        // a dimension with no items counts as fully complete (ratio 1) so it does not
        // penalise the equal-weight average; otherwise use done / total
        const lessonRatio = lessonsTotal === 0 ? 1 : lessonsRead / lessonsTotal
        const challengeRatio = challengesTotal === 0 ? 1 : challengesCompleted / challengesTotal
        const taskRatio = tasksTotal === 0 ? 1 : tasksCompleted / tasksTotal

        // equal-weight average of the three ratios, rounded to a whole percent
        const completionPercent = Math.round(
            ((lessonRatio + challengeRatio + taskRatio) / 3) * 100,
        )

        return {
            lessonsRead,
            lessonsTotal,
            challengesCompleted,
            challengesTotal,
            tasksCompleted,
            tasksTotal,
            completionPercent,
        }
    }

    /**
     * Resolve the viewer's current task: prefer the first uncompleted capstone task
     * (from the progress service), then fall back to the first unread lesson, then
     * null when everything is done.
     * @param currentTaskProgress - The first uncompleted task from the capstone progress service, or null.
     * @param milestoneRows - The milestone entities, used to look up the owning milestone of the task.
     * @param modules - The mapped module tree, used to find the first unread lesson in order.
     * @returns The current-task pointer, or null when nothing is left.
     */
    private resolveCurrentTask(
        currentTaskProgress: MilestoneTaskProgressItem | null,
        milestoneRows: Array<MilestoneEntity>,
        modules: Array<MyCourseOutlineModule>,
    ): MyCourseOutlineCurrentTask | null {
        // first preference: the first uncompleted capstone task
        if (currentTaskProgress) {
            // find the owning milestone so the client can deep-link into the right batch
            const owningMilestone = milestoneRows.find(
                (milestone) => (milestone.tasks ?? []).some(
                    (task) => task.id === currentTaskProgress.id,
                ),
            )
            return {
                kind: "milestoneTask",
                id: currentTaskProgress.id,
                milestoneId: owningMilestone?.id ?? null,
            }
        }

        // second preference: the first unread lesson in outline order
        for (const module of modules) {
            for (const lesson of module.lessons) {
                if (!lesson.isRead) {
                    return {
                        kind: "lesson",
                        id: lesson.id,
                        milestoneId: null,
                    }
                }
            }
        }

        // nothing left to do
        return null
    }

    /**
     * Resolve the content-first resume pointer used by the course-content home
     * (continue learning). Unlike {@link resolveCurrentTask}, this NEVER points at a
     * milestone/capstone task -- the capstone has its own resume on the personal-project
     * surface, and a learner with unread lessons should be sent to a lesson, not the
     * final project. Preference order:
     * 1. the first unread lesson in outline order;
     * 2. else the first uncompleted challenge in outline order (all lessons read);
     * 3. else null when all content is complete.
     * @param modules - The mapped module tree (lessons + challenges with progress overlaid).
     * @returns The next-content pointer, or null when all content is done.
     */
    private resolveNextContentTask(
        modules: Array<MyCourseOutlineModule>,
    ): MyCourseOutlineCurrentTask | null {
        // first preference: keep reading -- the first unread lesson in outline order
        for (const module of modules) {
            for (const lesson of module.lessons) {
                if (!lesson.isRead) {
                    return {
                        kind: "lesson",
                        id: lesson.id,
                        milestoneId: null,
                    }
                }
            }
        }

        // second preference: all lessons read -> the first uncompleted challenge
        for (const module of modules) {
            for (const lesson of module.lessons) {
                for (const challenge of lesson.challenges) {
                    if (!challenge.completed) {
                        return {
                            kind: "challenge",
                            id: challenge.id,
                            milestoneId: null,
                        }
                    }
                }
            }
        }

        // all content complete
        return null
    }
}
