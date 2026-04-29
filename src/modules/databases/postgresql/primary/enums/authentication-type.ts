import {
    createEnumType 
} from "@modules/common/utils/enum"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * The type of authentication used by a user.
 */
export enum AuthenticationType {
    /**
     * The authentication type for a user using GitHub.
     */
    Github = "github",
    /**
     * The authentication type for a user using Google.
     */
    Google = "google",
    /**
     * The authentication type for a user using credentials.
     */
    Credentials = "credentials",
}

export const GraphQLTypeAuthenticationType = createEnumType(AuthenticationType)

/**
 * Register the action type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeAuthenticationType,
    {
        name: "AuthenticationType",
        description: "The type of authentication used by a user.",
        valuesMap: {
            [AuthenticationType.Github]: {
                description: "The authentication type for a user using GitHub.",
            },
            [AuthenticationType.Google]: {
                description: "The authentication type for a user using Google.",
            },
            [AuthenticationType.Credentials]: {
                description: "The authentication type for a user using credentials.",
            },
        },
    },
)