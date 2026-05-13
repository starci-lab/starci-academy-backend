import {
    InputType,
} from "@nestjs/graphql"

/**
 * Request placeholder for `cvUrl` query (scoped by Keycloak user).
 */
@InputType({
    description: "Request for fetching the current user's CV presigned view URL.",
})
export class CvUrlRequest {}
