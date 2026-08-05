import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    MilestoneTaskOutcomeCriteriaLangEntity,
} from "./milestone-task-outcome-criteria-lang.entity"

@Entity("milestone_task_outcome_criteria")
/**
 * SCHEMA V2 OUTCOME criterion of a milestone task (one yes/no item grading observable behaviour).
 *
 * Mirrors the Challenge V2 design (criterion-first, normalized — no jsonb): the agnostic fields
 * (`orderIndex`, `score`, `critical`) live here; the per-language prose lives in
 * {@link MilestoneTaskOutcomeCriteriaLangEntity}. Outcome prose is agnostic, so a single
 * `lang = "agnostic"` row is stored. English-only grading rubric — INTERNAL, NOT in GraphQL.
 */
export class MilestoneTaskOutcomeCriteriaEntity extends UuidAbstractEntity {
    /**
     * Display/grading order within the task's outcome rubric.
     */
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Explicit points awarded when this criterion is met (e.g. 10).
     */
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

    /**
     * When true, failing this criterion zeroes the whole task.
     */
    @Column({
        name: "critical",
        type: "boolean",
        default: false,
    })
        critical: boolean

    /**
     * Parent milestone task this outcome criterion belongs to.
     */
    @ManyToOne(
        () => MilestoneTaskEntity,
        (milestoneTask: MilestoneTaskEntity) => milestoneTask.outcomeCriteria,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName: "fk_mtask_outcome_criteria_mtask",
    })
        milestoneTask: MilestoneTaskEntity

    /**
     * Parent milestone task ID.
     */
    @RelationId(
        (criteria: MilestoneTaskOutcomeCriteriaEntity) => criteria.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Per-language prose for this criterion (agnostic outcome → a single `agnostic` row).
     */
    @OneToMany(
        () => MilestoneTaskOutcomeCriteriaLangEntity,
        (lang: MilestoneTaskOutcomeCriteriaLangEntity) => lang.outcomeCriteria,
        {
            cascade: true,
        },
    )
        langs: Array<MilestoneTaskOutcomeCriteriaLangEntity>
}
