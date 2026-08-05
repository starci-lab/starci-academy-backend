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
    /** Earlier rows first (A->Z / oldest). Unstable order makes pagination skip or duplicate. */
    Asc = "ASC",
    /** Later rows first -- "newest" feeds so page 1 is the latest, not the oldest. */
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

@InputType({
    isAbstract: true,
    description: "Input for sort.",
})
/**
 * Abstract sort pair: each entity only types `by`. `order` is required so
 * offset/cursor pages stay deterministic across identical `by` values.
 */
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