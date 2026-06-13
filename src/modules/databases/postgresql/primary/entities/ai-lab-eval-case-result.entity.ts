import {
    Field,
    Float,
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
    UuidAbstractEntity,
} from "./abstract"
import {
    AiLabEvalRunEntity,
} from "./ai-lab-eval-run.entity"
import {
    AiLabEvalCaseEntity,
} from "./ai-lab-eval-case.entity"

/**
 * The grading result of one eval case within an eval run: the actual model
 * output, the metric score, an optional LLM-judge score, the pass verdict, and
 * the feedback shown to the learner.
 */
@ObjectType({
    description: "Grading result of one eval case within an AI Lab eval run.",
})
@Index(["evalRun"])
@Entity("ai_lab_eval_case_results")
export class AiLabEvalCaseResultEntity extends UuidAbstractEntity {
    /**
     * Eval run this result belongs to.
     */
    @Field(
        () => AiLabEvalRunEntity,
        {
            description: "Eval run this result belongs to.",
        },
    )
    @ManyToOne(
        () => AiLabEvalRunEntity,
        (evalRun: AiLabEvalRunEntity) => evalRun.caseResults,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "eval_run_id",
        foreignKeyConstraintName: "fk_eval_run_id_ai_lab_eval_case_results_ai_lab_eval_runs",
    })
        evalRun: AiLabEvalRunEntity

    /**
     * Eval run ID.
     */
    @Field(
        () => ID,
        {
            description: "Eval run ID.",
        },
    )
    @RelationId(
        (caseResult: AiLabEvalCaseResultEntity) => caseResult.evalRun,
    )
        evalRunId: string

    /**
     * Eval case this result graded.
     */
    @Field(
        () => AiLabEvalCaseEntity,
        {
            description: "Eval case this result graded.",
        },
    )
    @ManyToOne(
        () => AiLabEvalCaseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "eval_case_id",
        foreignKeyConstraintName: "fk_eval_case_id_ai_lab_eval_case_results_ai_lab_eval_cases",
    })
        evalCase: AiLabEvalCaseEntity

    /**
     * Eval case ID.
     */
    @Field(
        () => ID,
        {
            description: "Eval case ID.",
        },
    )
    @RelationId(
        (caseResult: AiLabEvalCaseResultEntity) => caseResult.evalCase,
    )
        evalCaseId: string

    /**
     * Display / execution order, mirroring the eval case order.
     */
    @Field(
        () => Int,
        {
            description: "Display / execution order, mirroring the eval case order.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
    })
        orderIndex: number

    /**
     * Actual model output produced for this case.
     */
    @Field(
        () => String,
        {
            description: "Actual model output produced for this case.",
        },
    )
    @Column({
        name: "actual_output",
        type: "text",
    })
        actualOutput: string

    /**
     * Score from the deterministic metric (exact / embedding / contains).
     */
    @Field(
        () => Float,
        {
            description: "Score from the deterministic metric (exact / embedding / contains).",
        },
    )
    @Column({
        name: "metric_score",
        type: "float",
    })
        metricScore: number

    /**
     * Score from the LLM judge (nullable for non-judge cases).
     */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Score from the LLM judge.",
        },
    )
    @Column({
        name: "judge_score",
        type: "float",
        nullable: true,
    })
        judgeScore: number | null

    /**
     * Whether this case passed.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether this case passed.",
        },
    )
    @Column({
        name: "passed",
        type: "bool",
    })
        passed: boolean

    /**
     * Whether a required citation was present (nullable when not checked).
     */
    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "Whether a required citation was present.",
        },
    )
    @Column({
        name: "citation_present",
        type: "bool",
        nullable: true,
    })
        citationPresent: boolean | null

    /**
     * Learner-facing feedback for this case.
     */
    @Field(
        () => String,
        {
            description: "Learner-facing feedback for this case.",
        },
    )
    @Column({
        name: "feedback",
        type: "text",
    })
        feedback: string
}
