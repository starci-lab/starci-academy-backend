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
    description: "A single row in CV review history.",
})
export class CvReviewHistoryItem {
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
            description: "Processing status of this version.",
        },
    )
        status: CvSubmissionStatus

    @Field(
        () => String,
        {
            nullable: true,
            description: "Full AI review for this version (markdown).",
        },
    )
        detailFeedback: string | null
}

@ObjectType({
    description: "Review history data for one CV submission.",
})
export class CvReviewHistoryResponseData {
    @Field(
        () => String,
        {
            description: "The latest cv_submissions.id in current user's review history.",
        },
    )
        cvSubmissionId: string

    @Field(
        () => [CvReviewHistoryItem],
        {
            description: "All versions ordered by latest first.",
        },
    )
        data: Array<CvReviewHistoryItem>
}

@ObjectType({
    description: "Response wrapper for `cvReviewHistory` (user CV submission attempts review history).",
})
export class CvReviewHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CvReviewHistoryResponseData>
{
    @Field(
        () => CvReviewHistoryResponseData,
        {
            nullable: true,
            description: "Review history payload.",
        },
    )
        data: CvReviewHistoryResponseData
}
