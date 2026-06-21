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

    @Field(
        () => String,
        {
            nullable: true,
            description:
                "GitHub access token for cloning a PRIVATE repo (write-only; encrypted at rest, never returned). If omitted, the existing token is kept.",
        },
    )
        githubToken?: string | null

    @Field(
        () => Boolean,
        {
            nullable: true,
            description:
                "When true, removes the stored private-repo GitHub token (grading falls back to public / the org token).",
        },
    )
        clearGithubToken?: boolean | null
}
