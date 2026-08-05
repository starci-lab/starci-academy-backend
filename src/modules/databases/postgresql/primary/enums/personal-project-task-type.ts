import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Type classification of a personal project task.
 */
export enum PersonalProjectTaskType {
    /**
     * Design tasks -- DB schema, ERD, infra architecture, system design.
     */
    Design = "design",
    /**
     * Technology integration tasks -- email, SMS, Socket.IO, Redis, Docker, K8s, etc.
     */
    TechIntegrate = "techIntegrate",
    /**
     * Business logic tasks -- CRUD, domain rules, search, reporting.
     */
    Business = "business",
}

/**
 * GraphQL type for the personal project task type enum.
 */
export const GraphQLTypePersonalProjectTaskType = createEnumType(
    PersonalProjectTaskType,
)

/**
 * Register the personal project task type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypePersonalProjectTaskType,
    {
        name: "PersonalProjectTaskType",
        description: "Type classification of a personal project task.",
        valuesMap: {
            [PersonalProjectTaskType.Design]: {
                description: "Design tasks.",
            },
            [PersonalProjectTaskType.TechIntegrate]: {
                description: "Technology integration tasks.",
            },
            [PersonalProjectTaskType.Business]: {
                description: "Business logic tasks.",
            },
        },
    })
