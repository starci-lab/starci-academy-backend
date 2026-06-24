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
    CommunityPostCommentEntity,
} from "./community-post-comment.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "../enums"

/**
 * A single user's reaction on a community post comment. A user holds at most one
 * reaction per comment (enforced by the composite unique); changing the emotion
 * updates the row. Mirrors {@link CommentReactionEntity}.
 */
@ObjectType({
    description: "A user's Facebook-style reaction on a community post comment.",
})
@Entity("community_post_comment_reactions")
@Unique(
    "UQ_community_post_comment_reactions_comment_user",
    [
        "comment",
        "user",
    ],
)
export class CommunityPostCommentReactionEntity extends UuidAbstractEntity {
    /**
     * The emotion kind the user dropped on the comment.
     */
    @Field(
        () => GraphQLTypeReactionType,
        {
            description: "The emotion kind the user dropped on the comment.",
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
     * Comment the reaction belongs to.
     */
    @ManyToOne(
        () => CommunityPostCommentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "comment_id",
        foreignKeyConstraintName:
            "fk_comment_id_community_post_comment_reactions_community_post_comments",
    })
        comment: CommunityPostCommentEntity

    /**
     * Owning comment id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Owning comment id.",
        },
    )
    @RelationId(
        (commentReaction: CommunityPostCommentReactionEntity) => commentReaction.comment,
    )
        commentId: string

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
        foreignKeyConstraintName: "fk_user_id_community_post_comment_reactions_users",
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
        (commentReaction: CommunityPostCommentReactionEntity) => commentReaction.user,
    )
        userId: string
}
