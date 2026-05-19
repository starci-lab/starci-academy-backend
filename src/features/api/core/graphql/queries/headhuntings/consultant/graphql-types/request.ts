import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the Headhunter GraphQL query — provide `id` or `displayId`, not both required. */
@InputType({
    description: "Fetch one Headhunter by primary key (`id`) or globally unique `displayId`.",
})
export class ConsultantRequest {
    /** Headhunter UUID (preferred for FE routes). */
    @Field(
        () => ID,
        {
            description: "Headhunter id.",
            nullable: true,
        },
    )
        id?: string

    /** Globally unique slug from mount (e.g. `docker-cheetsheet`). */
    @Field(
        () => ID,
        {
            description: "Headhunter display id.",
            nullable: true,
        },
    )
        displayId?: string
}
