import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    GraphQLTypeJobApplyMethod,
    GraphQLTypeJobEmploymentType,
    GraphQLTypeJobPostingSource,
    GraphQLTypeWorkMode,
    JobApplyMethod,
    JobEmploymentType,
    JobPostingSource,
    WorkMode,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    HeadhuntingCompanyEntity,
} from "./headhunting-company.entity"
import {
    UserEntity,
} from "./user.entity"

/**
 * A structured "IT job" listing (title, salary, location, apply method), as
 * opposed to the freestyle headhunter/consultant relationship modeled by
 * {@link HeadhuntingCompanyEntity} + `ConsultantEntity`. Rows may come from
 * either the `.mount/data/jobs` curated seed pipeline or the public
 * `submitJobPosting` mutation ({@link JobPostingSource} tags which); both are
 * live immediately on insert — there is no approval workflow for v1.
 *
 * Single-locale per row (no `translations` sub-table), matching
 * `UserPinnedProjectEntity`: this is user-submitted-capable content, not
 * admin-curated CMS copy that needs multi-locale fan-out.
 */
@ObjectType({
    description: "A structured IT job posting.",
})
@Entity("job_postings")
@Index(["company"])
export class JobPostingEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Job title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    @Field(
        () => String,
        {
            description: "Stable slug for routing (e.g. `/jobs/<displayId>`).",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
        unique: true,
    })
        displayId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Full job description (markdown).",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Candidate requirements (markdown).",
        },
    )
    @Column({
        name: "requirements",
        type: "text",
        nullable: true,
    })
        requirements: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Free-text location (e.g. city, or \"Anywhere in Vietnam\").",
        },
    )
    @Column({
        name: "location",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        location: string | null

    @Field(
        () => GraphQLTypeWorkMode,
        {
            nullable: true,
            description: "Work arrangement (remote / hybrid / onsite); reuses the profile-level WorkMode enum.",
        },
    )
    @Column({
        name: "work_mode",
        type: "enum",
        enum: WorkMode,
        enumName: "work_mode",
        nullable: true,
    })
        workMode: WorkMode | null

    @Field(
        () => GraphQLTypeJobEmploymentType,
        {
            nullable: true,
            description: "Employment arrangement (fulltime / parttime / internship / contract).",
        },
    )
    @Column({
        name: "employment_type",
        type: "enum",
        enum: JobEmploymentType,
        enumName: "job_employment_type",
        nullable: true,
    })
        employmentType: JobEmploymentType | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Minimum advertised salary; null (alongside salaryMax) renders as \"Negotiable\".",
        },
    )
    @Column({
        name: "salary_min",
        type: "int",
        nullable: true,
    })
        salaryMin: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Maximum advertised salary; null (alongside salaryMin) renders as \"Negotiable\".",
        },
    )
    @Column({
        name: "salary_max",
        type: "int",
        nullable: true,
    })
        salaryMax: number | null

    @Field(
        () => GraphQLTypeJobApplyMethod,
        {
            nullable: true,
            description: "Discriminator for how a candidate applies (external URL or email).",
        },
    )
    @Column({
        name: "apply_method",
        type: "enum",
        enum: JobApplyMethod,
        enumName: "job_apply_method",
        nullable: true,
    })
        applyMethod: JobApplyMethod | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Apply URL; set when applyMethod is ExternalUrl.",
        },
    )
    @Column({
        name: "apply_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        applyUrl: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Apply email; set when applyMethod is Email.",
        },
    )
    @Column({
        name: "apply_email",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        applyEmail: string | null

    @Field(
        () => GraphQLTypeJobPostingSource,
        {
            description: "Provenance tag (seeded content vs. public submission); not a moderation state.",
        },
    )
    @Column({
        name: "source",
        type: "enum",
        enum: JobPostingSource,
        enumName: "job_posting_source",
        default: JobPostingSource.Submitted,
    })
        source: JobPostingSource

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When this posting expires; null means it never expires.",
        },
    )
    @Column({
        name: "expires_at",
        type: "timestamptz",
        nullable: true,
    })
        expiresAt: Date | null

    /**
     * Employer. The company directory entity ({@link HeadhuntingCompanyEntity})
     * IS the "organization" concept for both roles it plays (a company that
     * headhunts through consultants, and a company that posts jobs directly) —
     * there is intentionally no separate `Company` entity.
     */
    @Field(
        () => HeadhuntingCompanyEntity,
        {
            description: "Employer company.",
        },
    )
    @ManyToOne(
        () => HeadhuntingCompanyEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "company_id",
        foreignKeyConstraintName: "fk_company_id_job_postings_headhunting_companies",
    })
        company: HeadhuntingCompanyEntity

    @Field(
        () => ID,
        {
            description: "Employer company id.",
        },
    )
    @RelationId(
        (jobPosting: JobPostingEntity) => jobPosting.company,
    )
        companyId: string

    /**
     * Submitting user. Null for seeded rows (no submitter) and SET NULL if the
     * submitting account is later deleted — the posting itself outlives the
     * account that created it.
     */
    @Field(
        () => UserEntity,
        {
            nullable: true,
            description: "User who submitted this posting via the public form; null for seeded content.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            nullable: true,
            onDelete: "SET NULL",
        },
    )
    @JoinColumn({
        name: "posted_by_user_id",
        foreignKeyConstraintName: "fk_posted_by_user_id_job_postings_users",
    })
        postedByUser: UserEntity | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the submitting user; null for seeded content.",
        },
    )
    @RelationId(
        (jobPosting: JobPostingEntity) => jobPosting.postedByUser,
    )
        postedByUserId: string | null

    @Field(
        () => Int,
        {
            description: "Display order in curated listings.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(
        () => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number
}
