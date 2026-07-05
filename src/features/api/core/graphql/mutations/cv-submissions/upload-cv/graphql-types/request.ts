import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

/**
 * Request for {@link UploadCvResponse} (WF-07): register a CV the user UPLOADED
 * (already PUT to storage via the presign flow) into the unified `cv_generations`
 * table as `source = uploaded`, then enqueue async scoring with the shared rubric.
 *
 * The file itself is uploaded out-of-band: the client first calls
 * `generateSubmitCvPresignUrl` (which returns the presigned PUT `url` + the
 * `cdnKey`), PUTs the file to that `url`, then calls THIS mutation with the same
 * `cdnKey` so the server can find + score the uploaded file.
 */
@InputType({
    description: "Register an uploaded CV into the unified table + enqueue scoring.",
})
export class UploadCvRequest {
    /** The object key of the already-uploaded file (from the presign response). */
    @Field(
        () => String,
        {
            description: "Storage object key of the uploaded CV file (the `cdnKey` returned by generateSubmitCvPresignUrl).",
        },
    )
        cdnKey: string

    /** Concrete model the user picked in the CV-scoring model picker (e.g. "gpt-4o"). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for scoring; null = balancer default (Auto).",
        },
    )
        selectedModel?: string

    /** Provider serving {@link selectedModel}. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the picked model.",
        },
    )
        selectedModelProvider?: ModelProvider

    /** Optional course/track to tie this CV to (`courses.id`). */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Optional course/track id to tie this CV to.",
        },
    )
        courseId?: string

    /** Optional user-facing name for this CV. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-facing name for this CV.",
        },
    )
        label?: string

    /** Optional target role this CV is aimed at (free-text). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional target role this CV is aimed at (free-text).",
        },
    )
        targetRole?: string

    /** Optional language/locale for this CV (free-text, e.g. "en" / "vi"). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional language/locale for this CV (free-text).",
        },
    )
        language?: string
}
