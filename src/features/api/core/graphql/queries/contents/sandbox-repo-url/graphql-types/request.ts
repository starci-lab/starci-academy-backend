import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for getting a presigned CDN URL for a premium sandbox lesson.",
})
export class SandboxRepoUrlRequest {
    @Field(
        () => ID,
        {
            description: "Content id of the sandbox lesson.",
        },
    )
        contentId: string
}
