import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CvGenerationMode,
    CvGenerationStatus,
    CvSource,
    GraphQLTypeCvGenerationMode,
    GraphQLTypeCvGenerationStatus,
    GraphQLTypeCvSource,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One row of the caller's CV generation history (lightweight — no resolved file content).",
})
/**
 * One row of the caller's CV generation history — a lightweight projection of
 * `UserCvGenerationEntity` (list view: no `structuredData`/`latexSource`/
 * presigned file URL, which are resolved on-demand via the `cvGeneration(id)`
 * query to avoid an S3 round trip per row here).
 */
export class CvGenerationListItem {
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
        () => GraphQLTypeCvSource,
        {
            description: "Origin of this CV (system-generated vs. user-uploaded).",
        },
    )
        source: CvSource

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the course this CV is tied to (null when untied).",
        },
    )
        courseId: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Title of the course this CV is tied to (resolved server-side; null when untied).",
        },
    )
        courseTitle: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "User-facing name for this CV (frontend falls back when empty).",
        },
    )
        label: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Target role this CV is aimed at (free-text; no enforced taxonomy).",
        },
    )
        targetRole: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Language/locale this CV is written in (free-text; no enforced taxonomy).",
        },
    )
        language: string | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Holistic CV score (0–100); filled by the shared scoring step.",
        },
    )
        score: number | null

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
            nullable: true,
            description: "When this generation run finished processing.",
        },
    )
        processedAt: Date | null

    @Field(
        () => Date,
        {
            description: "When this generation run was created.",
        },
    )
        createdAt: Date
}

@ObjectType({
    description: "Response wrapper for the myCvGenerations query.",
})
/**
 * Response wrapper for `myCvGenerations` — the caller's CV generation runs
 * (newest first), as lightweight list rows (see {@link CvGenerationListItem}).
 */
export class MyCvGenerationsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<CvGenerationListItem>>
{
    @Field(
        () => [CvGenerationListItem],
        {
            nullable: true,
            description: "The caller's CV generation runs (newest first).",
        },
    )
        data: Array<CvGenerationListItem>
}
