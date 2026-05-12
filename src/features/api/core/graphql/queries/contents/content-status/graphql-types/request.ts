import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for querying content status.",
})
export class ContentStatusRequest {
    @Field(
        () => ID,
        {
            description: "Content ID.",
        },
    )
        contentId: string
}
