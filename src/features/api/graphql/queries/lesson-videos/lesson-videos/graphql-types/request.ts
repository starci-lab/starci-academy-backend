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

/** Sort fields for listing module lesson videos. */
export enum LessonVideosSortBy {
    Title = "title",
    OrderIndex = "orderIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeLessonVideosSortBy = createEnumType(LessonVideosSortBy)

registerEnumType(GraphQLTypeLessonVideosSortBy,
    {
        name: "LessonVideosSortBy",
        description: "Sort field for listing lesson videos within a content item.",
        valuesMap: {
            [LessonVideosSortBy.Title]: {
                description: "Sort by title",
            },
            [LessonVideosSortBy.OrderIndex]: {
                description: "Sort by display order within the content",
            },
            [LessonVideosSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [LessonVideosSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing lesson videos within a content item.",
})
export class LessonVideosRequestSort extends SortInput<LessonVideosSortBy> {
    @Field(
        () => GraphQLTypeLessonVideosSortBy,
        {
            description: "Sort by",
        },
    )
        by: LessonVideosSortBy
}

@InputType({
    description: "Pagination, sort, and content scope for listing lesson videos.",
})
export class LessonVideosRequestPaginationFilters extends PaginationPageFilters<LessonVideosSortBy> {
    @Field(
        () => [LessonVideosRequestSort],
        {
            defaultValue: [
                {
                    by: LessonVideosSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<LessonVideosRequestSort>
}

@InputType({
    description: "Request for listing lesson videos in a content item with pagination.",
})
export class LessonVideosRequest {
    @Field(
        () => ID,
        {
            description: "Content id; only lesson videos associated with this content are returned.",
        },
    )
        contentId: string

    @Field(
        () => LessonVideosRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: LessonVideosRequestPaginationFilters
}
