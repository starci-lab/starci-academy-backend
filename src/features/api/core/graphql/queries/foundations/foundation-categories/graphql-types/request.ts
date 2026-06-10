import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

/**
 * Request for the paginated, searchable `foundationCategories` query.
 */
@InputType({
    description: "Pagination + search filters for listing foundation categories.",
})
export class FoundationCategoriesRequest {
    /** 1-based page number; defaults to 1 when omitted. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "1-based page number (default 1).",
        },
    )
        pageNumber?: number

    /** Items per page; defaults to 10 and is clamped server-side. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Items per page (default 10).",
        },
    )
        limit?: number

    /** Optional search string matched against category title + description. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Search string matched against title and description.",
        },
    )
        search?: string
}
