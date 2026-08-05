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
    /** Orders sessions by curated display order within the course. */
    SortIndex = "sortIndex",
    /** Orders sessions by weekday (Mon→Sun). */
    DayOfWeek = "dayOfWeek",
    /** Orders sessions by wall-clock start time within a day. */
    StartTime = "startTime",
    /** Orders sessions by when the row was created. */
    CreatedAt = "createdAt",
    /** Orders sessions by when the row was last modified. */
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
/** One sort line (field + order) for a livestream-sessions list request. */
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
/**
 * Page size, page number, and sort lines for listing a course's livestream
 * sessions (defaults to ascending `sortIndex`).
 */
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
/** Client args for `livestreamSessions` — course scope plus page/sort filters. */
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
