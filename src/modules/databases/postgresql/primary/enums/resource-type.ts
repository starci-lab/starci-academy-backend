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
    /** Payload is `foldersJson` local/Drive folder paths — not a Git remote. */
    DriverUrl = "driverUrl",
    /** Payload is a Git remote URL the processor clones; `foldersJson` is ignored. */
    GitUrl = "gitUrl",
}

/**
 * Create the resource type enum.
 */
export const GraphQLTypeResourceType = createEnumType(ResourceType)

/**
 * Register the resource type enum with the GraphQL schema.
 */
registerEnumType(
    GraphQLTypeResourceType,
    {
        name: "ResourceType",
        description: "Resource payload kind: driver URL or Git URL.",
        valuesMap: {
            [ResourceType.DriverUrl]: {
                description: "Driver URL when type is driverUrl."
            },
            [ResourceType.GitUrl]: {
                description: "Git remote URL when type is gitUrl."
            }
        }
    })

