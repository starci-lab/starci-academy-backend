import {
    createEnumType 
} from "@modules/common"
import {
    registerEnumType,
    InputType, 
    Field
} from "@nestjs/graphql"

/** Sort order. */
export enum SortOrder {
    Asc = "ASC",
    Desc = "DESC",
}

/** GraphQL type for sort order. */
const GraphQLTypeSortOrder = createEnumType(SortOrder)

/** Register sort order enum type. */
registerEnumType(GraphQLTypeSortOrder,
    {
        name: "SortOrder",
        description: "Sort order",
        valuesMap: {
            [SortOrder.Asc]: {
                description: "Sort in ascending order",
            },
            [SortOrder.Desc]: {
                description: "Sort in descending order",
            },
        },
    }
)

/** Input for sort. */
@InputType({
    isAbstract: true,
    description: "Input for sort.",
})
export abstract class SortInput<T extends string> {
    /** Sort by. */
    abstract by: T
    /** Sort order. */
    @Field(() => GraphQLTypeSortOrder,
        {
            description: "Sort order",
        })
        order: SortOrder
}