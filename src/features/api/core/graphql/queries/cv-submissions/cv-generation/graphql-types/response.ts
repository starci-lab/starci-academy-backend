import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    CvGenerationMode,
    CvGenerationStatus,
    GraphQLTypeCvGenerationMode,
    GraphQLTypeCvGenerationStatus,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One CV generation run, resolved for the FE: the assembled `structuredData`
 * exposed as a JSON scalar, and the generated `.tex` document resolved from
 * MinIO to its raw text (`latexSource`) server-side — so the client never needs
 * direct MinIO access.
 */
@ObjectType({
    description: "A single CV generation run with resolved structured data + LaTeX source.",
})
export class CvGenerationPayload {
    @Field(
        () => ID,
        {
            description: "cv_generations.id.",
        },
    )
        id: string

    @Field(
        () => GraphQLTypeCvGenerationMode,
        {
            description: "Whether this run builds a new CV or revises an existing submission.",
        },
    )
        mode: CvGenerationMode

    @Field(
        () => GraphQLTypeCvGenerationStatus,
        {
            description: "Processing status of this generation run.",
        },
    )
        status: CvGenerationStatus

    @Field(
        () => ID,
        {
            nullable: true,
            description: "ID of the source CV submission being revised (when mode = Revise).",
        },
    )
        sourceCvSubmissionId: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "User's free-text input describing projects, skills, and experience.",
        },
    )
        extraPrompts: string | null

    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Assembled CV JSON (header/summary/skills/experience/education).",
        },
    )
        structuredData: Record<string, unknown> | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Raw .tex document text, resolved server-side from MinIO (latex_cdn_key).",
        },
    )
        latexSource: string | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When this generation run finished processing.",
        },
    )
        processedAt: Date | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Error message populated when the generation fails.",
        },
    )
        errorMessage: string | null

    @Field(
        () => Date,
        {
            description: "When this generation run was created.",
        },
    )
        createdAt: Date
}

@ObjectType({
    description: "Response wrapper for the cvGeneration query.",
})
export class CvGenerationResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CvGenerationPayload>
{
    @Field(
        () => CvGenerationPayload,
        {
            nullable: true,
            description: "The CV generation run (must belong to the caller).",
        },
    )
        data: CvGenerationPayload
}
