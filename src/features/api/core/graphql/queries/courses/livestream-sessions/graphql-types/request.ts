import {
    Field,
    ID,
    InputType,
    registerEnumType,
} from "@nestjs/graphql"
import {
    PaginationPageFilters,
    SortInput,
    SortOrder,
} from "@modules/api"
import {
    createEnumType,
} from "@modules/common"

/** Sort fields for listing course livestream sessions. */
export enum LivestreamSessionsSortBy {
    SortIndex = "sortIndex",
    DayOfWeek = "dayOfWeek",
    StartTime = "startTime",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeLivestreamSessionsSortBy = createEnumType(
    LivestreamSessionsSortBy,
)

registerEnumType(
    GraphQLTypeLivestreamSessionsSortBy,
    {
        name: "LivestreamSessionsSortBy",
        description: "Sort field for listing course livestream sessions.",
        valuesMap: {
            [LivestreamSessionsSortBy.SortIndex]: {
                description: "Sort by display order",
            },
            [LivestreamSessionsSortBy.DayOfWeek]: {
                description: "Sort by day of week",
            },
            [LivestreamSessionsSortBy.StartTime]: {
                description: "Sort by start time",
            },
            [LivestreamSessionsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [LivestreamSessionsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    },
)

@InputType({
    description: "Sort field and order for listing livestream sessions.",
})
export class LivestreamSessionsRequestSort extends SortInput<LivestreamSessionsSortBy> {
    @Field(
        () => GraphQLTypeLivestreamSessionsSortBy,
        {
            description: "Sort by",
        },
    )
        by: LivestreamSessionsSortBy
}

@InputType({
    description: "Pagination and sort filters for livestream sessions.",
})
export class LivestreamSessionsRequestPaginationFilters
    extends PaginationPageFilters<LivestreamSessionsSortBy>
{
    @Field(
        () => [LivestreamSessionsRequestSort],
        {
            defaultValue: [
                {
                    by: LivestreamSessionsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<LivestreamSessionsRequestSort>
}

@InputType({
    description: "Request for listing livestream sessions for a course with pagination.",
})
export class LivestreamSessionsRequest {
    @Field(
        () => ID,
        {
            description: "Course id; only sessions for this course are returned.",
        },
    )
        courseId: string

    @Field(
        () => LivestreamSessionsRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: LivestreamSessionsRequestPaginationFilters
}
