import {
    Field,
    ID,
    InputType,
    registerEnumType,
} from "@nestjs/graphql"
import {
    SortInput,
    SortOrder,
} from "@modules/api/apollo/server/graphql-types/inputs/sort"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/** Sort fields for listing challenge submissions. */
export enum ChallengeSubmissionsSortBy {
    /** Alphabetical by submission display name -- browse by title, not recency. */
    Name = "name",
    /** Default (Asc): oldest first, matching curriculum creation order. */
    CreatedAt = "createdAt",
    /** Recently mutated submissions first when Desc -- stale drafts sink. */
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
/**
 * One sort key for the unpaginated challenge-submission list. Combined in
 * `filters.sorts`; omitted keys fall back to CreatedAt Asc.
 */
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
/**
 * Sort-only filters for `challengeSubmissions`. There is no page/limit --
 * the handler returns every submission on the challenge. Scope lives on
 * {@link ChallengeSubmissionsRequest.challengeId}, not here.
 */
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
/**
 * Lists every submission slot on one challenge (no pagination) and, when
 * the caller is signed in, attaches that user's join row + latest attempt
 * on each slot.
 */
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
