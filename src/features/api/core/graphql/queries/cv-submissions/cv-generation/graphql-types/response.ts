import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    CvGenerationMode,
    CvGenerationStatus,
    CvSource,
    GraphQLTypeCvGenerationMode,
    GraphQLTypeCvGenerationStatus,
    GraphQLTypeCvSource,
    GraphQLTypeSubmissionFeedbackSeverity,
    SubmissionFeedbackSeverity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One observation (strength or gap) from the shared CV scoring rubric — mirrors
 * `CvScoreFeedbackItem` (`shared/cv-scoring/types`), typed for GraphQL. Reuses
 * the existing {@link SubmissionFeedbackSeverity} enum (`low`/`medium`/`high`)
 * rather than a CV-specific one — same semantic, no duplicate type.
 */
@ObjectType({
    description: "One CV scoring observation (a strength or a gap), with an optional fix suggestion.",
})
export class CvFeedbackItem {
    @Field(
        () => GraphQLTypeSubmissionFeedbackSeverity,
        {
            description: "Severity of this observation.",
        },
    )
        severity: SubmissionFeedbackSeverity

    @Field(
        () => String,
        {
            description: "The rubric section this item relates to (e.g. \"impact\", \"clarity\").",
        },
    )
        section: string

    @Field(
        () => String,
        {
            description: "Human-readable explanation of the strength or gap.",
        },
    )
        message: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "A concrete suggestion to address this observation, when the model gave one.",
        },
    )
        suggestion: string | null
}

/**
 * Structured CV scoring feedback (`cv_generations.feedback`) — a one-line
 * summary plus the per-observation breakdown. Null until scored.
 */
@ObjectType({
    description: "Structured CV scoring feedback: a one-line summary plus per-observation findings.",
})
export class CvFeedback {
    @Field(
        () => String,
        {
            description: "One-line summary of the CV's overall quality.",
        },
    )
        shortFeedback: string

    @Field(
        () => String,
        {
            description: "The rubric level this CV was graded against (junior | mid | senior).",
        },
    )
        templateLevel: string

    @Field(
        () => [CvFeedbackItem],
        {
            description: "Per-observation feedback items (strengths + gaps).",
        },
    )
        items: Array<CvFeedbackItem>
}

/**
 * One CV generation run, resolved for the FE: the assembled `structuredData`
 * exposed as a JSON scalar, the generated `.tex` document resolved from MinIO
 * to its raw text (`latexSource`) server-side — so the client never needs
 * direct MinIO access — and the structured scoring `feedback` typed for the
 * findings accordion.
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
            description: "ID of the source CV submission being revised (when mode = Revise).",
        },
    )
        sourceCvSubmissionId: string | null

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
        () => CvFeedback,
        {
            nullable: true,
            description: "Structured scoring feedback (parsed server-side from cv_generations.feedback); null until scored.",
        },
    )
        feedback: CvFeedback | null

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
        () => String,
        {
            nullable: true,
            description: "Presigned GET URL for the user's uploaded CV file (source = uploaded), resolved server-side from MinIO (uploaded_cdn_key). Null for generated CVs or a missing object.",
        },
    )
        uploadedCvUrl: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Presigned GET URL for the PDF compiled server-side (tectonic) from the generated .tex (source = generated). Null until compiled, on a failed compile, or for uploaded CVs.",
        },
    )
        generatedPdfUrl: string | null

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
