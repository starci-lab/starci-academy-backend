import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Where an advertisement banner is shown. One enum value per UI slot so more
 * placements can be added without a schema change.
 */
export enum AdvertisementPlacement {
    /** The right rail of the logged-in dashboard. */
    DashboardRight = "dashboard_right",
}

/** GraphQL type for the advertisement placement enum. */
export const GraphQLTypeAdvertisementPlacement = createEnumType(
    AdvertisementPlacement,
)

registerEnumType(
    GraphQLTypeAdvertisementPlacement,
    {
        name: "AdvertisementPlacement",
        description: "UI slot an advertisement banner is shown in.",
        valuesMap: {
            [AdvertisementPlacement.DashboardRight]: {
                description: "The right rail of the logged-in dashboard.",
            },
        },
    },
)
