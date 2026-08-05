import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for querying content status.",
})
/**
 * Args for `contentStatus` -- which lesson's user_contents row to inspect.
 */
export class ContentStatusRequest {
    @Field(
        () => ID,
        {
            description: "Content ID.",
        },
    )
        contentId: string
}
