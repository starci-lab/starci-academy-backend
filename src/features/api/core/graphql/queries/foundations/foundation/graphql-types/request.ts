import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the foundation GraphQL query — provide `id` or `displayId`, not both required. */
@InputType({
    description: "Fetch one foundation by primary key (`id`) or globally unique `displayId`.",
})
export class FoundationRequest {
    /** Foundation UUID (preferred for FE routes). */
    @Field(
        () => ID,
        {
            description: "Foundation id.",
            nullable: true,
        },
    )
        id?: string

    /** Globally unique slug from mount (e.g. `docker-cheetsheet`). */
    @Field(
        () => ID,
        {
            description: "Foundation display id.",
            nullable: true,
        },
    )
        displayId?: string
}
