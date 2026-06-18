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
    ActivityEntity,
} from "./activity.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "../enums"

/**
 * A single user's reaction on a feed activity (someone passing a challenge,
 * earning a badge…). A user holds at most one reaction per activity (composite
 * unique); changing the emotion updates the row. Mirrors {@link ContentReactionEntity}.
 * A user can never react to their OWN activity — enforced in the mutation service.
 */
@ObjectType({
    description: "A user's Facebook-style reaction on a feed activity.",
})
@Entity("activity_reactions")
@Unique(
    "UQ_activity_reactions_activity_user",
    [
        "activity",
        "user",
    ],
)
export class ActivityReactionEntity extends UuidAbstractEntity {
    /**
     * The emotion kind the user dropped on the activity.
     */
    @Field(
        () => GraphQLTypeReactionType,
        {
            description: "The emotion kind the user dropped on the activity.",
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
     * Activity the reaction belongs to.
     */
    @ManyToOne(
        () => ActivityEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "activity_id",
        foreignKeyConstraintName: "fk_activity_id_activity_reactions_activities",
    })
        activity: ActivityEntity

    /**
     * Owning activity id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Owning activity id.",
        },
    )
    @RelationId(
        (activityReaction: ActivityReactionEntity) => activityReaction.activity,
    )
        activityId: string

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
        foreignKeyConstraintName: "fk_user_id_activity_reactions_users",
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
        (activityReaction: ActivityReactionEntity) => activityReaction.user,
    )
        userId: string
}
