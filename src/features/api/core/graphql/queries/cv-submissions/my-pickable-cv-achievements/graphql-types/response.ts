import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One PASSED milestone/capstone task attempt the learner can pick into a CV
 * "Project" block. Existence of this row (not its score) is the trust signal
 * — see `CvVerificationService`.
 */
@ObjectType({
    description: "A passed milestone/capstone task attempt, pickable into a CV project block.",
})
export class PickableMilestoneAchievement {
    @Field(
        () => ID,
        {
            description: "user_milestone_task_attempts.id — stable identifier for FE selection.",
        },
    )
        id: string

    @Field({
        description: "milestone_tasks.title",
    })
        taskTitle: string

    @Field({
        description: "milestones.title",
    })
        milestoneTitle: string

    @Field({
        description: "courses.title — the course this capstone belongs to.",
    })
        courseTitle: string

    @Field(
        () => Int,
        {
            description: "user_milestone_task_attempts.score",
        },
    )
        score: number
}

/**
 * The authenticated user's pickable StarCi achievements — the raw material
 * for the CV block editor's "pick from StarCi" flow (block editor, Direction A
 * toolbar-led). Every item here is Verified by construction: it only exists
 * because a real, passed capstone record exists for the current user.
 *
 * CAPSTONE ONLY (2026-07-05, teacher-approved): challenges are practice
 * exercises — too granular to be CV-worthy — and StarCi "achievements"
 * (leaderboard rank / coding count / badges) are vanity a recruiter won't
 * trust. Neither goes on the CV, so neither is exposed here. The single
 * legit, verifiable CV signal is a passed capstone project.
 */
@ObjectType({
    description: "The current user's pickable StarCi capstone projects (passed milestone tasks).",
})
export class MyPickableCvAchievementsViewData {
    @Field(
        () => [PickableMilestoneAchievement],
        {
            description: "Passed capstone/milestone task attempts, most recent first.",
        },
    )
        milestoneTaskAttempts: Array<PickableMilestoneAchievement>
}

/**
 * Response wrapper for the `myPickableCvAchievements` query.
 */
@ObjectType({
    description: "Response for fetching the authenticated user's pickable StarCi achievements.",
})
export class MyPickableCvAchievementsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyPickableCvAchievementsViewData | null>
{
    @Field(
        () => MyPickableCvAchievementsViewData,
        {
            nullable: true,
            description: "The user's pickable StarCi achievements.",
        },
    )
        data: MyPickableCvAchievementsViewData | null
}
