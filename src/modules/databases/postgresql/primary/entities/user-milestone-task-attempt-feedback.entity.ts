import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    GraphQLTypeMilestoneSeverity,
    Locale,
    MilestoneSeverity,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserMilestoneTaskAttemptEntity,
} from "./user-milestone-task-attempt.entity"

@ObjectType({
    description: "Structured feedback item for a user milestone task attempt.",
})
@Entity("user_milestone_task_attempt_feedbacks")
/**
 * Structured feedback item for a user milestone task attempt.
 * Describes what implementation is missing or wrong.
 */
export class UserMilestoneTaskAttemptFeedbackEntity extends UuidAbstractEntity {
    /**
     * Short summary message for this feedback item.
     */
    @Field(
        () => String,
        {
            description: "Short summary message for this feedback item.",
        },
    )
    @Column({
        name: "message",
        type: "text",
    })
        message: string

    /**
     * Severity of the feedback item.
     */
    @Field(
        () => GraphQLTypeMilestoneSeverity,
        {
            description: "Severity of the feedback item.",
        },
    )
    @Column({
        name: "severity",
        type: "enum",
        enum: MilestoneSeverity,
        enumName: "milestone_severity",
        default: MilestoneSeverity.Medium,
    })
        severity: MilestoneSeverity

    /**
     * Ordering index within the feedback list.
     */
    @Field(
        () => Int,
        {
            description: "Ordering index within the feedback list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

        @Field(
            () => String,
            {
                nullable: true,
                description: "Source location hint, e.g. file:line.",
            },
        )
    @Column({
        name: "location",
        type: "varchar",
        length: 512,
        nullable: true,
    })
            location: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Suggested change (code snippet or instruction).",
        },
    )
    @Column({
        name: "suggestion",
        type: "text",
        nullable: true,
    })
        suggestion: string | null


    /**
     * Default locale for this feedback.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this feedback.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent attempt.
     */
    @Field(
        () => UserMilestoneTaskAttemptEntity,
        {
            description: "Parent attempt.",
        },
    )
    @ManyToOne(
        () => UserMilestoneTaskAttemptEntity,
        (attempt: UserMilestoneTaskAttemptEntity) => attempt.feedbacks,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_milestone_task_attempt_id",
        foreignKeyConstraintName:
            "fk_attempt_id_user_milestone_task_attempt_feedbacks",
    })
        attempt: UserMilestoneTaskAttemptEntity

    @Field(
        () => ID,
        {
            description: "Parent attempt ID.",
        },
    )
    @RelationId(
        (feedback: UserMilestoneTaskAttemptFeedbackEntity) => feedback.attempt,
    )
        attemptId: string
}
