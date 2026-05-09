import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to submit a personal project GitHub repo for review.",
})
export class ReviewPersonalProjectForTaskRequest {
    @Field(
        () => ID,
        {
            description: "Enrollment ID.",
        },
    )
        enrollmentId: string

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
