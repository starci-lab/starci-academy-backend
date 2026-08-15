import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    CvTargetLevel,
    GraphQLTypeCvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from "class-validator"

@InputType({
    description: "Register an uploaded CV into the unified table + enqueue scoring.",
})
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
export class UploadCvRequest {
    @IsString()
    @MaxLength(2048)
    /** The object key of the already-uploaded file (from the presign response). */
    @Field(
        () => String,
        {
            description: "Storage object key of the uploaded CV file (the `cdnKey` returned by generateSubmitCvPresignUrl).",
        },
    )
        cdnKey: string

    /** Concrete model the user picked in the CV-scoring model picker (e.g. "gpt-4o"). */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for scoring; null = balancer default (Auto).",
        },
    )
        selectedModel?: string

    /** Provider serving {@link selectedModel}. */
    @IsOptional()
    @IsEnum(ModelProvider)
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the picked model.",
        },
    )
        selectedModelProvider?: ModelProvider

    /** Optional course/track to tie this CV to (`courses.id`). */
    @IsOptional()
    @IsUUID()
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Optional course/track id to tie this CV to.",
        },
    )
        courseId?: string

    /** Optional user-facing name for this CV. */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-facing name for this CV.",
        },
    )
        label?: string

    /** Optional target role this CV is aimed at (free-text). */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional target role this CV is aimed at (free-text).",
        },
    )
        targetRole?: string

    /** Optional language/locale for this CV (free-text, e.g. "en" / "vi"). */
    @IsOptional()
    @IsIn(["en",
        "vi"])
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional language/locale for this CV (free-text).",
        },
    )
        language?: string

    @Field(() => GraphQLTypeCvTargetLevel,
        {
            description: "Explicit seniority bar used to score this uploaded CV.",
        })
    @IsEnum(CvTargetLevel)
        targetLevel: CvTargetLevel
}
