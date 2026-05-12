import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to submit a personal project GitHub URL.",
})
export class SubmitPersonalGithubUrlRequest {
    @Field(
        () => ID,
        {
            description: "Course ID.",
        },
    )
        courseId: string

    @Field(
        () => String,
        {
            description: "GitHub repository URL.",
        },
    )
        githubUrl: string
}
