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
    AiLabMetricKind,
    GraphQLTypeAiLabMetricKind,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    AiLabEvalSetEntity,
} from "./ai-lab-eval-set.entity"

/**
 * One eval case within an AI Lab eval set: an input fed through the submitted
 * prompt template, plus how the resulting output is scored (exact / embedding /
 * contains / judge) and its weight in the aggregate verdict.
 */
@ObjectType({
    description: "One eval case within an AI Lab eval set (input + scoring metric + weight).",
})
@Index(["evalSet"])
@Entity("ai_lab_eval_cases")
export class AiLabEvalCaseEntity extends UuidAbstractEntity {
    /**
     * Eval set this case belongs to.
     */
    @Field(
        () => AiLabEvalSetEntity,
        {
            description: "Eval set this case belongs to.",
        },
    )
    @ManyToOne(
        () => AiLabEvalSetEntity,
        (evalSet: AiLabEvalSetEntity) => evalSet.cases,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "eval_set_id",
        foreignKeyConstraintName: "fk_eval_set_id_ai_lab_eval_cases_ai_lab_eval_sets",
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
        (evalCase: AiLabEvalCaseEntity) => evalCase.evalSet,
    )
        evalSetId: string

    /**
     * Display / execution order within the eval set.
     */
    @Field(
        () => Int,
        {
            description: "Display / execution order within the eval set.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
    })
        orderIndex: number

    /**
     * Input fed through the submitted prompt template's `{{input}}` placeholder.
     */
    @Field(
        () => String,
        {
            description: "Input fed through the submitted prompt template's placeholder.",
        },
    )
    @Column({
        name: "input",
        type: "text",
    })
        input: string

    /**
     * Expected output for exact / embedding scoring (nullable for contains / judge).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Expected output for exact / embedding scoring.",
        },
    )
    @Column({
        name: "expected_output",
        type: "text",
        nullable: true,
    })
        expectedOutput: string | null

    /**
     * Substrings the output must contain for contains scoring (nullable otherwise).
     */
    @Field(
        () => [String],
        {
            nullable: true,
            description: "Substrings the output must contain for contains scoring.",
        },
    )
    @Column({
        name: "expected_contains",
        type: "jsonb",
        nullable: true,
    })
        expectedContains: Array<string> | null

    /**
     * Whether the output must cite a retrieved source (RAG playgrounds).
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the output must cite a retrieved source.",
        },
    )
    @Column({
        name: "must_cite",
        type: "bool",
        default: false,
    })
        mustCite: boolean

    /**
     * How this case's output is scored (exact / embedding / contains / judge).
     */
    @Field(
        () => GraphQLTypeAiLabMetricKind,
        {
            description: "How this case's output is scored (exact / embedding / contains / judge).",
        },
    )
    @Column({
        name: "ai_lab_metric_kind",
        type: "enum",
        enum: AiLabMetricKind,
        enumName: "ai_lab_metric_kind",
    })
        metricKind: AiLabMetricKind

    /**
     * Cosine-similarity threshold for embedding scoring (nullable otherwise).
     */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Cosine-similarity threshold for embedding scoring.",
        },
    )
    @Column({
        name: "embedding_threshold",
        type: "float",
        nullable: true,
    })
        embeddingThreshold: number | null

    /**
     * Weight of this case in the aggregate verdict.
     */
    @Field(
        () => Int,
        {
            description: "Weight of this case in the aggregate verdict.",
        },
    )
    @Column({
        name: "weight",
        type: "int",
        default: 1,
    })
        weight: number
}
