import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserMilestoneTaskEntity,
} from "./user-milestone-task.entity"
import {
    UserMilestoneTaskAttemptFeedbackEntity,
} from "./user-milestone-task-attempt-feedback.entity"

/**
 * A single review attempt for a user milestone task.
 */
@ObjectType({
    description: "A single review attempt for a user milestone task.",
})
@Entity("user_milestone_task_attempts")
export class UserMilestoneTaskAttemptEntity extends UuidAbstractEntity {
    /**
     * The sequence number of this attempt.
     */
    @Field(
        () => Int,
        {
            description: "The sequence number of this attempt.",
        },
    )
    @Column({
        name: "attempt_number",
        type: "int",
    })
        attemptNumber: number

    /**
     * Whether the attempt passed.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the attempt passed.",
        },
    )
    @Column({
        name: "passed",
        type: "boolean",
    })
        passed: boolean

    /**
     * Score achieved in this attempt.
     */
    @Field(
        () => Int,
        {
            description: "Score achieved in this attempt.",
        },
    )
    @Column({
        name: "score",
        type: "int",
    })
        score: number

    /**
     * Feedback summary for this attempt.
     */
    @Field(
        () => String,
        {
            description: "Feedback summary for this attempt.",
            nullable: true,
        },
    )
    @Column({
        name: "short_feedback",
        type: "text",
    })
        shortFeedback: string

    /**
     * When the attempt was finished processing.
     */
    @Field(
        () => Date,
        {
            description: "When the attempt was finished processing.",
            nullable: true,
        },
    )
    @Column({
        name: "processed_at",
        type: "timestamptz",
        nullable: true,
    })
        processedAt: Date | null

    /**
     * Default locale for this attempt.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this attempt.",
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
     * Parent user milestone task.
     */
    @Field(
        () => UserMilestoneTaskEntity,
        {
            description: "Parent user milestone task.",
        },
    )
    @ManyToOne(
        () => UserMilestoneTaskEntity,
        (userMilestoneTask: UserMilestoneTaskEntity) => userMilestoneTask.attempts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_milestone_task_id",
        foreignKeyConstraintName:
            "fk_user_milestone_task_id_user_milestone_task_attempts",
    })
        userMilestoneTask: UserMilestoneTaskEntity

    @Field(
        () => ID,
        {
            description: "Parent user milestone task ID.",
        },
    )
    @RelationId(
        (attempt: UserMilestoneTaskAttemptEntity) => attempt.userMilestoneTask,
    )
        userMilestoneTaskId: string

    /**
     * Detailed feedback items for this attempt.
     */
    @Field(
        () => [UserMilestoneTaskAttemptFeedbackEntity],
        {
            nullable: true,
            description: "Detailed feedback items for this attempt.",
        },
    )
    @OneToMany(
        () => UserMilestoneTaskAttemptFeedbackEntity,
        (feedback: UserMilestoneTaskAttemptFeedbackEntity) => feedback.attempt,
        {
            cascade: true,
        },
    )
        feedbacks: Array<UserMilestoneTaskAttemptFeedbackEntity>
}
