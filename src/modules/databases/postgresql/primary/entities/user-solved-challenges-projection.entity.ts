import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    UserEntity,
} from "./user.entity"

@Entity("user_solved_challenges_projections")
/**
 * CQRS projection of a user's passed challenge submissions (with their submitted
 * git / docs link) -- ONE ROW PER user. The inherited jsonb `value` holds
 * `{ challenges: [{ title, submissionUrl, submissionType, selectedLang, difficulty, score, courseTitle, passedAt }] }`,
 * recomputed from the `user_challenge_submission_attempts` ledger (DISTINCT-ON
 * join). Read with a TTL lazy-refresh; kept fresh by CDC on
 * `user_challenge_submission_attempts`.
 */
export class UserSolvedChallengesProjectionEntity extends AbstractProjectionEntity {
    /** Target user id -- the natural (primary) key. */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** The user this projection belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_user_solved_challenges_projections_users",
    })
        user: UserEntity
}
