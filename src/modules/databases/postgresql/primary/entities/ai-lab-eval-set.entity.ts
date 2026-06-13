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
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    AiLabEvalCaseEntity,
} from "./ai-lab-eval-case.entity"

/**
 * An AI Lab eval set: the graded "prompt challenge" backing a lesson challenge
 * or personal-project milestone task. Holds the judge rubric, pass threshold,
 * and the ordered eval cases a submitted prompt template is scored against.
 */
@ObjectType({
    description: "Graded AI Lab eval set backing a challenge or milestone task (rubric + cases).",
})
@Index(["challenge"])
@Index(["milestoneTask"])
@Entity("ai_lab_eval_sets")
export class AiLabEvalSetEntity extends UuidAbstractEntity {
    /**
     * Challenge this eval set backs (nullable when it backs a milestone task instead).
     */
    @Field(
        () => ChallengeEntity,
        {
            nullable: true,
            description: "Challenge this eval set backs.",
        },
    )
    @ManyToOne(
        () => ChallengeEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_ai_lab_eval_sets_challenges",
    })
        challenge: ChallengeEntity | null

    /**
     * Challenge ID (nullable).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Challenge ID.",
        },
    )
    @RelationId(
        (evalSet: AiLabEvalSetEntity) => evalSet.challenge,
    )
        challengeId: string

    /**
     * Milestone task this eval set backs (nullable when it backs a challenge instead).
     */
    @Field(
        () => MilestoneTaskEntity,
        {
            nullable: true,
            description: "Milestone task this eval set backs.",
        },
    )
    @ManyToOne(
        () => MilestoneTaskEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName: "fk_milestone_task_id_ai_lab_eval_sets_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity | null

    /**
     * Milestone task ID (nullable).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Milestone task ID.",
        },
    )
    @RelationId(
        (evalSet: AiLabEvalSetEntity) => evalSet.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Human-facing stable identifier from the eval set mount folder slug.
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the eval set mount folder slug.",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
    })
        slug: string

    /**
     * Rubric handed to the LLM judge for judge-kind cases.
     */
    @Field(
        () => String,
        {
            description: "Rubric handed to the LLM judge for judge-kind cases.",
        },
    )
    @Column({
        name: "judge_rubric",
        type: "text",
    })
        judgeRubric: string

    /**
     * Fraction of the weighted max score required to pass (0..1).
     */
    @Field(
        () => Float,
        {
            description: "Fraction of the weighted max score required to pass (0..1).",
        },
    )
    @Column({
        name: "pass_threshold",
        type: "float",
    })
        passThreshold: number

    /**
     * Ordered eval cases the submitted prompt template is scored against.
     */
    @Field(
        () => [AiLabEvalCaseEntity],
        {
            description: "Ordered eval cases the submitted prompt template is scored against.",
        },
    )
    @OneToMany(
        () => AiLabEvalCaseEntity,
        (evalCase: AiLabEvalCaseEntity) => evalCase.evalSet,
        {
            cascade: true,
        },
    )
        cases: Array<AiLabEvalCaseEntity>
}
