import {
    createEnumType 
} from "@modules/common"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * How the learner attached their work: local folder paths vs a Git remote URL.
 */
export enum ResourceType {
    DriverUrl = "driverUrl",
    GitUrl = "gitUrl",
}

/**
 * Create the resource type enum.
 */
export const resourceTypeEnum = createEnumType(ResourceType)

/**
 * Register the resource type enum with the GraphQL schema.
 */
registerEnumType(
    resourceTypeEnum,
    {
        name: "ResourceType",
        description: "Resource payload kind: driver URL or Git URL.",
        valuesMap: {
            driverUrl: {
                description: "Driver URL when type is driverUrl."
            },
            gitUrl: {
                description: "Git remote URL when type is gitUrl."
            }
        }
    })

