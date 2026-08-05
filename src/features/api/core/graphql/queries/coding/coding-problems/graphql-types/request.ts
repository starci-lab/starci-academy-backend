import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    CodingDifficulty,
    GraphQLTypeCodingDifficulty,
} from "@modules/databases"

@InputType({
    description: "Filters + pagination for the coding-problem list.",
})
/** Request for listing coding problems with optional filters + pagination. */
export class CodingProblemsRequest {
    /** Filter by difficulty tier. */
    @Field(
        () => GraphQLTypeCodingDifficulty,
        {
            nullable: true,
            description: "Filter by difficulty tier.",
        },
    )
        difficulty?: CodingDifficulty

    /** Filter to problems carrying this tag. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Filter to problems carrying this tag.",
        },
    )
        tag?: string

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
