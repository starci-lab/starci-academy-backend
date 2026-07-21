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
            nullable: true,
            description: "Lesson content the conversation starts in (lesson scope). Omitted on a task/foundation page.",
        },
    )
        contentId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Capstone / personal-project task the conversation starts in (task scope).",
        },
    )
        taskId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Global foundation-library doc the conversation starts in (foundation scope).",
        },
    )
        foundationId?: string
}
