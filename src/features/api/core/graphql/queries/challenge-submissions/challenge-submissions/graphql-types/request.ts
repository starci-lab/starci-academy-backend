import {
    Field,
    ID,
    InputType,
    registerEnumType,
} from "@nestjs/graphql"
import {
    SortInput,
    SortOrder,
} from "@modules/api"
import {
    createEnumType,
} from "@modules/common"

/** Sort fields for listing challenge submissions. */
export enum ChallengeSubmissionsSortBy {
    Name = "name",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeChallengeSubmissionsSortBy = createEnumType(ChallengeSubmissionsSortBy)

registerEnumType(
    GraphQLTypeChallengeSubmissionsSortBy,
    {
        name: "ChallengeSubmissionsSortBy",
        description: "Sort field for listing challenge submissions.",
        valuesMap: {
            [ChallengeSubmissionsSortBy.Name]: {
                description: "Sort by submission name",
            },
            [ChallengeSubmissionsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [ChallengeSubmissionsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    },
)

@InputType({
    description: "Sort field and order for listing challenge submissions.",
})
export class ChallengeSubmissionsRequestSort extends SortInput<ChallengeSubmissionsSortBy> {
    @Field(
        () => GraphQLTypeChallengeSubmissionsSortBy,
        {
            description: "Sort by",
        },
    )
        by: ChallengeSubmissionsSortBy
}

@InputType({
    description: "Challenge scope and optional sort (returns all submissions, no pagination).",
})
export class ChallengeSubmissionsRequestFilters {
    @Field(
        () => [ChallengeSubmissionsRequestSort],
        {
            defaultValue: [
                {
                    by: ChallengeSubmissionsSortBy.CreatedAt,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sort order for the full list.",
        },
    )
        sorts: Array<ChallengeSubmissionsRequestSort>
}

@InputType({
    description: "Request for listing all challenge submissions for a challenge.",
})
export class ChallengeSubmissionsRequest {
    @Field(
        () => ID,
        {
            description: "Challenge id; all submissions for this challenge are returned.",
        },
    )
        challengeId: string

    @Field(
        () => ChallengeSubmissionsRequestFilters,
        {
            description: "Challenge id and optional sorts.",
        },
    )
        filters: ChallengeSubmissionsRequestFilters
}
