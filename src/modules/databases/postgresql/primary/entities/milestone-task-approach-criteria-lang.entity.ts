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
    MilestoneTaskApproachCriteriaEntity,
} from "./milestone-task-approach-criteria.entity"

/**
 * Per-language prose for a SCHEMA V2 approach criterion (one row per programming language).
 * English-only grading rubric — INTERNAL, no GraphQL, no per-locale translation.
 */
@Entity("milestone_task_approach_criteria_langs")
export class MilestoneTaskApproachCriteriaLangEntity extends UuidAbstractEntity {
    /**
     * Programming language for this prose (typescript/java/csharp/go).
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
     * Parent approach criterion this prose belongs to.
     */
    @ManyToOne(
        () => MilestoneTaskApproachCriteriaEntity,
        (criteria: MilestoneTaskApproachCriteriaEntity) => criteria.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_approach_criteria_id",
        foreignKeyConstraintName: "fk_mtac_lang_mtac",
    })
        approachCriteria: MilestoneTaskApproachCriteriaEntity

    /**
     * Parent approach criterion ID.
     */
    @RelationId(
        (lang: MilestoneTaskApproachCriteriaLangEntity) => lang.approachCriteria,
    )
        approachCriteriaId: string
}
