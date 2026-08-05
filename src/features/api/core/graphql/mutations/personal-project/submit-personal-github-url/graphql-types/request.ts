import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to submit a personal project GitHub URL.",
})
/**
 * First-time repo bind on the enrollment. Later edits go through
 * syncPersonalProjectGithub so this leaf stays a simple required-URL write.
 */
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
