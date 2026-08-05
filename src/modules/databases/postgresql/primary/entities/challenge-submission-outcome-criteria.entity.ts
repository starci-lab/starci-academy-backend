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
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"
import {
    ChallengeSubmissionOutcomeCriteriaLangEntity,
} from "./challenge-submission-outcome-criteria-lang.entity"

@Entity("challenge_submission_outcome_criteria")
/**
 * SCHEMA V2 OUTCOME-criteria item attached to a challenge submission slot (one row per criterion).
 *
 * Normalized (no jsonb): the criterion's agnostic fields (`orderIndex`, `critical`) live here; the
 * per-language prose lives in {@link ChallengeSubmissionOutcomeCriteriaLangEntity}. Outcome criteria
 * grade observable behaviour/output. English-only grading rubric (internal -- NOT in GraphQL).
 * Authored in `criterias/<submissionIndex>/outcome.md`. Per-item score is NOT stored -- the 70/30
 * weighting lives on the submission.
 */
export class ChallengeSubmissionOutcomeCriteriaEntity extends UuidAbstractEntity {
    /**
     * Display order of this criterion within the submission's outcome rubric.
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
     * When true, failing this criterion zeroes the whole submission.
     */
    @Column({
        name: "critical",
        type: "boolean",
        default: false,
    })
        critical: boolean

    /**
     * Parent challenge submission this outcome criterion belongs to.
     */
    @ManyToOne(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.outcomeCriteria,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_id",
        foreignKeyConstraintName: "fk_outcome_criteria_challenge_submission",
    })
        challengeSubmission: ChallengeSubmissionEntity

    /**
     * Parent challenge submission ID.
     */
    @RelationId(
        (criteria: ChallengeSubmissionOutcomeCriteriaEntity) => criteria.challengeSubmission,
    )
        challengeSubmissionId: string

    /**
     * Per-language prose for this criterion (one row per programming language).
     */
    @OneToMany(
        () => ChallengeSubmissionOutcomeCriteriaLangEntity,
        (lang: ChallengeSubmissionOutcomeCriteriaLangEntity) => lang.outcomeCriteria,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeSubmissionOutcomeCriteriaLangEntity>
}
