import {
    Field,
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
    description: "A milestone task on a user's capstone roadmap.",
})
/**
 * One milestone task on a user's capstone roadmap -- the task plus whether the
 * user has passed it (latest passing attempt), its score, and when it was passed.
 */
export class CapstoneTaskItemObject {
    @Field(
        () => String,
        {
            description: "Opaque global id of the milestone task — feed to resolveRoute.",
        },
    )
        taskGlobalId: string

    @Field(
        () => String,
        {
            description: "Milestone-task title.",
        },
    )
        title: string

    @Field(
        () => Boolean,
        {
            description: "Whether the user has a passing attempt for this task.",
        },
    )
        passed: boolean

    @Field(
        () => Int,
        {
            description: "Score on the passing attempt, or 0 when not passed.",
        },
    )
        score: number

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the task was passed, or null when not passed.",
        },
    )
        passedAt: Date | null
}

@ObjectType({
    description: "A milestone on a user's capstone roadmap.",
})
/**
 * One milestone on a user's capstone roadmap -- its ordered tasks plus how many
 * the user has passed.
 */
export class CapstoneMilestoneProgressObject {
    @Field(
        () => String,
        {
            description: "Opaque global id of the milestone — feed to resolveRoute.",
        },
    )
        milestoneGlobalId: string

    @Field(
        () => String,
        {
            description: "Milestone title.",
        },
    )
        title: string

    @Field(
        () => Int,
        {
            description: "Milestone ordering position within its course (ascending).",
        },
    )
        position: number

    @Field(
        () => Int,
        {
            description: "Total tasks in the milestone.",
        },
    )
        totalTasks: number

    @Field(
        () => Int,
        {
            description: "Tasks the user has passed in this milestone.",
        },
    )
        passedTasks: number

    @Field(
        () => [CapstoneTaskItemObject],
        {
            description: "All tasks of the milestone, ordered by position ascending.",
        },
    )
        tasks: Array<CapstoneTaskItemObject>
}

@ObjectType({
    description: "An enrolled course's capstone roadmap on a user's profile.",
})
/**
 * One enrolled course on a user's capstone roadmap -- its ordered milestones plus
 * the course-level totals and passed counts that power the project-showcase card.
 */
export class CapstoneCourseProgressObject {
    @Field(
        () => String,
        {
            description: "Opaque global id of the course — feed to resolveRoute.",
        },
    )
        courseGlobalId: string

    @Field(
        () => String,
        {
            description: "Course title.",
        },
    )
        courseTitle: string

    @Field(
        () => Int,
        {
            description: "Total milestones in the course.",
        },
    )
        totalMilestones: number

    @Field(
        () => Int,
        {
            description: "Milestones fully completed (totalTasks > 0 and all tasks passed).",
        },
    )
        completedMilestones: number

    @Field(
        () => Int,
        {
            description: "Total milestone tasks in the course.",
        },
    )
        totalTasks: number

    @Field(
        () => Int,
        {
            description: "Distinct milestone tasks the user has passed.",
        },
    )
        completedTasks: number

    @Field(
        () => [CapstoneMilestoneProgressObject],
        {
            description: "All milestones of the course, ordered by position ascending.",
        },
    )
        milestones: Array<CapstoneMilestoneProgressObject>
}

@ObjectType({
    description: "Response wrapper for the userCapstoneProgress query.",
})
/**
 * Response wrapper for the userCapstoneProgress query.
 */
export class UserCapstoneProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<CapstoneCourseProgressObject>> {
    @Field(
        () => [CapstoneCourseProgressObject],
        {
            description: "The user's enrolled-course capstone roadmaps (course title ascending).",
        },
    )
        data: Array<CapstoneCourseProgressObject>
}
