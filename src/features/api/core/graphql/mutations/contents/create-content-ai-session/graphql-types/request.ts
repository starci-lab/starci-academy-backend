import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link CreateContentAiSessionResponse}: start a new content-AI
 * conversation (session) anchored to a content.
 */
@InputType({
    description: "Start a new content-AI conversation for a content.",
})
export class CreateContentAiSessionRequest {
    @Field(
        () => ID,
        {
            description: "Content the conversation starts in.",
        },
    )
        contentId: string
}
