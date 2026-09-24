import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    RelationId,
} from "typeorm"
import {
    GraphQLTypeProSubscriptionStatus,
    ProSubscriptionStatus,
} from "../enums/pro-subscription-status"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "The dedicated StarCi Pro subscription owned by one learner.",
})
@Entity("pro_subscriptions")
/** Single date-aware Pro lifecycle row owned by one learner. */
export class ProSubscriptionEntity extends UuidAbstractEntity {
    @Field(() => GraphQLTypeProSubscriptionStatus)
    @Column({
        name: "status",
        type: "enum",
        enum: ProSubscriptionStatus,
        enumName: "pro_subscription_status",
        default: ProSubscriptionStatus.Active,
    })
        status: ProSubscriptionStatus

    @Field(() => Date)
    @Column({
        name: "current_period_end",
        type: "timestamptz",
    })
        currentPeriodEnd: Date

    @Field(() => Boolean,
        {
            description: "Whether another period should be charged automatically; V1 is manual renewal.",
        })
    @Column({
        name: "renewal_intent",
        type: "boolean",
        default: false,
    })
        renewalIntent: boolean

    @Field(() => Date,
        {
            nullable: true,
        })
    @Column({
        name: "cancelled_at",
        type: "timestamptz",
        nullable: true,
    })
        cancelledAt: Date | null

    @Field(() => Int)
    @Column({
        name: "access_version",
        type: "int",
        default: 1,
    })
        accessVersion: number

    @OneToOne(() => UserEntity,
        {
            onDelete: "CASCADE",
        })
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_pro_subscriptions_users",
    })
        user: UserEntity

    @Field(() => String)
    @RelationId((subscription: ProSubscriptionEntity) => subscription.user)
        userId: string
}
