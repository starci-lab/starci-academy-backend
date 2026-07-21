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
    description: "Start a new content-AI conversation for a scope (content / task / foundation / course).",
})
export class CreateContentAiSessionRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "Which surface the conversation grounds on: 'content' | 'task' | 'foundation' | 'course'. Omitted → derived from whichever anchor id is present (priority content > task > foundation > course).",
        },
    )
        scope?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Lesson content the conversation starts in (content scope). Omitted on a task/foundation/course page.",
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

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Course the conversation starts in when no lesson/task/foundation is open (course scope, enrolled-only).",
        },
    )
        courseId?: string

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "Born-archived: create the conversation already archived (kept out of the default history list, still searchable). Used for selection-passage 'explain this' side-threads.",
        },
    )
        archived?: boolean
}
