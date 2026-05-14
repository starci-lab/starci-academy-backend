import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

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
}
