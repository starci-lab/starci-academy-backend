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
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    ContentEntity,
} from "./content.entity"

/**
 * Tracks a user's interaction with a specific content row (read status, favorites).
 */
@ObjectType({
    description: "User's interaction state with a specific content (read, favorite).",
})
@Entity("user_contents")
@Unique(["userId",
    "contentId"])
export class UserContentEntity extends UuidAbstractEntity {
    /**
     * User who owns this state.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_user_contents_users",
    })
        user: UserEntity

    @Field(
        () => ID,
        {
            description: "User ID.",
        },
    )
    @Column({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /**
     * Content this state refers to.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_user_contents_contents",
    })
        content: ContentEntity

    @Field(
        () => ID,
        {
            description: "Content ID.",
        },
    )
    @Column({
        name: "content_id",
        type: "uuid",
    })
        contentId: string

    /**
     * Whether the user has marked this content as read.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the user has marked this content as read.",
        },
    )
    @Column({
        name: "is_read",
        type: "boolean",
        default: false,
    })
        isRead: boolean

    /**
     * Whether the user has favorited this content.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the user has favorited this content.",
        },
    )
    @Column({
        name: "is_favorite",
        type: "boolean",
        default: false,
    })
        isFavorite: boolean
}
