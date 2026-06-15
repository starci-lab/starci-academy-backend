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

/**
 * CQRS projection of a user's coding-practice aggregate — ONE ROW PER user.
 * The inherited jsonb `value` holds `{ byLanguage: [{ key, solved }], byDifficulty:
 * [{ key, solved }], history: [{ problemTitle, difficulty, languages, firstSolvedAt }] }`,
 * recomputed from the `coding_submissions` ledger (the heavy GROUP BYs run only in
 * the projection's recompute, never inline at read time). Read with a TTL
 * lazy-refresh; kept fresh by CDC on `coding_submissions`.
 */
@Entity("user_coding_projections")
export class UserCodingProjectionEntity extends AbstractProjectionEntity {
    /** Target user id — the natural (primary) key. */
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
        foreignKeyConstraintName: "fk_user_id_user_coding_projections_users",
    })
        user: UserEntity
}
