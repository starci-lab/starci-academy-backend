import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeActionType,
    GraphQLTypeTransactionStatus,
    TransactionStatus,
} from "../enums"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserEntity,
} from "./user.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    GraphQLTypePricingPhase,
    GraphQLTypePaymentType,
    PaymentType,
    PricingPhase,
    ActionType,
} from "../enums"

/**
 * Transaction entity: capture the payment details of a user for a course (course may be null).
 */
@ObjectType({
    description: "Transaction capture the payment details of a user for a course (course may be null).",
})
@Entity("transactions")
export class TransactionEntity extends UuidAbstractEntity {
    /**
     * The user who made the preflight transaction.
     */
    @Field(
        () => UserEntity,
        {
            nullable: false,
            description: "The user who made the preflight transaction.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_transactions_users",
    })
        user: UserEntity

    /**
     * The course associated with the preflight transaction.
     */
    @Field(
        () => CourseEntity,
        {
            nullable: true,
            description: "The course associated with the preflight transaction.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_transactions_courses",
    })
        course: CourseEntity | null

    /**
     * The ID of the user who made the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The ID of the user who made the preflight transaction.",
        },
    )
    @RelationId(
        (t: TransactionEntity) => t.user,
    )
        userId: string

    /**
     * The ID of the course associated with the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The ID of the course associated with the preflight transaction.",
        },
    )
    @RelationId(
        (transaction: TransactionEntity) => transaction.course,
    )
        courseId: string | null

    /**
     * The order code of the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The reference ID of the preflight transaction.",
        },
    )
    @Column({
        name: "reference_id",
        type: "varchar",
        length: 64,
    })
        referenceId: string

    /**
     * The payment amount of the preflight transaction.
     */
    @Field(
        () => Int,
        {
            description: "The payment amount of the preflight transaction.",
        },
    )
    @Column({
        name: "amount",
        type: "int",
    })
        amount: number

    /**
     * The pricing phase applied to the preflight transaction.
     */
    @Field(
        () => GraphQLTypePricingPhase,
        {
            description: "The pricing phase applied to the preflight transaction.",
        },
    )
    @Column({
        name: "pricing_phase",
        type: "enum",
        enum: PricingPhase,
    })
        pricingPhase: PricingPhase

    /**
     * The checkout URL for the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The checkout URL for the preflight transaction.",
        },
    )
    @Column({
        name: "checkout_url",
        type: "text",
    })
        checkoutUrl: string

    /**
     * The current status of the transaction.
     */
    @Field(
        () => GraphQLTypeTransactionStatus,
        {
            description: "The current status of the transaction.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: TransactionStatus,
    })
        status: TransactionStatus

    /**
     * The payment provider type of the preflight transaction.
     */
    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "The payment provider type of the preflight transaction.",
        },
    )
    @Column({
        name: "payment_type",
        type: "enum",
        enum: PaymentType,
    })
        paymentType: PaymentType

    /**
     * The action type of the preflight transaction.
     */
    @Field(
        () => GraphQLTypeActionType,
        {
            description: "The action type of the preflight transaction.",
        },
    )
    @Column({
        name: "action_type",
        type: "enum",
        enum: ActionType,
    })
        actionType: ActionType
}
