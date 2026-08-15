import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    CvCapstoneEvidence,
} from "../../graphql-types/cv-evidence"

export {
    CvCapstoneEvidence as PickableMilestoneAchievement,
}

@ObjectType({
    description: "The current user's pickable StarCi capstone projects (passed milestone tasks).",
})
/**
 * The authenticated user's pickable StarCi achievements -- the raw material
 * for the CV block editor's "pick from StarCi" flow (block editor, Direction A
 * toolbar-led). Every item here is Verified by construction: it only exists
 * because a real, passed capstone record exists for the current user.
 *
 * CAPSTONE ONLY (2026-07-05, teacher-approved): challenges are practice
 * exercises -- too granular to be CV-worthy -- and StarCi "achievements"
 * (leaderboard rank / coding count / badges) are vanity a recruiter won't
 * trust. Neither goes on the CV, so neither is exposed here. The single
 * legit, verifiable CV signal is a passed capstone project.
 */
export class MyPickableCvAchievementsViewData {
    @Field(
        () => [CvCapstoneEvidence],
        {
            description: "Passed capstone/milestone task attempts, most recent first.",
        },
    )
        milestoneTaskAttempts: Array<CvCapstoneEvidence>
}

@ObjectType({
    description: "Response for fetching the authenticated user's pickable StarCi achievements.",
})
/**
 * Response wrapper for the `myPickableCvAchievements` query.
 */
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
