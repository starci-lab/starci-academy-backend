import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the Headhunter GraphQL query — provide `id` or `displayId`, not both required. */
@InputType({
    description: "Fetch one headhunting company by primary key (`id`) or globally unique `displayId`.",
})
export class HeadhuntingCompanyRequest {
    /** Headhunting company UUID (preferred for FE routes). */
    @Field(
        () => ID,
        {
            description: "Headhunting company id.",
            nullable: true,
        },
    )
        id?: string

    /** Globally unique slug from mount (e.g. `docker-cheetsheet`). */
    @Field(
        () => ID,
        {
            description: "Headhunting company display id.",
            nullable: true,
        },
    )
        displayId?: string
}
