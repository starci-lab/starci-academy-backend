import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

/** Request for paging the current user's submissions to one problem. */
@InputType({
    description: "Page the current user's submissions for a problem.",
})
export class MyCodingSubmissionsRequest {
    @Field(
        () => String,
        {
            description: "Slug of the problem to fetch submissions for.",
        },
    )
        slug: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "1-based page number (default 1).",
        },
    )
        page?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Page size (default 20).",
        },
    )
        limit?: number
}
