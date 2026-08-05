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
    MilestoneTaskApproachCriteriaLangEntity,
} from "./milestone-task-approach-criteria-lang.entity"

@Entity("milestone_task_approach_criteria")
/**
 * SCHEMA V2 APPROACH criterion of a milestone task (one yes/no item grading the per-language
 * mechanism / how it was built).
 *
 * Mirrors the Challenge V2 design (criterion-first, normalized — no jsonb): the agnostic fields
 * (`orderIndex`, `score`, `critical`) live here; the per-language prose lives in
 * {@link MilestoneTaskApproachCriteriaLangEntity} (one row per language: typescript/java/csharp/go).
 * English-only grading rubric — INTERNAL, NOT in GraphQL.
 */
export class MilestoneTaskApproachCriteriaEntity extends UuidAbstractEntity {
    /**
     * Display/grading order within the task's approach rubric.
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
     * Explicit points awarded when this criterion is met (e.g. 40 / 15 / 15).
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
     * Parent milestone task this approach criterion belongs to.
     */
    @ManyToOne(
        () => MilestoneTaskEntity,
        (milestoneTask: MilestoneTaskEntity) => milestoneTask.approachCriteria,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        foreignKeyConstraintName: "fk_mtask_approach_criteria_mtask",
    })
        milestoneTask: MilestoneTaskEntity

    /**
     * Parent milestone task ID.
     */
    @RelationId(
        (criteria: MilestoneTaskApproachCriteriaEntity) => criteria.milestoneTask,
    )
        milestoneTaskId: string

    /**
     * Per-language prose for this criterion (one row per programming language).
     */
    @OneToMany(
        () => MilestoneTaskApproachCriteriaLangEntity,
        (lang: MilestoneTaskApproachCriteriaLangEntity) => lang.approachCriteria,
        {
            cascade: true,
        },
    )
        langs: Array<MilestoneTaskApproachCriteriaLangEntity>
}
