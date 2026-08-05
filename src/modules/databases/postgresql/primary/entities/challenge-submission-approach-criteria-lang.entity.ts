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
    ChallengeSubmissionApproachCriteriaEntity,
} from "./challenge-submission-approach-criteria.entity"

@Entity("challenge_submission_approach_criteria_langs")
/**
 * Per-language prose for a SCHEMA V2 approach criterion (one row per programming language).
 *
 * English-only grading rubric (internal -- NOT exposed via GraphQL); no per-locale translation table
 * because the rubric is never translated. Holds the criterion's `body` text for one language.
 */
export class ChallengeSubmissionApproachCriteriaLangEntity extends UuidAbstractEntity {
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
     * Parent approach criterion this prose belongs to.
     */
    @ManyToOne(
        () => ChallengeSubmissionApproachCriteriaEntity,
        (criteria: ChallengeSubmissionApproachCriteriaEntity) => criteria.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_approach_criteria_id",
        foreignKeyConstraintName: "fk_approach_criteria_lang_criteria",
    })
        approachCriteria: ChallengeSubmissionApproachCriteriaEntity

    /**
     * Parent approach criterion ID.
     */
    @RelationId(
        (lang: ChallengeSubmissionApproachCriteriaLangEntity) => lang.approachCriteria,
    )
        approachCriteriaId: string
}
