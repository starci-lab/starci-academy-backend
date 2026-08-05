import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for marking a content as read or unread.",
})
/** GraphQL input; `silent` exists so auto-mark-on-scroll updates progress without spending the one-time XP/feed reward. */
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

    @Field(
        () => Boolean,
        {
            nullable: true,
            defaultValue: false,
            description:
                "When true, only the read progress is updated — no XP is granted and "
                + "no activity-feed entry is posted. Used by the auto-mark-on-scroll path "
                + "(reaching the bottom of the lesson) so passive scrolling never spends "
                + "the one-time reward. A deliberate mark (the manual button) leaves this "
                + "false to claim the XP + feed event.",
        },
    )
        silent: boolean
}
