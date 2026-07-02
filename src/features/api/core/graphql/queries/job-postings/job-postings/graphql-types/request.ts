import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    GraphQLTypeJobEmploymentType,
    GraphQLTypeWorkMode,
    JobEmploymentType,
    WorkMode,
} from "@modules/databases"

/**
 * Request for the public `jobPostings` list query. All filters are optional;
 * omitting them returns every posting, newest first.
 */
@InputType({
    description: "Request for listing job postings (public, no auth required).",
})
export class JobPostingsRequest {
    @Field(
        () => Int,
        {
            nullable: true,
            defaultValue: 20,
            description: "Page size.",
        },
    )
        limit?: number

    @Field(
        () => Int,
        {
            nullable: true,
            defaultValue: 0,
            description: "Page offset.",
        },
    )
        offset?: number

    @Field(
        () => GraphQLTypeWorkMode,
        {
            nullable: true,
            description: "Filter by work arrangement (remote / hybrid / onsite).",
        },
    )
        workMode?: WorkMode

    @Field(
        () => GraphQLTypeJobEmploymentType,
        {
            nullable: true,
            description: "Filter by employment arrangement.",
        },
    )
        employmentType?: JobEmploymentType

    @Field(
        () => String,
        {
            nullable: true,
            description: "Case-insensitive search over the job title.",
        },
    )
        search?: string
}
