import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from "class-validator"

@InputType({
    description: "Input for connecting GitHub account.",
})
/**
 * GitHub username to connect to user account.
 */
export class ConnectGithubAccountInput {
    /**
     * GitHub username (1-39 alphanumeric chars, hyphens allowed).
     * @see https://github.blog/changelog/2013-06-04-increased-username-length/
     */
    @Field(
        () => String,
        {
            description: "GitHub username to connect.",
        },
    )
    @IsString()
    @MinLength(1,
        {
            message: "GitHub username must be at least 1 character" 
        })
    @MaxLength(39,
        {
            message: "GitHub username must be at most 39 characters" 
        })
    @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
        {
            message: "Invalid GitHub username format",
        })
        githubUsername: string
}
