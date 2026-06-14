import {
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Directed follow edge between two users (GitHub-style social graph).
 *
 * A row means `follower` follows `following`. The pair is unique so a user can
 * follow another at most once; both sides cascade-delete with the user.
 */
@Entity("user_follows")
@Unique(
    "UQ_user_follows_follower_following",
    [
        "follower",
        "following",
    ],
)
export class UserFollowEntity extends UuidAbstractEntity {
    /** The user who initiated the follow. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "follower_id",
        foreignKeyConstraintName: "fk_follower_id_user_follows_users",
    })
        follower: UserEntity

    /** Id of the follower (virtual, read from the relation). */
    @RelationId(
        (userFollow: UserFollowEntity) => userFollow.follower,
    )
        followerId: string

    /** The user being followed. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "following_id",
        foreignKeyConstraintName: "fk_following_id_user_follows_users",
    })
        following: UserEntity

    /** Id of the followed user (virtual, read from the relation). */
    @RelationId(
        (userFollow: UserFollowEntity) => userFollow.following,
    )
        followingId: string
}
