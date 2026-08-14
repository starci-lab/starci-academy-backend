import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    CodingDifficulty,
    GraphQLTypeCodingDifficulty,
} from "@modules/databases/postgresql/primary/enums/coding-difficulty"
import {
    CodingDomain,
    GraphQLTypeCodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"

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

    /**
     * Filter to one interview topic domain.
     *
     * NOT the same thing as {@link CodingProblemsRequest.tag}. Tags are free text on the problem
     * (`array`, `dp`, `graph`); the domain is the closed enum the entity documents as the field
     * the problem list is GROUPED by. Filtering by tag returns a different, overlapping set.
     */
    @Field(
        () => GraphQLTypeCodingDomain,
        {
            nullable: true,
            description: "Filter to one interview topic domain.",
        },
    )
        domain?: CodingDomain

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
