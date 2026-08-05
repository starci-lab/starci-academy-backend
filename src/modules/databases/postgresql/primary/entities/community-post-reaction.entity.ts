import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
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
    CommunityPostEntity,
} from "./community-post.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "../enums"

@ObjectType({
    description: "A user's Facebook-style reaction on a community post.",
})
@Entity("community_post_reactions")
@Unique(
    "UQ_community_post_reactions_post_user",
    [
        "post",
        "user",
    ],
)
/**
 * A single user's reaction on a community post. A user holds at most one reaction
 * per post (enforced by the composite unique); changing the emotion updates the
 * row. Mirrors {@link ActivityReactionEntity}.
 */
export class CommunityPostReactionEntity extends UuidAbstractEntity {
    /**
     * The emotion kind the user dropped on the post.
     */
    @Field(
        () => GraphQLTypeReactionType,
        {
            description: "The emotion kind the user dropped on the post.",
        },
    )
    @Column({
        name: "type",
        type: "enum",
        enum: ReactionType,
        enumName: "reaction_type",
    })
        type: ReactionType

    /**
     * Post the reaction belongs to.
     */
    @ManyToOne(
        () => CommunityPostEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "post_id",
        foreignKeyConstraintName: "fk_post_id_community_post_reactions_community_posts",
    })
        post: CommunityPostEntity

    /**
     * Owning post id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Owning post id.",
        },
    )
    @RelationId(
        (postReaction: CommunityPostReactionEntity) => postReaction.post,
    )
        postId: string

    /**
     * User who reacted.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_community_post_reactions_users",
    })
        user: UserEntity

    /**
     * Reacting user id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Reacting user id.",
        },
    )
    @RelationId(
        (postReaction: CommunityPostReactionEntity) => postReaction.user,
    )
        userId: string
}
