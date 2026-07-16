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
 * One passed challenge submission on a user's profile — the challenge, the
 * submission link (a GitHub repo or Google Docs URL the user submitted), the
 * language they chose, and when it passed. The git link is the dev's "flex".
 */
@ObjectType({
    description: "A passed challenge submission with its submission link + language.",
})
export class UserSolvedChallengeItemData {
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Stable id for this submission (`user_challenge_submissions.id`) — pass as `submissionId` to `userSolvedChallengeDetail`. Null only for a not-yet-recomputed cache row (self-heals within the projection TTL).",
        },
    )
        id: string | null

    @Field(
        () => String,
        {
            description: "Challenge title (the submission requirement title).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            description: "The submitted link (GitHub repo or Google Docs URL).",
        },
    )
        submissionUrl: string

    @Field(
        () => String,
        {
            description: "Submission type value (githubUrl / googleDocsUrl).",
        },
    )
        submissionType: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Language the user chose (typescript/java/csharp/go), or null (V1).",
        },
    )
        selectedLang: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Challenge difficulty value (easy/medium/hard/insane/…), or null (V1 legacy may lack a parent challenge).",
        },
    )
        difficulty: string | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Score from the passing attempt (the attempt that set passedAt), or null when not graded.",
        },
    )
        score: number | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Title of the course the challenge belongs to (default-locale snapshot), or null when unresolved.",
        },
    )
        courseTitle: string | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Opaque global id of the course this challenge belongs to — pass to `.challenges().course(courseGlobalId)` to route to the per-course manage page. Null when the parent course is unresolved.",
        },
    )
        courseGlobalId: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "SEO-friendly slug of the course this challenge belongs to — pass to `.challenges().course(courseSlug)` to route to the per-course manage page. Null when the parent course is unresolved or has no slug.",
        },
    )
        courseSlug: string | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the submission passed (processed), or null.",
        },
    )
        passedAt: Date | null
}

/**
 * Response wrapper for the userSolvedChallenges query.
 */
@ObjectType({
    description: "Response wrapper for the userSolvedChallenges query.",
})
export class UserSolvedChallengesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserSolvedChallengeItemData>> {
    @Field(
        () => [UserSolvedChallengeItemData],
        {
            description: "The user's passed challenge submissions, newest first.",
        },
    )
        data: Array<UserSolvedChallengeItemData>
}
