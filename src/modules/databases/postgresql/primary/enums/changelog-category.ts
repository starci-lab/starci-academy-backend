import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Category of a system changelog entry — drives the colored chip on the FE.
 */
export enum ChangelogCategory {
    /** A new feature shipped. */
    Feature = "feature",
    /** A bug fix. */
    Fix = "fix",
    /** A general announcement. */
    Announcement = "announcement",
}

/** GraphQL type for the changelog category enum. */
export const GraphQLTypeChangelogCategory = createEnumType(
    ChangelogCategory,
)

registerEnumType(
    GraphQLTypeChangelogCategory,
    {
        name: "ChangelogCategory",
        description: "Category of a system changelog entry.",
        valuesMap: {
            [ChangelogCategory.Feature]: {
                description: "A new feature shipped.",
            },
            [ChangelogCategory.Fix]: {
                description: "A bug fix.",
            },
            [ChangelogCategory.Announcement]: {
                description: "A general announcement.",
            },
        },
    },
)
