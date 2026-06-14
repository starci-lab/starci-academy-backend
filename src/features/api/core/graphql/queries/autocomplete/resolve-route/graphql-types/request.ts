import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Request to resolve an opaque entity global id into its canonical route.
 */
@InputType({
    description: "Request to resolve a global id into a canonical route.",
})
export class ResolveRouteRequest {
    @Field(
        () => String,
        {
            description: "Opaque global id (base64url of \"<entityName>:<id>\").",
        },
    )
        globalId: string
}
