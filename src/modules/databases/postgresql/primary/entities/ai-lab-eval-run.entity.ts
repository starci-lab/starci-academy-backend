import {
    Field,
    Float,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
    Unique,
} from "typeorm"
import {
    AiLabEvalRunStatus,
    AiMode,
    GraphQLTypeAiLabEvalRunStatus,
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    JobEntity,
} from "./job.entity"
import {
    AiLabEvalSetEntity,
} from "./ai-lab-eval-set.entity"
import {
    AiLabEvalCaseResultEntity,
} from "./ai-lab-eval-case-result.entity"
import {
    AiLabRunParamsObject,
} from "./ai-lab-run-params.object"

/**
 * One graded submission of a prompt template against an AI Lab eval set. Mirrors
 * the V2 challenge-submission job link: an async grading job fills in the verdict
 * (total/max score, passed) and the per-case results once the worker finishes.
 */
@ObjectType({
    description: "One graded submission of a prompt template against an AI Lab eval set.",
})
@Index(["user"])
@Index(["enrollment"])
@Index(["evalSet"])
// dedupe / cache identical resubmissions: one verdict per (eval set, learner, input hash)
@Unique(["evalSet",
    "user",
    "submittedHash"])
@Entity("ai_lab_eval_runs")
export class AiLabEvalRunEntity extends UuidAbstractEntity {
    /**
     * Learner who submitted the eval run.
     */
    @Field(
        () => UserEntity,
        {
            description: "Learner who submitted the eval run.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_ai_lab_eval_runs_users",
    })
        user: UserEntity

    /**
     * Learner ID.
     */
    @Field(
        () => ID,
        {
            description: "Learner ID.",
        },
    )
    @RelationId(
        (evalRun: AiLabEvalRunEntity) => evalRun.user,
    )
        userId: string

    /**
     * Enrollment the submission was made under.
     */
    @Field(
        () => EnrollmentEntity,
        {
            description: "Enrollment the submission was made under.",
        },
    )
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_ai_lab_eval_runs_enrollments",
    })
        enrollment: EnrollmentEntity

    /**
     * Enrollment ID.
     */
    @Field(
        () => ID,
        {
            description: "Enrollment ID.",
        },
    )
    @RelationId(
        (evalRun: AiLabEvalRunEntity) => evalRun.enrollment,
    )
        enrollmentId: string

    /**
     * Eval set being graded against.
     */
    @Field(
        () => AiLabEvalSetEntity,
        {
            description: "Eval set being graded against.",
        },
    )
    @ManyToOne(
        () => AiLabEvalSetEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "eval_set_id",
        foreignKeyConstraintName: "fk_eval_set_id_ai_lab_eval_runs_ai_lab_eval_sets",
    })
        evalSet: AiLabEvalSetEntity

    /**
     * Eval set ID.
     */
    @Field(
        () => ID,
        {
            description: "Eval set ID.",
        },
    )
    @RelationId(
        (evalRun: AiLabEvalRunEntity) => evalRun.evalSet,
    )
        evalSetId: string

    /**
     * Async grading job that produces the verdict (nullable until enqueued).
     */
    @Field(
        () => JobEntity,
        {
            nullable: true,
            description: "Async grading job that produces the verdict.",
        },
    )
    @ManyToOne(
        () => JobEntity,
        {
            nullable: true,
        },
    )
    @JoinColumn({
        name: "job_id",
        foreignKeyConstraintName: "fk_job_id_ai_lab_eval_runs_jobs",
    })
        job: JobEntity | null

    /**
     * Grading job ID (nullable).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Grading job ID.",
        },
    )
    @RelationId(
        (evalRun: AiLabEvalRunEntity) => evalRun.job,
    )
        jobId: string

    /**
     * Submitted system prompt (nullable).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Submitted system prompt.",
        },
    )
    @Column({
        name: "submitted_system_prompt",
        type: "text",
        nullable: true,
    })
        submittedSystemPrompt: string | null

    /**
     * Submitted user prompt template (contains the `{{input}}` placeholder).
     */
    @Field(
        () => String,
        {
            description: "Submitted user prompt template (contains the input placeholder).",
        },
    )
    @Column({
        name: "submitted_user_template",
        type: "text",
    })
        submittedUserTemplate: string

    /**
     * Sampling / generation parameters submitted for grading.
     */
    @Field(
        () => AiLabRunParamsObject,
        {
            description: "Sampling / generation parameters submitted for grading.",
        },
    )
    @Column({
        name: "submitted_params",
        type: "jsonb",
    })
        submittedParams: AiLabRunParamsObject

    /**
     * Deterministic SHA-256 of the submitted inputs (system prompt + user template
     * + params + lane selection). Used to short-circuit identical resubmissions to
     * the existing verdict instead of re-grading (cost control). Nullable so legacy
     * / direct-insert rows do not collide on the unique constraint.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Deterministic hash of the submitted inputs, for verdict caching.",
        },
    )
    @Column({
        name: "submitted_hash",
        type: "varchar",
        nullable: true,
    })
        submittedHash: string | null

    /**
     * Concrete model name used during grading (nullable until resolved).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name used during grading.",
        },
    )
    @Column({
        name: "model",
        type: "varchar",
        nullable: true,
    })
        model: string | null

    /**
     * Provider used during grading (nullable until resolved).
     */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider used during grading.",
        },
    )
    @Column({
        name: "model_provider",
        type: "enum",
        enum: ModelProvider,
        enumName: "model_provider",
        nullable: true,
    })
        provider: ModelProvider | null

    /**
     * AI lane grading was billed on (nullable until resolved).
     */
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane grading was billed on.",
        },
    )
    @Column({
        name: "ai_mode",
        type: "enum",
        enum: AiMode,
        enumName: "ai_mode",
        nullable: true,
    })
        mode: AiMode | null

    /**
     * Total weighted score earned.
     */
    @Field(
        () => Float,
        {
            description: "Total weighted score earned.",
        },
    )
    @Column({
        name: "total_score",
        type: "float",
        default: 0,
    })
        totalScore: number

    /**
     * Maximum weighted score attainable.
     */
    @Field(
        () => Float,
        {
            description: "Maximum weighted score attainable.",
        },
    )
    @Column({
        name: "max_score",
        type: "float",
        default: 0,
    })
        maxScore: number

    /**
     * Whether the submission met the eval set's pass threshold.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the submission met the eval set's pass threshold.",
        },
    )
    @Column({
        name: "passed",
        type: "bool",
        default: false,
    })
        passed: boolean

    /**
     * Lifecycle status of the grading run.
     */
    @Field(
        () => GraphQLTypeAiLabEvalRunStatus,
        {
            description: "Lifecycle status of the grading run.",
        },
    )
    @Column({
        name: "ai_lab_eval_run_status",
        type: "enum",
        enum: AiLabEvalRunStatus,
        enumName: "ai_lab_eval_run_status",
    })
        status: AiLabEvalRunStatus

    /**
     * Per-case grading results.
     */
    @Field(
        () => [AiLabEvalCaseResultEntity],
        {
            description: "Per-case grading results.",
        },
    )
    @OneToMany(
        () => AiLabEvalCaseResultEntity,
        (caseResult: AiLabEvalCaseResultEntity) => caseResult.evalRun,
        {
            cascade: true,
        },
    )
        caseResults: Array<AiLabEvalCaseResultEntity>
}
