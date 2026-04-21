import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for marking a content as read or unread.",
})
export class MarkAsReadedRequest {
    @Field(
        () => ID,
        {
            description: "Content ID to mark.",
        },
    )
        contentId: string

    @Field(
        () => Boolean,
        {
            description: "Whether the content should be marked as read.",
        },
    )
        readed: boolean
}
