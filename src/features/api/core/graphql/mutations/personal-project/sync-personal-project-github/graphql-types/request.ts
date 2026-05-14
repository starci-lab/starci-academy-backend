import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to sync personal project GitHub URL and/or branch on enrollment.",
})
export class SyncPersonalProjectGithubRequest {
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
            nullable: true,
            description:
                "GitHub repository URL. If omitted, the existing URL on the enrollment is kept (required on enrollment when only updating branch).",
        },
    )
        githubUrl?: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description:
                "Git branch for review. If omitted, the existing branch on the enrollment is kept.",
        },
    )
        branch?: string | null
}
