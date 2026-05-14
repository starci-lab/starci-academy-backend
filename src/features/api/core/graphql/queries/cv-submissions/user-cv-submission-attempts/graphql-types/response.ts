import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CvSubmissionStatus,
    GraphQLTypeCvSubmissionStatus,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One CV submission attempt row (uploaded version).",
})
export class UserCvSubmissionAttemptItem {
    @Field(
        () => String,
        {
            description: "cv_submission_attempts.id",
        },
    )
        attemptId: string

    @Field(
        () => Int,
        {
            description: "Version number of this CV upload attempt.",
        },
    )
        attemptNumber: number

    @Field(
        () => String,
        {
            description: "Stored object key/path in S3/MinIO.",
        },
    )
        fileKey: string

    @Field(
        () => String,
        {
            description: "Signed or public URL to download/preview this CV file.",
        },
    )
        fileUrl: string

    @Field(
        () => Date,
        {
            description: "When this version was submitted.",
        },
    )
        submittedAt: Date

    @Field(
        () => GraphQLTypeCvSubmissionStatus,
        {
            description: "Processing status (from parent CV submission when listing attempts).",
        },
    )
        status: CvSubmissionStatus

    @Field(
        () => String,
        {
            nullable: true,
            description: "Full AI review for this version (markdown; from analyze JSON `feedbackDetails`).",
        },
    )
        detailFeedback: string | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Holistic score 0–100 from analyze JSON `score`, when present.",
        },
    )
        score: number | null
}

@ObjectType({
    description: "Paginated CV submission attempts for the current user.",
})
export class UserCvSubmissionAttemptsPayload {
    @Field(
        () => String,
        {
            description: "cv_submissions.id for the first row on this page (if any).",
        },
    )
        cvSubmissionId: string

    @Field(
        () => Int,
        {
            description: "Total matching attempts (all pages).",
        },
    )
        totalCount: number

    @Field(
        () => [UserCvSubmissionAttemptItem],
        {
            description: "Attempts for this page, ordered per request sorts.",
        },
    )
        data: Array<UserCvSubmissionAttemptItem>
}

@ObjectType({
    description: "Response wrapper for `userCvSubmissionAttempts`.",
})
export class UserCvSubmissionAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserCvSubmissionAttemptsPayload>
{
    @Field(
        () => UserCvSubmissionAttemptsPayload,
        {
            nullable: true,
            description: "Paginated attempt rows.",
        },
    )
        data: UserCvSubmissionAttemptsPayload
}
