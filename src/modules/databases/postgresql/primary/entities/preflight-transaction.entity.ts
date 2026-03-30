import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypePreflightTransactionStatus,
    PreflightTransactionStatus,
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
} from "../enums"

/**
 * PayOS checkout preflight: one user may have many attempts per course over time.
 */
@ObjectType({
    description: "PayOS checkout preflight: one user may have many attempts per course over time.",
})
@Entity("preflight_transactions")
export class PreflightTransactionEntity extends UuidAbstractEntity {
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
    })
        user: UserEntity

    /**
     * The course associated with the preflight transaction.
     */
    @Field(
        () => CourseEntity,
        {
            nullable: false,
            description: "The course associated with the preflight transaction.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
    })
        course: CourseEntity

    /**
     * The ID of the user who made the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The ID of the user who made the preflight transaction.",
        },
    )
    @Column({
        name: "user_id",
        type: "varchar",
    })
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
    @Column({
        name: "course_id",
        type: "varchar",
    })
        courseId: string

    /**
     * The order code of the preflight transaction.
     */
    @Field(
        () => String,
        {
            description: "The order code of the preflight transaction.",
        },
    )
    @Column({
        name: "order_code",
        type: "varchar",
        length: 64,
    })
        orderCode: string

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
     * The payment link ID returned by the payment provider.
     */
    @Field(
        () => String,
        {
            description: "The payment link ID returned by the payment provider.",
        },
    )
    @Column({
        name: "payment_link_id",
        type: "varchar",
        length: 255,
    })
        paymentLinkId: string

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
     * The current status of the preflight transaction.
     */
    @Field(
        () => GraphQLTypePreflightTransactionStatus,
        {
            description: "The current status of the preflight transaction.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: PreflightTransactionStatus,
    })
        status: PreflightTransactionStatus

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
}