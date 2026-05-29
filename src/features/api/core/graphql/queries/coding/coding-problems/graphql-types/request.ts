import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    CodingDifficulty,
    GraphQLTypeCodingDifficulty,
} from "@modules/databases"

/** Request for listing coding problems with optional filters + pagination. */
@InputType({
    description: "Filters + pagination for the coding-problem list.",
})
export class CodingProblemsRequest {
    @Field(
        () => GraphQLTypeCodingDifficulty,
        {
            nullable: true,
            description: "Filter by difficulty tier.",
        },
    )
        difficulty?: CodingDifficulty

    @Field(
        () => String,
        {
            nullable: true,
            description: "Filter to problems carrying this tag.",
        },
    )
        tag?: string

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
