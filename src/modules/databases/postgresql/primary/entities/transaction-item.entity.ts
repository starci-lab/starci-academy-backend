import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    GraphQLTypePricingPhase,
    PricingPhase,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    TransactionEntity,
} from "./transaction.entity"

/**
 * A single course line of a multi-course (cart) checkout transaction.
 *
 * A cart checkout creates ONE {@link TransactionEntity} (the order: one gateway
 * payment for the summed total, `course` left null) plus one
 * `TransactionItemEntity` per course being bought. Each row records the per-course
 * price detail (VND {@link amount}, {@link discountPercent}, {@link pricingPhase})
 * so the charged breakdown is auditable, and — on payment success — the enroll
 * fan-out reads these rows to enqueue one enroll job per course. Single-course
 * `courseEnroll` checkouts do NOT create item rows (they carry `transaction.course`
 * directly); items exist only for multi-course orders.
 */
@ObjectType({
    description: "A single course line of a multi-course checkout transaction.",
})
@Entity("transaction_items")
@Index(["transaction"])
export class TransactionItemEntity extends UuidAbstractEntity {
    /**
     * The parent order (transaction) this line belongs to.
     */
    @Field(
        () => TransactionEntity,
        {
            description: "The parent order (transaction) this line belongs to.",
        },
    )
    @ManyToOne(
        () => TransactionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "transaction_id",
        foreignKeyConstraintName: "fk_transaction_id_transaction_items_transactions",
    })
        transaction: TransactionEntity

    /**
     * The course this line enrolls the buyer into on payment success.
     */
    @Field(
        () => CourseEntity,
        {
            description: "The course this line enrolls the buyer into on payment success.",
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
        foreignKeyConstraintName: "fk_course_id_transaction_items_courses",
    })
        course: CourseEntity

    /**
     * Id of the parent order (transaction).
     */
    @Field(
        () => ID,
        {
            description: "Id of the parent order (transaction).",
        },
    )
    @RelationId(
        (transactionItem: TransactionItemEntity) => transactionItem.transaction,
    )
        transactionId: string

    /**
     * Id of the course this line enrolls into.
     */
    @Field(
        () => ID,
        {
            description: "Id of the course this line enrolls into.",
        },
    )
    @RelationId(
        (transactionItem: TransactionItemEntity) => transactionItem.course,
    )
        courseId: string

    /**
     * The per-course charged amount in VND (already reflects {@link discountPercent}).
     * The parent transaction's `amount` is the sum of every line's `amount`.
     */
    @Field(
        () => Int,
        {
            description: "Per-course charged amount in VND (discount already applied).",
        },
    )
    @Column({
        name: "amount",
        type: "int",
    })
        amount: number

    /**
     * Loyalty discount percent applied to this line at checkout (0–100). Stored so
     * the per-course charged price matches what the buyer was shown.
     */
    @Field(
        () => Int,
        {
            description: "Loyalty discount percent applied to this line (0–100).",
        },
    )
    @Column({
        name: "discount_percent",
        type: "int",
        default: 0,
    })
        discountPercent: number

    /**
     * The course's pricing phase at checkout time for this line.
     */
    @Field(
        () => GraphQLTypePricingPhase,
        {
            description: "The course's pricing phase at checkout time for this line.",
        },
    )
    @Column({
        name: "pricing_phase",
        type: "enum",
        enum: PricingPhase,
    })
        pricingPhase: PricingPhase
}
