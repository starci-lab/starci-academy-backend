import {
    Column,
    Entity,
} from "typeorm"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    GraphQLTypePaymentType,
    PaymentType,
    GraphQLTypeQuotaType,
    QuotaType,
} from "../enums"

/**
 * PaymentGateway Entity: Stores configuration and current usage quotas for payment providers.
 */
@ObjectType({
    description: "PaymentGateway stores configuration and current usage quotas for payment providers.",
})
@Entity("payment_gateways")
export class PaymentGatewayEntity extends UuidAbstractEntity {
    /**
     * The name/type of the payment gateway.
     */
    @Field(
        () => GraphQLTypePaymentType,
        {
            description: "The name/type of the payment gateway.",
        },
    )
    @Column({
        name: "name",
        type: "enum",
        enum: PaymentType,
        unique: true,
    })
        name: PaymentType

    /**
     * Priority for selecting the gateway when multiple are active (lower number = higher priority).
     */
    @Field(
        () => Int,
        {
            description: "Priority for selecting the gateway when multiple are active.",
        },
    )
    @Column({
        name: "priority",
        type: "int",
        default: 1,
    })
        priority: number

    /**
     * Is the gateway currently active/enabled by administrators?
     */
    @Field(
        () => Boolean,
        {
            description: "Is the gateway currently active/enabled by administrators?",
        },
    )
    @Column({
        name: "is_active",
        type: "boolean",
        default: true,
    })
        isActive: boolean

    /**
     * The type of quota management for this gateway.
     */
    @Field(
        () => GraphQLTypeQuotaType,
        {
            description: "The type of quota management for this gateway.",
        },
    )
    @Column({
        name: "quota_type",
        type: "enum",
        enum: QuotaType,
    })
        quotaType: QuotaType

    /**
     * The maximum number of transactions allowed.
     */
    @Field(
        () => Int,
        {
            description: "The maximum number of transactions allowed.",
        },
    )
    @Column({
        name: "limit_amount",
        type: "int",
        default: 0,
    })
        limitAmount: number

    /**
     * The current number of successful transactions.
     */
    @Field(
        () => Int,
        {
            description: "The current number of successful transactions.",
        },
    )
    @Column({
        name: "current_usage",
        type: "int",
        default: 0,
    })
        currentUsage: number

    /**
     * The date when the usage should be reset (for monthly quotas).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The date when the usage should be reset (for monthly quotas).",
        },
    )
    @Column({
        name: "reset_date",
        type: "timestamp",
        nullable: true,
    })
        resetDate: Date | null
}
