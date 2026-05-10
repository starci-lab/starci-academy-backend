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
            description: "GitHub repository URL.",
        },
    )
        githubUrl: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Branch name (defaults to main).",
        },
    )
        branch?: string
}
