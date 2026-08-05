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

/** Sort fields for listing headhunters within a company. */
export enum ConsultantsSortBy {
    /** Alphabetical by display name — use when the client wants a directory, not curated order. */
    FullName = "fullName",
    /** Curated company order — default so newly hired consultants do not jump to the top. */
    SortIndex = "sortIndex",
    /** Newest first/last — use for admin recency, not the public directory default. */
    CreatedAt = "createdAt",
    /** Most recently edited first/last — surfaces profile updates without changing sortIndex. */
    UpdatedAt = "updatedAt",
}

const GraphQLTypeConsultantsSortBy = createEnumType(ConsultantsSortBy)

registerEnumType(
    GraphQLTypeConsultantsSortBy,
    {
        name: "ConsultantsSortBy",
        description: "Sort field for listing headhunters within a company.",
        valuesMap: {
            [ConsultantsSortBy.FullName]: {
                description: "Sort by full name",
            },
            [ConsultantsSortBy.SortIndex]: {
                description: "Sort by display order within the category",
            },
            [ConsultantsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [ConsultantsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    },
)

@InputType({
    description: "Sort field and order for listing headhunters within a company.",
})
/** Sort field and order for listing headhunters within a company. */
export class ConsultantsRequestSort extends SortInput<ConsultantsSortBy> {
    @Field(
        () => GraphQLTypeConsultantsSortBy,
        {
            description: "Sort by",
        },
    )
        by: ConsultantsSortBy
}

@InputType({
    description: "Pagination and sort filters for listing foundations.",
})
/** Pagination and sort filters for listing headhunters within a company. */
export class ConsultantsFilters extends PaginationPageFilters<ConsultantsSortBy> {
    @Field(
        () => [ConsultantsRequestSort],
        {
            defaultValue: [
                {
                    by: ConsultantsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<ConsultantsRequestSort>
}

@InputType({
    description: "Headhunters request parameters.",
})
/**
 * Headhunters request.
 */
export class ConsultantsRequest {
    /**
     * Category ID.
     */
    @Field(
        () => ID,
        {
            description: "ID of the Headhunter category.",
        },
    )
        companyId: string

    /**
     * Optional filters including pagination.
     */
    @Field(
        () => ConsultantsFilters,
        {
            description: "Filters including pagination.",
            nullable: true,
            defaultValue: {
                sorts: [
                    {
                        by: ConsultantsSortBy.SortIndex,
                        order: SortOrder.Asc,
                    },
                ],
            },
        },
    )
        filters?: ConsultantsFilters
}
