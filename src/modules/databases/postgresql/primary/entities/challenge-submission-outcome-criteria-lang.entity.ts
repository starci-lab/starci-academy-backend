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
    ChallengeSubmissionOutcomeCriteriaEntity,
} from "./challenge-submission-outcome-criteria.entity"

@Entity("challenge_submission_outcome_criteria_langs")
/**
 * Per-language prose for a SCHEMA V2 outcome criterion (one row per programming language).
 *
 * English-only grading rubric (internal — NOT exposed via GraphQL); no per-locale translation table
 * because the rubric is never translated. Holds the criterion's `body` text for one language.
 */
export class ChallengeSubmissionOutcomeCriteriaLangEntity extends UuidAbstractEntity {
    /**
     * Programming language for this criterion prose (e.g. typescript, java, csharp, go).
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
        () => ChallengeSubmissionOutcomeCriteriaEntity,
        (criteria: ChallengeSubmissionOutcomeCriteriaEntity) => criteria.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_outcome_criteria_id",
        foreignKeyConstraintName: "fk_outcome_criteria_lang_criteria",
    })
        outcomeCriteria: ChallengeSubmissionOutcomeCriteriaEntity

    /**
     * Parent outcome criterion ID.
     */
    @RelationId(
        (lang: ChallengeSubmissionOutcomeCriteriaLangEntity) => lang.outcomeCriteria,
    )
        outcomeCriteriaId: string
}
