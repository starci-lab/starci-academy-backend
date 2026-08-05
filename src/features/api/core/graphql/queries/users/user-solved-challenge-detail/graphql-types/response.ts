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
import {
    GraphQLTypeSubmissionFeedbackSeverity,
    SubmissionFeedbackSeverity,
} from "@modules/databases"

@ObjectType({
    description: "One AI feedback item from the passing attempt of a solved challenge submission.",
})
/**
 * One structured AI feedback item from the passing attempt of a solved
 * challenge submission (mirrors {@link UserChallengeSubmissionFeedbackEntity},
 * trimmed to what a profile visitor should see).
 */
export class UserSolvedChallengeDetailFeedbackData {
    @Field(
        () => String,
        {
            description: "Short summary message for this feedback item.",
        },
    )
        message: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "More detailed explanation.",
        },
    )
        detail: string | null

    @Field(
        () => GraphQLTypeSubmissionFeedbackSeverity,
        {
            description: "Severity of the feedback item.",
        },
    )
        severity: SubmissionFeedbackSeverity

    @Field(
        () => String,
        {
            nullable: true,
            description: "Source location hint, e.g. file:line.",
        },
    )
        location: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Suggested change (code snippet or instruction).",
        },
    )
        suggestion: string | null
}

@ObjectType({
    description: "One recorded attempt against a solved challenge submission.",
})
/**
 * One recorded attempt against a solved challenge submission (mirrors
 * {@link UserChallengeSubmissionAttemptEntity}, trimmed to what a profile
 * visitor should see) — the attempts record, newest first.
 */
export class UserSolvedChallengeDetailAttemptData {
    @Field(
        () => Int,
        {
            description: "The sequence number of this attempt for this submission.",
        },
    )
        attemptNumber: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Score achieved in this attempt, or null when not graded.",
        },
    )
        score: number | null

    @Field(
        () => String,
        {
            description: "The link (GitHub repo or Google Docs URL) submitted in this attempt.",
        },
    )
        submissionUrl: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short feedback summary for this attempt, or null.",
        },
    )
        shortFeedback: string | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When this attempt finished processing, or null.",
        },
    )
        processedAt: Date | null
}

@ObjectType({
    description: "Detail of a single passed challenge submission, including AI feedback from the passing attempt.",
})
/**
 * Detail of one passed challenge submission on a user's public profile —
 * the same fields as a `userSolvedChallenges` list item, plus the structured
 * AI feedback list from the attempt that passed it.
 */
export class UserSolvedChallengeDetailData {
    @Field(
        () => ID,
        {
            description: "Submission id (`user_challenge_submissions.id`).",
        },
    )
        id: string

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
            description: "Score from the passing attempt, or null when not graded.",
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
        () => Date,
        {
            nullable: true,
            description: "When the submission passed (processed), or null.",
        },
    )
        passedAt: Date | null

    @Field(
        () => [UserSolvedChallengeDetailFeedbackData],
        {
            description: "Structured AI feedback items from the passing attempt, ordered by orderIndex.",
        },
    )
        feedbacks: Array<UserSolvedChallengeDetailFeedbackData>

    @Field(
        () => [UserSolvedChallengeDetailAttemptData],
        {
            description: "This submission's attempts record, newest first.",
        },
    )
        attempts: Array<UserSolvedChallengeDetailAttemptData>
}

@ObjectType({
    description: "Response wrapper for the userSolvedChallengeDetail query.",
})
/**
 * Response wrapper for the userSolvedChallengeDetail query.
 */
export class UserSolvedChallengeDetailResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserSolvedChallengeDetailData> {
    @Field(
        () => UserSolvedChallengeDetailData,
        {
            description: "The requested solved-challenge submission detail.",
        },
    )
        data: UserSolvedChallengeDetailData
}
