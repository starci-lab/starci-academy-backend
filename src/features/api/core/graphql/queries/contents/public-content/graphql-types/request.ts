import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a public content row by id.",
})
export class PublicContentRequest {
    @Field(
        () => ID,
        {
            description: "Content id to fetch.",
            nullable: true,
        },
    )
        id?: string

    @Field(
        () => String,
        {
            description: "Content display id to fetch.",
            nullable: true,
        },
    )
        displayId?: string
}
