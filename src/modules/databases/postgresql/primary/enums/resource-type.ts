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
    Folders = "folders",
    GitUrl = "giturl",
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
        description: "Resource payload kind: folder paths or Git URL.",
        valuesMap: {
            folders: {
                description: "Folder paths when type is folders."
            },
            giturl: {
                description: "Git remote URL when type is giturl."
            }
        }
    })

