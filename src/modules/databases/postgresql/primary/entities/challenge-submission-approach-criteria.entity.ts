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
    ChallengeSubmissionApproachCriteriaLangEntity,
} from "./challenge-submission-approach-criteria-lang.entity"

/**
 * SCHEMA V2 APPROACH-criteria item attached to a challenge submission slot (one row per criterion).
 *
 * Normalized (no jsonb): the criterion's agnostic fields (`orderIndex`, `critical`) live here; the
 * per-language prose lives in {@link ChallengeSubmissionApproachCriteriaLangEntity}. English-only
 * grading rubric (internal — NOT exposed via GraphQL). Authored in
 * `criterias/<submissionIndex>/approach.md` on the course mount. Per-item score is NOT stored — the
 * 70/30 weighting lives on the submission (`approachScore`/`outcomeScore`).
 */
@Entity("challenge_submission_approach_criteria")
export class ChallengeSubmissionApproachCriteriaEntity extends UuidAbstractEntity {
    /**
     * Display order of this criterion within the submission's approach rubric.
     */
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

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
     * Parent challenge submission this approach criterion belongs to.
     */
    @ManyToOne(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.approachCriteria,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_id",
        foreignKeyConstraintName: "fk_approach_criteria_challenge_submission",
    })
        challengeSubmission: ChallengeSubmissionEntity

    /**
     * Parent challenge submission ID.
     */
    @RelationId(
        (criteria: ChallengeSubmissionApproachCriteriaEntity) => criteria.challengeSubmission,
    )
        challengeSubmissionId: string

    /**
     * Per-language prose for this criterion (one row per programming language).
     */
    @OneToMany(
        () => ChallengeSubmissionApproachCriteriaLangEntity,
        (lang: ChallengeSubmissionApproachCriteriaLangEntity) => lang.approachCriteria,
        {
            cascade: true,
        },
    )
        langs: Array<ChallengeSubmissionApproachCriteriaLangEntity>
}
