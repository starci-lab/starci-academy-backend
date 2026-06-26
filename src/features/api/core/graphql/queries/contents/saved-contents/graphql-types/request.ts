import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching saved (favorited) contents.",
})
export class SavedContentsRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "Case-insensitive search over the saved content title.",
        },
    )
        search?: string


    @Field(
        () => Int,
        {
            nullable: true,
            defaultValue: 0,
            description: "Skip offset.",
        },
    )
        skip?: number

    @Field(
        () => Int,
        {
            nullable: true,
            defaultValue: 20,
            description: "Take limit.",
        },
    )
        take?: number
}
