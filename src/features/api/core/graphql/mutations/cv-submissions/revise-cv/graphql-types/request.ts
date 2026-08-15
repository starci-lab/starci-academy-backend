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
    ArrayMaxSize,
    ArrayUnique,
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from "class-validator"

@InputType({
    description: "Revise an existing CV using the user's free-text prompts.",
})
/**
 * Request for {@link ReviseCvResponse}: revise an existing CV
 * (`UserCvGenerationEntity` -- either `Generated` or `Uploaded`) using the
 * user's free-text notes. The server validates the source generation exists +
 * belongs to the caller, then creates a `Pending` generation run and enqueues
 * the job (mode = Revise).
 */
export class ReviseCvRequest {
    @IsUUID()
    @Field(
        () => ID,
        {
            description: "cv_generations.id of the existing CV to revise. Field name kept for API compatibility.",
        },
    )
        cvSubmissionId: string

    @IsOptional()
    @IsString()
    @MaxLength(10_000)
    @Field(
        () => String,
        {
            nullable: true,
            description: "User's free-text emphasis / target-role notes for the revision.",
        },
    )
        extraPrompts?: string

    /** Concrete model the user picked in the CV-generation model picker (e.g. "gpt-4o"). */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for CV generation; null = balancer default (Auto).",
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
            nullable: true,
            description: "Replacement target bar; omitted inherits the source run.",
        })
    @IsOptional()
    @IsEnum(CvTargetLevel)
        targetLevel?: CvTargetLevel

    @Field(() => [ID],
        {
            nullable: true,
            description: "Replacement capstone IDs; omitted inherits, explicit empty clears.",
        })
    @IsOptional()
    @ArrayMaxSize(5)
    @ArrayUnique()
    @IsUUID(undefined,
        {
            each: true,
        })
        milestoneTaskAttemptIds?: Array<string>
}
