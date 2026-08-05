import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MilestoneTaskOutcomeCriteriaEntity,
} from "./milestone-task-outcome-criteria.entity"

@Entity("milestone_task_outcome_criteria_langs")
/**
 * Per-language prose for a SCHEMA V2 outcome criterion (one row per programming language; outcome is
 * agnostic so usually a single `agnostic` row). English-only grading rubric -- INTERNAL, no GraphQL,
 * no per-locale translation (the rubric is never translated).
 */
export class MilestoneTaskOutcomeCriteriaLangEntity extends UuidAbstractEntity {
    /**
     * Programming language for this prose (typescript/java/csharp/go, or `agnostic`).
     */
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Criterion prose (English): what is checked / observable evidence / what fails it.
     */
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent outcome criterion this prose belongs to.
     */
    @ManyToOne(
        () => MilestoneTaskOutcomeCriteriaEntity,
        (criteria: MilestoneTaskOutcomeCriteriaEntity) => criteria.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_outcome_criteria_id",
        foreignKeyConstraintName: "fk_mtoc_lang_mtoc",
    })
        outcomeCriteria: MilestoneTaskOutcomeCriteriaEntity

    /**
     * Parent outcome criterion ID.
     */
    @RelationId(
        (lang: MilestoneTaskOutcomeCriteriaLangEntity) => lang.outcomeCriteria,
    )
        outcomeCriteriaId: string
}
