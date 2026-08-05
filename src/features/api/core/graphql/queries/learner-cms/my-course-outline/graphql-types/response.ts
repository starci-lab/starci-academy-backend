import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Identity of the course the outline belongs to.",
})
/**
 * Minimal identity of the course the outline belongs to: the primary-key id,
 * the human title, and the stable display id used for routing / CDN lookups.
 */
export class MyCourseOutlineCourse {
    @Field(
        () => ID,
        {
            description: "Primary-key id of the course.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Human-readable title of the course (locale-resolved).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            description: "Stable display id of the course (mount/CDN slug).",
        },
    )
        displayId: string
}

@ObjectType({
    description: "A challenge under a lesson with the viewer's progress overlaid.",
})
/**
 * A single challenge under a lesson, with the viewer's progress overlaid:
 * lifecycle status, the latest score, and the completed flag.
 */
export class MyCourseOutlineChallenge {
    @Field(
        () => ID,
        {
            description: "Primary-key id of the challenge.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Title of the challenge (locale-resolved).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            description: "Difficulty of the challenge (easy | medium | hard | insane).",
        },
    )
        difficulty: string

    @Field(
        () => Int,
        {
            description: "Maximum achievable score for this challenge.",
        },
    )
        maxScore: number

    @Field(
        () => String,
        {
            description: "Lifecycle status for the viewer: notStarted | inProgress | failed | completed.",
        },
    )
        status: string

    @Field(
        () => Int,
        {
            description: "Score from the viewer's latest graded attempt (0 if never attempted).",
        },
    )
        lastScore: number

    @Field(
        () => Boolean,
        {
            description: "Whether the viewer has completed the challenge (every submission passed).",
        },
    )
        completed: boolean
}

@ObjectType({
    description: "A lesson under a module with the viewer's read flag and its challenges.",
})
/**
 * A single lesson (content) under a module, with the viewer's read flag overlaid
 * and the lesson's challenges (each with their own progress).
 */
export class MyCourseOutlineLesson {
    @Field(
        () => ID,
        {
            description: "Primary-key id of the lesson (content).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Stable display id of the lesson (mount/CDN slug).",
        },
    )
        displayId: string

    @Field(
        () => String,
        {
            description: "Title of the lesson (locale-resolved).",
        },
    )
        title: string

    @Field(
        () => Int,
        {
            description: "Estimated reading time of the lesson in minutes.",
        },
    )
        minutesRead: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Difficulty of the lesson (beginner | intermediate | advanced), or null if unset.",
        },
    )
        difficulty: string | null

    @Field(
        () => Boolean,
        {
            description: "Whether the lesson is behind the premium paywall.",
        },
    )
        isPremium: boolean

    @Field(
        () => Boolean,
        {
            description: "Whether the viewer has read this lesson.",
        },
    )
        isRead: boolean

    @Field(
        () => [MyCourseOutlineChallenge],
        {
            description: "Challenges belonging to this lesson, ordered by sort index.",
        },
    )
        challenges: Array<MyCourseOutlineChallenge>
}

@ObjectType({
    description: "A module (chapter) of the course with its ordered lessons.",
})
/**
 * A module (chapter) of the course, with its ordered lessons. The module's own
 * premium flag is surfaced so the client can paywall the whole chapter.
 */
export class MyCourseOutlineModule {
    @Field(
        () => ID,
        {
            description: "Primary-key id of the module.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Title of the module (locale-resolved).",
        },
    )
        title: string

    @Field(
        () => Int,
        {
            description: "Display order of the module within the course.",
        },
    )
        orderIndex: number

    @Field(
        () => Boolean,
        {
            description: "Whether the whole module is behind the premium paywall.",
        },
    )
        isPremium: boolean

    @Field(
        () => [MyCourseOutlineLesson],
        {
            description: "Lessons belonging to this module, ordered by sort index.",
        },
    )
        lessons: Array<MyCourseOutlineLesson>
}

@ObjectType({
    description: "A capstone task under a milestone with the viewer's progress overlaid.",
})
/**
 * A single capstone (personal-project) task under a milestone, with the viewer's
 * progress overlaid: the completed flag and the latest score.
 */
export class MyCourseOutlineTask {
    @Field(
        () => ID,
        {
            description: "Primary-key id of the milestone task.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Title of the milestone task (locale-resolved).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Type of the task (design | techIntegrate | business), or null if unset.",
        },
    )
        type: string | null

    @Field(
        () => Int,
        {
            description: "Maximum achievable score for this task.",
        },
    )
        maxScore: number

    @Field(
        () => Boolean,
        {
            description: "Whether the viewer has completed (passed) the task.",
        },
    )
        completed: boolean

    @Field(
        () => Int,
        {
            description: "Score from the viewer's latest attempt (0 if never attempted).",
        },
    )
        lastScore: number
}

