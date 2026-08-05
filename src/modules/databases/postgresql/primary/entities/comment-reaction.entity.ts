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
    ContentCommentEntity,
} from "./content-comment.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "../enums/reaction-type"

@ObjectType({
    description: "A user's Facebook-style reaction on a content comment.",
})
@Entity("comment_reactions")
@Unique(
    "UQ_comment_reactions_comment_user",
    [
        "comment",
        "user",
    ],
)
/**
 * A single user's reaction on a content comment. A user holds at most one reaction
 * per comment (enforced by the composite unique); changing the emotion updates the row.
 */
export class CommentReactionEntity extends UuidAbstractEntity {
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
        () => ContentCommentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "comment_id",
        foreignKeyConstraintName: "fk_comment_id_comment_reactions_content_comments",
    })
        comment: ContentCommentEntity

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
        (commentReaction: CommentReactionEntity) => commentReaction.comment,
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
        foreignKeyConstraintName: "fk_user_id_comment_reactions_users",
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
        (commentReaction: CommentReactionEntity) => commentReaction.user,
    )
        userId: string
}
