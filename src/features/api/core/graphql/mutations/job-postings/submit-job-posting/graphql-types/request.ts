import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator"
import {
    Type,
} from "class-transformer"
import {
    GraphQLTypeJobApplyMethod,
    GraphQLTypeJobEmploymentType,
    GraphQLTypeWorkMode,
    JobApplyMethod,
    JobEmploymentType,
    WorkMode,
} from "@modules/databases"

/** Upper bound on title length, mirroring the `job_postings.title` column. */
const MAX_TITLE_LENGTH = 255
/** Upper bound on description length, mirroring the `job_postings.description` column. */
const MAX_DESCRIPTION_LENGTH = 20_000
/** Upper bound on requirements length, mirroring the `job_postings.requirements` column. */
const MAX_REQUIREMENTS_LENGTH = 20_000
/** Upper bound on location length, mirroring the `job_postings.location` column. */
const MAX_LOCATION_LENGTH = 255
/** Upper bound on apply URL length, mirroring the `job_postings.apply_url` column. */
const MAX_APPLY_URL_LENGTH = 2048
/** Upper bound on apply email length, mirroring the `job_postings.apply_email` column. */
const MAX_APPLY_EMAIL_LENGTH = 255
/** Lower/upper sanity bounds for advertised salary figures. */
const MIN_SALARY = 0
const MAX_SALARY = 1_000_000_000
/** Upper bound on a new company's title length, mirroring `headhunting_companies.title`. */
const MAX_COMPANY_TITLE_LENGTH = 255
/** Upper bound on a new company's URL fields, mirroring `headhunting_companies` columns. */
const MAX_COMPANY_URL_LENGTH = 2048

@InputType({
    description: "Payload for creating a new employer company inline with the job posting.",
})
/**
 * Inline payload for creating a brand-new employer company alongside the job
 * posting, used when the poster's company is not yet in the directory.
 * Exactly one of `SubmitJobPostingRequest.companyId` / `newCompany` must be
 * provided — that cross-field invariant is enforced in the handler, since
 * `class-validator` field decorators cannot see sibling fields.
 */
export class SubmitJobPostingNewCompanyRequest {
    @Field(
        () => String,
        {
            description: "New company display name.",
        },
    )
    // required so the newly created HeadhuntingCompanyEntity row has a title
    @IsString()
    @MaxLength(MAX_COMPANY_TITLE_LENGTH)
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Company logo image URL.",
        },
    )
    // optional; validated as a URL when present
    @IsOptional()
    @IsUrl()
    @MaxLength(MAX_COMPANY_URL_LENGTH)
        logoUrl?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Public company website URL.",
        },
    )
    // optional; validated as a URL when present
    @IsOptional()
    @IsUrl()
    @MaxLength(MAX_COMPANY_URL_LENGTH)
        websiteUrl?: string
}

@InputType({
    description: "Request to submit a job posting via the public form.",
})
/**
 * Request to submit a job posting via the public form. `source` on the
 * resulting row is always `Submitted` — this mutation has no admin/seed path.
 *
 * Exactly one of `companyId` / `newCompany` is required (existing company vs.
 * "my company isn't listed yet"); exactly one of `applyUrl` / `applyEmail` is
 * required, matching `applyMethod`. Both invariants are enforced in the
 * handler (see `JobPostingInvalidRequestException`).
 */
export class SubmitJobPostingRequest {
    @Field(
        () => String,
        {
            description: "Job title.",
        },
    )
    // required for every posting and capped to the column length
    @IsString()
    @MaxLength(MAX_TITLE_LENGTH)
        title: string

    @Field(
        () => String,
        {
            description: "Full job description (markdown).",
        },
    )
    // required so a listing always has body copy to show
    @IsString()
    @MaxLength(MAX_DESCRIPTION_LENGTH)
        description: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Candidate requirements (markdown).",
        },
    )
    @IsOptional()
    @IsString()
    @MaxLength(MAX_REQUIREMENTS_LENGTH)
        requirements?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Free-text location.",
        },
    )
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LOCATION_LENGTH)
        location?: string

    @Field(
        () => GraphQLTypeWorkMode,
        {
            nullable: true,
            description: "Work arrangement (remote / hybrid / onsite).",
        },
    )
    @IsOptional()
    @IsEnum(WorkMode)
        workMode?: WorkMode

    @Field(
        () => GraphQLTypeJobEmploymentType,
        {
            nullable: true,
            description: "Employment arrangement.",
        },
    )
    @IsOptional()
    @IsEnum(JobEmploymentType)
        employmentType?: JobEmploymentType

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Minimum advertised salary; omit both salary fields for \"Negotiable\".",
        },
    )
    @IsOptional()
    @IsInt()
    @Min(MIN_SALARY)
    @Max(MAX_SALARY)
        salaryMin?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Maximum advertised salary; omit both salary fields for \"Negotiable\".",
        },
    )
    @IsOptional()
    @IsInt()
    @Min(MIN_SALARY)
    @Max(MAX_SALARY)
        salaryMax?: number

    @Field(
        () => GraphQLTypeJobApplyMethod,
        {
            description: "Discriminator for how a candidate applies; determines which of applyUrl / applyEmail is required.",
        },
    )
    // required — every posting needs a way to apply
    @IsEnum(JobApplyMethod)
        applyMethod: JobApplyMethod

    @Field(
        () => String,
        {
            nullable: true,
            description: "Apply URL; required when applyMethod is ExternalUrl.",
        },
    )
    // field-level check only validates FORMAT when present; the "required
    // when applyMethod is ExternalUrl" invariant is cross-field and enforced
    // in the handler
    @IsOptional()
    @IsUrl()
    @MaxLength(MAX_APPLY_URL_LENGTH)
        applyUrl?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Apply email; required when applyMethod is Email.",
        },
    )
    // same as applyUrl above — format-only check, cross-field requiredness
    // enforced in the handler
    @IsOptional()
    @IsEmail()
    @MaxLength(MAX_APPLY_EMAIL_LENGTH)
        applyEmail?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of an existing HeadhuntingCompanyEntity to post under. Mutually exclusive with newCompany.",
        },
    )
    @IsOptional()
    @IsString()
        companyId?: string

    @Field(
        () => SubmitJobPostingNewCompanyRequest,
        {
            nullable: true,
            description: "Inline payload to create a brand-new employer company. Mutually exclusive with companyId.",
        },
    )
    @IsOptional()
    @ValidateNested()
    @Type(() => SubmitJobPostingNewCompanyRequest)
        newCompany?: SubmitJobPostingNewCompanyRequest
}
