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
    Unique,
} from "typeorm"
import {
    AiLabRunStatus,
    AiMode,
    GraphQLTypeAiLabRunStatus,
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
    AiLabPlaygroundEntity,
} from "./ai-lab-playground.entity"
import {
    AiLabRunParamsObject,
} from "./ai-lab-run-params.object"

/**
 * One AI Lab playground run by a learner. The unique `(playground, user,
 * inputHash)` constraint lets identical re-runs be served from this cold store
 * instead of calling the model again. The output is filled in once the stream
 * completes over the gateway.
 */
@ObjectType({
    description: "One AI Lab playground run by a learner (also the run cache cold store).",
})
@Index(["user"])
@Index(["playground"])
@Index(["inputHash"])
@Unique([
    "playground",
    "user",
    "inputHash",
])
@Entity("ai_lab_runs")
export class AiLabRunEntity extends UuidAbstractEntity {
    /**
     * Learner who issued the run.
     */
    @Field(
        () => UserEntity,
        {
            description: "Learner who issued the run.",
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
        foreignKeyConstraintName: "fk_user_id_ai_lab_runs_users",
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
        (run: AiLabRunEntity) => run.user,
    )
        userId: string

    /**
     * Playground this run belongs to.
     */
    @Field(
        () => AiLabPlaygroundEntity,
        {
            description: "Playground this run belongs to.",
        },
    )
    @ManyToOne(
        () => AiLabPlaygroundEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "playground_id",
        foreignKeyConstraintName: "fk_playground_id_ai_lab_runs_ai_lab_playgrounds",
    })
        playground: AiLabPlaygroundEntity

    /**
     * Playground ID.
     */
    @Field(
        () => ID,
        {
            description: "Playground ID.",
        },
    )
    @RelationId(
        (run: AiLabRunEntity) => run.playground,
    )
        playgroundId: string

    /**
     * SHA-256 hash of the run inputs (prompts + params + model + provider) used as the cache key.
     */
    @Field(
        () => String,
        {
            description: "SHA-256 hash of the run inputs used as the cache key.",
        },
    )
    @Column({
        name: "input_hash",
        type: "varchar",
        length: 64,
    })
        inputHash: string

    /**
     * System prompt used for this run (nullable).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "System prompt used for this run.",
        },
    )
    @Column({
        name: "system_prompt",
        type: "text",
        nullable: true,
    })
        systemPrompt: string | null

    /**
     * User prompt used for this run.
     */
    @Field(
        () => String,
        {
            description: "User prompt used for this run.",
        },
    )
    @Column({
        name: "user_prompt",
        type: "text",
    })
        userPrompt: string

    /**
     * Sampling / generation parameters used for this run.
     */
    @Field(
        () => AiLabRunParamsObject,
        {
            description: "Sampling / generation parameters used for this run.",
        },
    )
    @Column({
        name: "params",
        type: "jsonb",
    })
        params: AiLabRunParamsObject

    /**
     * Concrete model name used for this run.
     */
    @Field(
        () => String,
        {
            description: "Concrete model name used for this run.",
        },
    )
    @Column({
        name: "model",
        type: "varchar",
    })
        model: string

    /**
     * Provider that served the run.
     */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider that served the run.",
        },
    )
    @Column({
        name: "model_provider",
        type: "enum",
        enum: ModelProvider,
        enumName: "model_provider",
    })
        provider: ModelProvider

    /**
     * AI lane the run was billed on (auto / premium).
     */
    @Field(
        () => GraphQLTypeAiMode,
        {
            description: "AI lane the run was billed on (auto / premium).",
        },
    )
    @Column({
        name: "ai_mode",
        type: "enum",
        enum: AiMode,
        enumName: "ai_mode",
    })
        mode: AiMode

    /**
     * Full model output once the run completes (nullable while streaming).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Full model output once the run completes.",
        },
    )
    @Column({
        name: "output",
        type: "text",
        nullable: true,
    })
        output: string | null

    /**
     * Prompt tokens consumed by the run.
     */
    @Field(
        () => Int,
        {
            description: "Prompt tokens consumed by the run.",
        },
    )
    @Column({
        name: "prompt_tokens",
        type: "int",
        default: 0,
    })
        promptTokens: number

    /**
     * Completion tokens produced by the run.
     */
    @Field(
        () => Int,
        {
            description: "Completion tokens produced by the run.",
        },
    )
    @Column({
        name: "completion_tokens",
        type: "int",
        default: 0,
    })
        completionTokens: number

    /**
     * Estimated cost of the run in credits.
     */
    @Field(
        () => Int,
        {
            description: "Estimated cost of the run in credits.",
        },
    )
    @Column({
        name: "estimated_cost_credits",
        type: "int",
        default: 0,
    })
        estimatedCostCredits: number

    /**
     * Lifecycle status of the run.
     */
    @Field(
        () => GraphQLTypeAiLabRunStatus,
        {
            description: "Lifecycle status of the run.",
        },
    )
    @Column({
        name: "ai_lab_run_status",
        type: "enum",
        enum: AiLabRunStatus,
        enumName: "ai_lab_run_status",
    })
        status: AiLabRunStatus

    /**
     * Error message when the run failed (nullable).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Error message when the run failed.",
        },
    )
    @Column({
        name: "error_message",
        type: "text",
        nullable: true,
    })
        errorMessage: string | null
}