@ObjectType({
    description: "A capstone milestone of the course with its ordered tasks.",
})
/**
 * A capstone milestone (batch) of the course, with its ordered tasks.
 */
export class MyCourseOutlineMilestone {
    @Field(
        () => ID,
        {
            description: "Primary-key id of the milestone.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Title of the milestone (locale-resolved).",
        },
    )
        title: string

    @Field(
        () => Int,
        {
            description: "Display order of the milestone within the course.",
        },
    )
        orderIndex: number

    @Field(
        () => [MyCourseOutlineTask],
        {
            description: "Tasks belonging to this milestone, ordered by sort index.",
        },
    )
        tasks: Array<MyCourseOutlineTask>
}

@ObjectType({
    description: "Aggregate progress summary for the viewer across the course.",
})
/**
 * Aggregate progress summary for the viewer across the whole course: read
 * lessons, completed challenges, completed tasks, and an equal-weight overall
 * completion percentage.
 */
export class MyCourseOutlineProgress {
    @Field(
        () => Int,
        {
            description: "Number of lessons the viewer has read.",
        },
    )
        lessonsRead: number

    @Field(
        () => Int,
        {
            description: "Total number of lessons in the course.",
        },
    )
        lessonsTotal: number

    @Field(
        () => Int,
        {
            description: "Number of challenges the viewer has completed.",
        },
    )
        challengesCompleted: number

    @Field(
        () => Int,
        {
            description: "Total number of challenges in the course.",
        },
    )
        challengesTotal: number

    @Field(
        () => Int,
        {
            description: "Number of capstone tasks the viewer has completed.",
        },
    )
        tasksCompleted: number

    @Field(
        () => Int,
        {
            description: "Total number of capstone tasks in the course.",
        },
    )
        tasksTotal: number

    @Field(
        () => Int,
        {
            description: "Overall completion percent (equal-weight average of the three ratios, 0-100).",
        },
    )
        completionPercent: number
}

@ObjectType({
    description: "Pointer to the next thing the viewer should work on.",
})
/**
 * Pointer to the next thing the viewer should work on: a milestone task, a
 * lesson, or a challenge. `kind` discriminates the target and `milestoneId` is
 * only set when the target is a milestone task.
 */
export class MyCourseOutlineCurrentTask {
    @Field(
        () => String,
        {
            description: "Kind of the target: lesson | challenge | milestoneTask.",
        },
    )
        kind: string

    @Field(
        () => String,
        {
            description: "Primary-key id of the target (lesson, challenge, or milestone task).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Owning milestone id when the target is a milestone task, otherwise null.",
        },
    )
        milestoneId: string | null
}

@ObjectType({
    description: "Full course outline with the viewer's progress overlaid.",
})
/**
 * Full outline payload: the course identity, its module/lesson/challenge tree,
 * its milestone/task tree, the aggregate progress summary, and a pointer to the
 * viewer's current task.
 */
export class MyCourseOutlineData {
    @Field(
        () => MyCourseOutlineCourse,
        {
            description: "Identity of the course.",
        },
    )
        course: MyCourseOutlineCourse

    @Field(
        () => [MyCourseOutlineModule],
        {
            description: "Module/lesson/challenge tree, ordered by sort index.",
        },
    )
        modules: Array<MyCourseOutlineModule>

    @Field(
        () => [MyCourseOutlineMilestone],
        {
            description: "Milestone/task tree, ordered by sort index.",
        },
    )
        milestones: Array<MyCourseOutlineMilestone>

    @Field(
        () => MyCourseOutlineProgress,
        {
            description: "Aggregate progress summary for the viewer.",
        },
    )
        progress: MyCourseOutlineProgress

    @Field(
        () => MyCourseOutlineCurrentTask,
        {
            nullable: true,
            description: "Pointer to the viewer's current task, or null if everything is done.",
        },
    )
        currentTask: MyCourseOutlineCurrentTask | null

    @Field(
        () => MyCourseOutlineCurrentTask,
        {
            nullable: true,
            description:
                "Content-first resume pointer for the course-content home: the next unread "
                + "lesson, else the first uncompleted challenge, else null when all content is "
                + "done. Never points to a milestone task (capstone has its own resume on the "
                + "personal-project surface) — unlike currentTask which prefers capstone tasks.",
        },
    )
        nextContentTask: MyCourseOutlineCurrentTask | null
}

@ObjectType({
    description: "Response wrapper for the myCourseOutline query.",
})
/**
 * Response wrapper for the myCourseOutline query.
 */
export class MyCourseOutlineResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCourseOutlineData> {
    @Field(
        () => MyCourseOutlineData,
        {
            nullable: true,
            description: "The course outline with the viewer's progress overlaid.",
        },
    )
        data: MyCourseOutlineData
}
