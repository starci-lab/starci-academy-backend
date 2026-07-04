import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
} from "@modules/databases"
import type {
    AiMode,
    ModelProvider,
} from "@modules/databases"

@InputType({
    description: "Request to review a single task of a personal project.",
})
export class ReviewPersonalProjectTaskRequest {
    @Field(
        () => ID,
        {
            description: "Course ID (enrollment is resolved from the authenticated user).",
        },
    )
        courseId: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Task ID to review. If omitted, defaults to the first task (orderIndex = 0).",
        },
    )
        taskId?: string

    @Field(
        () => String,
        {
            nullable: true,
            description:
                "GitHub repository URL. If omitted, uses the URL stored on the user's enrollment for this course.",
        },
    )
        githubUrl?: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description:
                "Branch name for review. If omitted, uses the branch stored on enrollment (default branch in the worker when unset).",
        },
    )
        branch?: string | null

    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane for grading (auto / premium).",
        },
    )
        mode?: AiMode

    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model for premium grading (required for that lane).",
        },
    )
        selectedModel?: string

    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider for the selected model.",
        },
    )
        selectedModelProvider?: ModelProvider

    @Field(
        () => String,
        {
            nullable: true,
            description:
                "Chosen programming language for a SCHEMA V2 task (typescript/java/csharp/go) — picks the per-language approach criteria at grade time. Ignored for legacy/agnostic tasks.",
        },
    )
        lang?: string
}
