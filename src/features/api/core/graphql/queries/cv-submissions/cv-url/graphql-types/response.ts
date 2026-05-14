import {
    Field,
    ID,
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

/**
 * CV view payload with a time-limited MinIO signed GET URL.
 */
@ObjectType({
    description: "Current user's CV submission summary with optional presigned view URL.",
})
export class CvUrlViewData {
    @Field(
        () => ID,
        {
            description: "cv_submissions.id",
        },
    )
        id: string

    @Field(
        () => GraphQLTypeCvSubmissionStatus,
        {
            description: "Aggregate submission status.",
        },
    )
        status: CvSubmissionStatus

    @Field(
        () => String,
        {
            nullable: true,
            description: "Signed GET URL (MinIO) or existing absolute file URL; null when no file key.",
        },
    )
        cvUrl: string | null

    @Field(
        () => Int,
        {
            description: "TTL in seconds for presigned cvUrl (e.g. 900 for 15 minutes); 0 if cvUrl is null or not presigned.",
        },
    )
        cvUrlExpiresInSeconds: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Full AI review (markdown) for the latest attempt; from analyze `feedbackDetails`.",
        },
    )
        detailFeedback: string | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Holistic score 0–100 for the latest attempt when analyze provided `score`.",
        },
    )
        score: number | null

    /**
     * When the current file version was first recorded: latest `cv_submission_attempts.created_at`,
     * or `cv_submissions.created_at` if there are no attempts yet.
     */
    @Field(
        () => Date,
        {
            description:
                "Upload / submission timestamp (UTC): latest attempt createdAt, else submission createdAt.",
        },
    )
        submittedAt: Date
}

/**
 * Response wrapper for the `cvUrl` query.
 */
@ObjectType({
    description: "Response for fetching the authenticated user's CV view URL.",
})
export class CvUrlResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CvUrlViewData | null>
{
    @Field(
        () => CvUrlViewData,
        {
            nullable: true,
            description: "CV view summary with optional presigned URL.",
        },
    )
        data: CvUrlViewData | null
}
