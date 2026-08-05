import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Page the current user's submissions for a problem.",
})
/** Request for paging the current user's submissions to one problem. */
export class MyCodingSubmissionsRequest {
    /** Slug of the problem to fetch submissions for. */
    @Field(
        () => String,
        {
            description: "Slug of the problem to fetch submissions for.",
        },
    )
        slug: string

    /** 1-based page number (default 1). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "1-based page number (default 1).",
        },
    )
        page?: number

    /** Page size (default 20). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Page size (default 20).",
        },
    )
        limit?: number
}
