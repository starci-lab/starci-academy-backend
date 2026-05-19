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
    FullName = "fullName",
    OrderIndex = "orderIndex",
    CreatedAt = "createdAt",
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
            [ConsultantsSortBy.OrderIndex]: {
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
export class ConsultantsFilters extends PaginationPageFilters<ConsultantsSortBy> {
    @Field(
        () => [ConsultantsRequestSort],
        {
            defaultValue: [
                {
                    by: ConsultantsSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<ConsultantsRequestSort>
}

/**
 * Headhunters request.
 */
@InputType({
    description: "Headhunters request parameters.",
})
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
                        by: ConsultantsSortBy.OrderIndex,
                        order: SortOrder.Asc,
                    },
                ],
            },
        },
    )
        filters?: ConsultantsFilters
}
