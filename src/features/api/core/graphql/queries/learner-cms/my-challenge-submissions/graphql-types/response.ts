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
    description: "A single challenge-submission attempt in the learner CMS list.",
})
/**
 * One of the viewer's challenge-submission attempts, flattened for the learner
 * CMS: the challenge + course it belongs to, the grading verdict bucket, the
 * score, the chosen language, the submitted link, and when it was submitted.
 */
export class ChallengeSubmissionItem {
    @Field(
        () => ID,
        {
            description: "Attempt id (primary key of the submission attempt).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Title of the challenge (or its submission requirement).",
        },
    )
        challengeTitle: string

    @Field(
        () => String,
        {
            description: "Title of the owning course.",
        },
    )
        courseTitle: string

    @Field(
        () => String,
        {
            description: "Opaque global id of the owning course — feed to resolveRoute.",
        },
    )
        courseGlobalId: string

    @Field(
        () => String,
        {
            description: "Verdict bucket: passed | failed | pending.",
        },
    )
        status: string

    @Field(
        () => Int,
        {
            description: "Score achieved in this attempt (0 when not yet graded).",
        },
    )
        score: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Language chosen for the submission, or null (V1).",
        },
    )
        selectedLang: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Submitted source link (GitHub repo / Google Docs URL), or null.",
        },
    )
        submissionUrl: string | null

    @Field(
        () => String,
        {
            description: "When the attempt was submitted (ISO timestamp).",
        },
    )
        submittedAt: string
}

@ObjectType({
    description: "Paginated list of the viewer's challenge-submission attempts.",
})
/**
 * The challenge-submissions page payload: the list of attempts plus the total
 * number of attempts the viewer has (for client-side pagination).
 */
export class MyChallengeSubmissionsData {
    @Field(
        () => [ChallengeSubmissionItem],
        {
            description: "The page of challenge-submission attempts (newest first).",
        },
    )
        items: Array<ChallengeSubmissionItem>

    @Field(
        () => Int,
        {
            description: "Total number of attempts for the viewer (ignores paging).",
        },
    )
        total: number
}

@ObjectType({
    description: "Response wrapper for the myChallengeSubmissions query.",
})
/**
 * Response wrapper for the myChallengeSubmissions query.
 */
export class MyChallengeSubmissionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyChallengeSubmissionsData> {
    @Field(
        () => MyChallengeSubmissionsData,
        {
            nullable: true,
            description: "The page of attempts + total count.",
        },
    )
        data: MyChallengeSubmissionsData
}
