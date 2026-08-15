import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/** User-selected seniority bar used to compose and score one CV run. */
export enum CvTargetLevel {
    /** Compose and score against entry-level expectations. */
    Junior = "junior",
    /** Compose and score against independent mid-level expectations. */
    Mid = "mid",
    /** Compose and score against senior ownership expectations. */
    Senior = "senior",
}

export const GraphQLTypeCvTargetLevel = createEnumType(CvTargetLevel)

registerEnumType(
    GraphQLTypeCvTargetLevel,
    {
        name: "CvTargetLevel",
        description: "The explicit seniority bar a CV is written and scored against.",
    },
)
