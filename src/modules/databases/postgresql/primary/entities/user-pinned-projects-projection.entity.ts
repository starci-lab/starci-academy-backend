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

@Entity("user_pinned_projects_projections")
/**
 * CQRS projection of a user's pinned projects -- ONE ROW PER user. The inherited
 * jsonb `value` holds an ORDERED array of pin states under `value.pins`:
 * `{ pins: [{ id, type, title, description, url, techStack, isVerified,
 * orderIndex }] }`, ordered by `orderIndex` ascending. Recomputed from the
 * `user_pinned_projects` base table LEFT JOINed with the linked enrollment (for
 * `isVerified`) and course (title fallback). Read with a TTL lazy-refresh; kept
 * fresh by CDC on `user_pinned_projects`, `enrollments`, and `courses`.
 */
export class UserPinnedProjectsProjectionEntity extends AbstractProjectionEntity {
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
        foreignKeyConstraintName: "fk_user_id_user_pinned_projects_projections_users",
    })
        user: UserEntity
}
